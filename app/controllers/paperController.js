const { generateResearchPaper } = require("../utils/geminiClient");
const { generatePDF } = require("../utils/pdfGenerator");
const { extractTextFromPDF } = require("../utils/pdfParser");
const { uploadPDFToCloudinary } = require("../utils/cloudinaryUploader");

/**
 * Handles the research paper generation request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function generatePaper(req, res) {
  try {
    // Extract data from request
    const data = req.body;
    let extractedText = "";

    // If PDF was uploaded, extract text from it
    if (req.file) {
      extractedText = await extractTextFromPDF(req.file.buffer);
    }

    // Validate required fields
    const requiredFields = [
      "title",
      "authors",
      "domain",
      "problemStatement",
      "proposedSolution",
      "objectives",
      "methodology",
      "outcomes",
      "format",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        missingFields,
      });
    }

    // Validate format
    if (!["IEEE", "APA"].includes(data.format)) {
      return res.status(400).json({
        error: 'Invalid format. Must be either "IEEE" or "APA"',
      });
    }

    // Add extracted text to data
    const paperData = {
      ...data,
      extractedText,
    };

    // Generate research paper
    const htmlContent = await generateResearchPaper(paperData);

    // Convert to PDF
    const pdfBuffer = await generatePDF(htmlContent);

    // Generate filename for the PDF
    const fileName = data.title;

    // Upload to Cloudinary
    const cloudinaryResult = await uploadPDFToCloudinary(pdfBuffer, fileName);

    // Check if direct download was requested
    const sendAsDownload = req.query.download === "true";

    if (sendAsDownload) {
      // Send as direct download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${data.title.replace(/\s+/g, "_")}.pdf`
      );
      return res.send(pdfBuffer);
    }

    // Otherwise return JSON with Cloudinary URL
    return res.status(200).json({
      success: true,
      message: "Research paper generated successfully",
      paper: {
        title: data.title,
        format: data.format,
        downloadUrl: cloudinaryResult.url,
        createdAt: cloudinaryResult.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in generatePaper:", error);
    res.status(500).json({
      error: error.message || "An error occurred during paper generation",
    });
  }
}

module.exports = { generatePaper };
