const htmlPdf = require("html-pdf-node");

/**
 * Converts HTML content to a PDF buffer
 * @param {string} htmlContent - The HTML content to convert
 * @returns {Promise<Buffer>} - The PDF as a buffer
 */
async function generatePDF(htmlContent) {
  try {
    // Create file object with HTML content
    const file = { content: htmlContent };

    // Set options for PDF generation
    const options = {
      format: "A4",
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
      printBackground: true,
      preferCSSPageSize: true,
      headerTemplate: `<style>
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.5;
        }
        h1, h2, h3, h4 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        p {
          margin-bottom: 0.5em;
          text-align: justify;
        }
        .abstract {
          font-style: italic;
          margin: 2em 0;
        }
        .references {
          margin-top: 2em;
        }
        .references p {
          padding-left: 2em;
          text-indent: -2em;
        }
      </style>`,
    };

    // Generate PDF
    const pdfBuffer = await htmlPdf.generatePdf(file, options);

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

module.exports = { generatePDF };
