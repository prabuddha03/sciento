const { extractTextFromPDF } = require("../utils/pdfParser");
const { structurePaperWithAI } = require("../utils/paperFormatter"); // We'll create this next

/**
 * Structures a research paper from an uploaded PDF according to a specified format.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function structurePaper(req, res) {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded",
      });
    }

    // Get format and optional metadata
    const { format, title, authors, abstract, keywords } = req.body;
    if (!format) {
      return res.status(400).json({
        success: false,
        error: "Output format is required",
      });
    }

    const metadata = { title, authors, abstract, keywords }; // Collect optional metadata

    // Extract text from PDF
    let textToAnalyze = "";
    try {
      textToAnalyze = await extractTextFromPDF(req.file.buffer);
    } catch (pdfError) {
      console.error("Error extracting PDF text:", pdfError);
      return res.status(400).json({
        success: false,
        error:
          "Could not extract text from the PDF. It might be image-based or corrupted.",
      });
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 100) {
      return res.status(400).json({
        success: false,
        error: "Not enough text content found in the PDF for structuring.",
      });
    }

    // Call the AI structuring utility
    const structuringResult = await structurePaperWithAI(
      textToAnalyze,
      format,
      metadata
    );

    // Send successful response
    res.status(200).json({
      success: true,
      formattedPaper: structuringResult.formattedPaper,
      detectedFormat: structuringResult.detectedFormat, // Include the detected original format
      format: format, // Echo back the requested format
      message: "Paper structured successfully.",
    });
  } catch (error) {
    console.error("Error in structurePaper controller:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error during paper structuring",
    });
  }
}

module.exports = { structurePaper };
