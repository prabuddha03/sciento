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
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    const responseText = response.text();

    // Try to parse JSON from response
    try {
      // Extract JSON if it's embedded in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsedResponse = JSON.parse(jsonStr);

        // Ensure the response has the expected structure
        return {
          aiScore: parsedResponse.aiScore || 0,
          confidence: parsedResponse.confidence || "Low",
          explanation:
            parsedResponse.explanation || "Unable to analyze the text.",
        };
      }

      throw new Error("No valid JSON found in the response");
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);

      // If parsing fails, try to extract data using regex
      const scoreMatch = responseText.match(/(\d+)%|(\d+)\s*percent/i);
      const confidenceMatch = responseText.match(
        /confidence[:\s]*(High|Medium|Low)/i
      );

      return {
        aiScore: scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2], 10) : 50,
        confidence: confidenceMatch ? confidenceMatch[1] : "Medium",
        explanation:
          "The analysis couldn't be structured properly, but the content was evaluated.",
      };
    }
  } catch (error) {
    console.error("Error detecting AI content:", error);
    throw new Error("Failed to analyze the text for AI detection");
  }
}

module.exports = { detectAIContent };
