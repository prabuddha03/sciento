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
    const isAIGenerated = analysis.aiScore >= 50;
    let confidenceScore = 0.5; // Default to medium
    switch (analysis.confidence.toLowerCase()) {
      case "high":
        confidenceScore = 0.9;
        break;
      case "medium":
        confidenceScore = 0.6;
        break;
      case "low":
        confidenceScore = 0.3;
        break;
    }

    const formattedResponse = {
      success: true,
      result: {
        isAIGenerated: isAIGenerated,
        confidence: confidenceScore, // Send numeric confidence
        explanation: analysis.explanation,
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
