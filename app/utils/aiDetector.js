const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Limits text to approximately 4000 tokens
 * @param {string} text - The text to limit
 * @returns {string} - The limited text
 */
function limitTextLength(text) {
  // Approximate token count: ~4 chars per token, ~16000 chars for 4000 tokens
  const MAX_CHARS = 16000;

  if (text.length <= MAX_CHARS) {
    return text;
  }

  return text.substring(0, MAX_CHARS) + "...";
}

/**
 * Detects if text is AI-generated using Gemini Pro
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} - The analysis results
 */
async function detectAIContent(text) {
  try {
    // Limit text length
    const limitedText = limitTextLength(text);

    // Initialize Gemini 1.5 Pro model for more advanced analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Construct prompt for AI detection, humanization, plagiarism risk, and other analytics
    const prompt = `You are an expert linguistic analyst specializing in detecting AI-generated text, attempts to humanize AI text, and identifying potential plagiarism or unoriginal content. Analyze the following text thoroughly.

Content to Analyze:
---BEGIN_TEXT---
${limitedText}
---END_TEXT---

Please provide your analysis in JSON format ONLY. The JSON object should have the following structure and fields:

{
  "aiScore": "[Percentage (0-100) indicating likelihood the text is AI-generated. Higher means more likely AI-generated. E.g., 75]",
  "aiConfidence": "[Confidence in aiScore: High/Medium/Low. E.g., 'High']",
  "aiExplanation": "[Brief explanation for your AI generation assessment. E.g., 'The text exhibits overly formal language and repetitive sentence structures typical of some AI models.']",
  "humanizationScore": "[Percentage (0-100) indicating likelihood AI-generated text has been deliberately altered to appear more human-written. Higher means more likely humanized. E.g., 60]",
  "humanizationConfidence": "[Confidence in humanizationScore: High/Medium/Low. E.g., 'Medium']",
  "humanizationExplanation": "[Brief explanation for your humanization assessment. E.g., 'While the core structure suggests AI, there are minor stylistic variations and informalities that might be attempts at humanization.']",
  "plagiarismRisk": "[Assessed risk of the text containing unoriginal or plagiarized content: High/Medium/Low/None. E.g., 'Low']",
  "plagiarismExplanation": "[Explanation for plagiarism risk. If High/Medium, try to mention if specific phrases or sections seem unoriginal, generic, or directly copied from common knowledge bases without proper attribution. E.g., 'The definition of photosynthesis appears standard and might be found in many textbooks, but no direct verbatim copying from a specific source is immediately obvious.']",
  "readabilityLevel": "[Estimated readability: Easy/Moderate/Difficult/Very Difficult. E.g., 'Moderate']",
  "sentiment": "[Overall sentiment of the text: Positive/Neutral/Negative. E.g., 'Neutral']",
  "overallAssessment": "[A brief summary statement (1-2 sentences) about the text\'s likely origin and characteristics based on all analyses. E.g., 'The text is likely AI-generated with some attempts at humanization, presents a low plagiarism risk, and is moderately readable with a neutral tone.']"
}

Ensure the output is a single, valid JSON object and nothing else. Do not include any explanatory text before or after the JSON.
`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // --- Robust JSON Extraction ---
    responseText = responseText.replace(/^﻿/, ""); // Remove BOM

    let jsonStringToParse = responseText; // Default to original if no specific extraction works

    // Try to extract content within ```json ... ``` first
    const markdownJsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (markdownJsonMatch && markdownJsonMatch[1]) {
      jsonStringToParse = markdownJsonMatch[1].trim();
    } else {
      // If no markdown, try to find the first relevant '{' and last relevant '}'
      // This is a bit more robust than just indexOf and lastIndexOf for general text from LLM
      const firstBrace = responseText.indexOf("{");
      const lastBrace = responseText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const potentialJson = responseText
          .substring(firstBrace, lastBrace + 1)
          .trim();
        // Basic sanity check: does it look like a JSON object?
        if (potentialJson.startsWith("{") && potentialJson.endsWith("}")) {
          jsonStringToParse = potentialJson;
        } else {
          console.warn(
            "AI Detector: Substringing for JSON did not yield a clear object, attempting to parse broader response. Response was:",
            responseText
          );
          // jsonStringToParse remains responseText to try and parse the whole thing
        }
      } else {
        console.warn(
          "AI Detector: Could not find JSON markers (```json or {...}) in the response, attempting to parse broader response. Response was:",
          responseText
        );
        // jsonStringToParse remains responseText
      }
    }
    // --- End Robust JSON Extraction ---

    try {
      const parsedResponse = JSON.parse(jsonStringToParse);

      // Ensure scores are numbers and provide defaults for all fields
      return {
        aiScore: parseFloat(parsedResponse.aiScore) || 0,
        aiConfidence: parsedResponse.aiConfidence || "Low",
        aiExplanation:
          parsedResponse.aiExplanation ||
          "Unable to provide AI generation explanation.",
        humanizationScore: parseFloat(parsedResponse.humanizationScore) || 0,
        humanizationConfidence: parsedResponse.humanizationConfidence || "Low",
        humanizationExplanation:
          parsedResponse.humanizationExplanation ||
          "Unable to provide humanization explanation.",
        plagiarismRisk: parsedResponse.plagiarismRisk || "Unknown",
        plagiarismExplanation:
          parsedResponse.plagiarismExplanation ||
          "Unable to provide plagiarism explanation.",
        readabilityLevel: parsedResponse.readabilityLevel || "Unknown",
        sentiment: parsedResponse.sentiment || "Unknown",
        overallAssessment:
          parsedResponse.overallAssessment ||
          "Unable to provide an overall assessment.",
      };
    } catch (parseError) {
      console.error(
        "AI Detector: Error parsing extracted JSON from Gemini response:",
        parseError
      );
      console.error(
        "AI Detector: String that failed parsing was:",
        jsonStringToParse
      );

      // Fallback if parsing still fails, include new fields with default values
      return {
        aiScore: 50, // Default score
        aiConfidence: "Medium",
        aiExplanation: "Could not properly parse the AI detection analysis.",
        humanizationScore: 0,
        humanizationConfidence: "Low",
        humanizationExplanation:
          "Could not properly parse the AI detection analysis.",
        plagiarismRisk: "Unknown",
        plagiarismExplanation:
          "Could not properly parse the AI detection analysis.",
        readabilityLevel: "Unknown",
        sentiment: "Unknown",
        overallAssessment:
          "Could not properly parse the AI detection analysis.",
      };
    }
  } catch (error) {
    console.error("Error detecting AI content:", error);
    throw new Error("Failed to analyze the text for AI detection");
  }
}

module.exports = { detectAIContent };
