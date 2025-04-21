const { extractTextFromPDF } = require("../utils/pdfParser");
const { analyzeResearch } = require("../utils/researchAnalyzer");

/**
 * Analyzes a research paper PDF
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzePaper(req, res) {
  try {
    // Check if PDF was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No PDF file uploaded",
      });
    }

    // Get synopsis type from query params (default: moderate)
    const synopsisType = req.query.synopsis || "moderate";

    // Validate synopsis type
    if (!["brief", "moderate", "detailed"].includes(synopsisType)) {
      return res.status(400).json({
        error:
          'Invalid synopsis type. Must be "brief", "moderate", or "detailed"',
      });
    }

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(req.file.buffer);

    // Check if extracted text is valid
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error:
          "Could not extract text from the PDF. The file may be corrupted, password-protected, or contain only images.",
      });
    }

    // Analyze research paper
    const analysis = await analyzeResearch(extractedText, synopsisType);

    // Return the analysis results
    res.status(200).json({
      success: true,
      synopsisType,
      analysis,
    });
  } catch (error) {
    console.error("Error in analyzePaper:", error);
    res.status(500).json({
      error: error.message || "An error occurred during paper analysis",
    });
  }
}

module.exports = { analyzePaper };
