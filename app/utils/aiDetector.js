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

    // Initialize Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Construct prompt for AI detection
    const prompt = `You are an expert at detecting AI-generated writing. Given the following content, estimate:
1. The likelihood that the content was written by an AI (0-100%)
2. The confidence level (High/Medium/Low)
3. A brief explanation for your judgment.

Return your analysis in JSON format only, with the following structure:
{
  "aiScore": [percentage as number without % symbol],
  "confidence": "[High/Medium/Low]",
  "explanation": "[your explanation]"
}

Content to analyze:
${limitedText}`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // Clean the response text: remove BOM and Markdown fences
    responseText = responseText
      .replace(/^\uFEFF/, "") // Remove potential BOM
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");

    // Try to parse JSON from the cleaned response
    try {
      const parsedResponse = JSON.parse(responseText);

      // Ensure the response has the expected structure
      return {
        aiScore: parsedResponse.aiScore || 0,
        confidence: parsedResponse.confidence || "Low",
        explanation:
          parsedResponse.explanation || "Unable to analyze the text.",
      };
    } catch (parseError) {
      console.error(
        "Error parsing cleaned Gemini response as JSON:",
        parseError
      );
      console.error("Cleaned text received:", responseText); // Log the cleaned text for debugging

      // Fallback if parsing still fails (maybe remove or refine this later)
      return {
        aiScore: 50, // Default score
        confidence: "Medium",
        explanation: "Could not properly parse the AI detection analysis.",
      };
    }
  } catch (error) {
    console.error("Error detecting AI content:", error);
    throw new Error("Failed to analyze the text for AI detection");
  }
}

module.exports = { detectAIContent };
