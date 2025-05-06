const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes research paper content using Gemini
 * @param {string} pdfText - The extracted text from the PDF
 * @param {string} synopsisType - The level of synopsis detail (brief, moderate, detailed)
 * @returns {Promise<Object>} - The analysis results
 */
async function analyzeResearch(pdfText, synopsisType = "moderate") {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // Validate synopsis type
    if (!["brief", "moderate", "detailed"].includes(synopsisType)) {
      synopsisType = "moderate"; // Default to moderate if invalid
    }

    // Construct prompt based on synopsis type
    const prompt = constructAnalysisPrompt(pdfText, synopsisType);

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response text: remove Markdown fences if present
    text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");

    // Parse the JSON response
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", parseError);
      console.error("Raw text received:", text); // Log the cleaned text for debugging

      // Attempt to extract structured data from text response
      return extractStructuredData(text);
    }
  } catch (error) {
    console.error("Error analyzing research with Gemini:", error);
    throw new Error("Failed to analyze research paper");
  }
}

/**
 * Constructs a prompt for Gemini based on the synopsis type
 * @param {string} pdfText - The extracted text from the PDF
 * @param {string} synopsisType - The level of synopsis detail
 * @returns {string} - The constructed prompt
 */
function constructAnalysisPrompt(pdfText, synopsisType) {
  let synopsisLength;
  switch (synopsisType) {
    case "brief":
      synopsisLength = "a concise (100-150 word)";
      break;
    case "detailed":
      synopsisLength = "a comprehensive (300-400 word)";
      break;
    default: // moderate
      synopsisLength = "a balanced (200-250 word)";
      break;
  }

  return `Analyze the following research paper text and provide a detailed evaluation in JSON format.

TEXT FROM RESEARCH PAPER:
${pdfText}

INSTRUCTIONS:
Analyze this text and create a JSON object with the following structure:
{
  "synopsis": "${synopsisLength} summary of the research paper, its core proposition, methodology, and key findings",
  "scores": {
    "feasibility": {
      "score": "A numerical score from 1-10",
      "justification": "Brief explanation of why this score was given"
    },
    "innovation": {
      "score": "A numerical score from 1-10",
      "justification": "Brief explanation of why this score was given"
    },
    "scalability": {
      "score": "A numerical score from 1-10",
      "justification": "Brief explanation of why this score was given"
    }
  },
  "risks": {
    "bias": {
      "level": "Low, Medium, or High",
      "description": "Explanation of potential biases in the research"
    },
    "edgeCases": {
      "level": "Low, Medium, or High",
      "description": "Explanation of potential edge cases not addressed"
    },
    "ethical": {
      "level": "Low, Medium, or High",
      "description": "Explanation of potential ethical risks"
    }
  },
  "keywords": ["List of 5-7 key topics/domains covered in the research"]
}

Return ONLY the JSON with no additional text. Ensure the JSON is properly formatted and can be parsed.`;
}

/**
 * Extract structured data from text response if JSON parsing fails
 * @param {string} text - The text response from Gemini
 * @returns {Object} - Extracted structured data
 */
function extractStructuredData(text) {
  // Default response structure
  const defaultResponse = {
    synopsis: "Could not extract synopsis",
    scores: {
      feasibility: { score: 0, justification: "Analysis failed" },
      innovation: { score: 0, justification: "Analysis failed" },
      scalability: { score: 0, justification: "Analysis failed" },
    },
    risks: {
      bias: { level: "Unknown", description: "Analysis failed" },
      edgeCases: { level: "Unknown", description: "Analysis failed" },
      ethical: { level: "Unknown", description: "Analysis failed" },
    },
    keywords: ["Analysis failed"],
  };

  // Try to extract data from text sections
  try {
    // Basic extraction by looking for patterns
    const synopsisMatch = text.match(/("synopsis"|synopsis):\s*"([^"]+)"/);
    if (synopsisMatch) {
      defaultResponse.synopsis = synopsisMatch[2];
    }

    // Extract scores if present
    const scoreMatches = text.match(/("score"|score):\s*"?(\d+)"?/g);
    if (scoreMatches && scoreMatches.length >= 3) {
      const scores = scoreMatches.map((match) => {
        const score = match.match(/(\d+)/)[0];
        return parseInt(score, 10);
      });

      defaultResponse.scores.feasibility.score = scores[0] || 0;
      defaultResponse.scores.innovation.score = scores[1] || 0;
      defaultResponse.scores.scalability.score = scores[2] || 0;
    }

    // Extract keywords if present
    const keywordsMatch = text.match(/("keywords"|keywords):\s*\[(.*?)\]/);
    if (keywordsMatch) {
      const keywordsText = keywordsMatch[2];
      defaultResponse.keywords = keywordsText
        .split(",")
        .map((k) => k.replace(/"/g, "").trim())
        .filter((k) => k.length > 0);
    }

    return defaultResponse;
  } catch (error) {
    console.error("Error extracting structured data:", error);
    return defaultResponse;
  }
}

module.exports = { analyzeResearch };
