const pdfParse = require("pdf-parse");

/**
 * Extracts text from a PDF buffer
 * @param {Buffer} pdfBuffer - The PDF buffer to extract text from
 * @returns {Promise<string>} - The extracted text
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

module.exports = { extractTextFromPDF };
