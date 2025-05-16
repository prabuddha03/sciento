const { extractTextFromPDF } = require("../utils/pdfParser");
const { structurePaperWithAI } = require("../utils/paperFormatter"); // We'll create this next
const HTMLToPDF = require("html-pdf-node"); // Added for PDF generation

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
    // IMPORTANT: structurePaperWithAI in app/utils/paperFormatter.js
    // needs to be updated to return an object where 'formattedPaper' is an HTML string.
    // The AI prompt should strictly instruct the model to reformat the content into HTML
    // without altering the text itself, based on the target 'format'.
    const structuringResult = await structurePaperWithAI(
      textToAnalyze,
      format,
      metadata
    );

    // Assuming structuringResult.formattedPaper is now an HTML string
    if (
      !structuringResult.formattedPaper ||
      typeof structuringResult.formattedPaper !== "string"
    ) {
      return res.status(500).json({
        success: false,
        error: "AI structuring did not return valid HTML content.",
      });
    }

    const pdfOptions = { format: "A4" }; // Or other appropriate PDF options
    const file = { content: structuringResult.formattedPaper };

    const pdfBuffer = await HTMLToPDF.generatePdf(file, pdfOptions);

    // Send successful PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="formatted_paper_${Date.now()}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error in structurePaper controller:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error during paper structuring",
    });
  }
}

module.exports = { structurePaper };
