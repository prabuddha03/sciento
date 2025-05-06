const { extractTextFromPDF } = require("../utils/pdfParser");
const { checkStructureWithAI } = require("../utils/structureChecker"); // We'll create this next

/**
 * Checks how well a research paper adheres to a specific academic format.
 * @param {Object} req - Express request object (expects PDF file and 'format' in body)
 * @param {Object} res - Express response object
 */
async function checkPaperStructure(req, res) {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded",
      });
    }

    // Get the target format to check against
    const { format } = req.body;
    if (!format) {
      return res.status(400).json({
        success: false,
        error: "Target format to check against is required",
      });
    }

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
        error: "Not enough text content found in the PDF for structure check.",
      });
    }

    // Call the AI structure checking utility
    const checkResult = await checkStructureWithAI(textToAnalyze, format);

    // Send successful response
    res.status(200).json({
      success: true,
      formatChecked: format,
      detectedFormat: checkResult.detectedFormat,
      complianceScore: checkResult.complianceScore,
      justification: checkResult.justification,
      message: "Paper structure check completed.",
    });
  } catch (error) {
    console.error("Error in checkPaperStructure controller:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error during paper structure check",
    });
  }
}

module.exports = { checkPaperStructure };
