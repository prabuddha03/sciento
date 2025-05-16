const { detectAIContent } = require("../utils/aiDetector");
const { extractTextFromPDF } = require("../utils/pdfParser");

/**
 * Analyzes text to detect if it's AI-generated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function detectAI(req, res) {
  try {
    let textToAnalyze = "";

    // Check if text is provided in the request body
    if (req.body.text) {
      textToAnalyze = req.body.text;
    }
    // Check if PDF was uploaded
    else if (req.file) {
      try {
        textToAnalyze = await extractTextFromPDF(req.file.buffer);
      } catch (pdfError) {
        return res.status(400).json({
          error:
            "Could not extract text from the PDF. The file may be corrupted, password-protected, or contain only images.",
        });
      }
    }
    // If neither text nor PDF provided
    else {
      return res.status(400).json({
        error:
          "Please provide either text in the request body or upload a PDF file.",
      });
    }

    // Check if extracted text is valid
    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      return res.status(400).json({
        error: "No text content found for analysis.",
      });
    }

    // Detect AI content
    const analysis = await detectAIContent(textToAnalyze);

    // --- Transform the response structure ---
    // The new analysis object from aiDetector.js is more comprehensive.
    // We will pass most of it directly to the client.

    // Convert string confidence levels to a numeric representation if desired by frontend,
    // or pass them as strings. For now, let's pass them as strings as returned by the detector.
    // Example: if numeric is needed:
    // const mapConfidenceToNumeric = (confidence) => {
    //   switch (String(confidence).toLowerCase()) {
    //     case "high": return 0.9;
    //     case "medium": return 0.6;
    //     case "low": return 0.3;
    //     default: return 0.5; // Or handle "Unknown"
    //   }
    // };

    const formattedResponse = {
      success: true,
      result: {
        aiScore: parseFloat(analysis.aiScore) || 0, // Ensure it's a number
        aiConfidence: analysis.aiConfidence, // e.g., "High", "Medium", "Low"
        aiExplanation: analysis.aiExplanation,
        humanizationScore: parseFloat(analysis.humanizationScore) || 0, // Ensure it's a number
        humanizationConfidence: analysis.humanizationConfidence,
        humanizationExplanation: analysis.humanizationExplanation,
        plagiarismRisk: analysis.plagiarismRisk, // e.g., "Low", "Medium", "High"
        plagiarismExplanation: analysis.plagiarismExplanation,
        readabilityLevel: analysis.readabilityLevel, // e.g., "Moderate"
        sentiment: analysis.sentiment, // e.g., "Neutral"
        overallAssessment: analysis.overallAssessment,
        // Deprecated fields (can be removed if frontend is updated):
        // isAIGenerated: (parseFloat(analysis.aiScore) || 0) >= 50,
        // confidence: mapConfidenceToNumeric(analysis.aiConfidence),
      },
    };
    // --- End transformation ---

    // Return the formatted analysis results
    res.status(200).json(formattedResponse);
  } catch (error) {
    console.error("Error in detectAI:", error);
    res.status(500).json({
      error: error.message || "An error occurred during AI detection analysis",
    });
  }
}

module.exports = { detectAI };
