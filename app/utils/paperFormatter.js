const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Uses Gemini to identify the format of a paper and reformat it.
 * @param {string} paperText - The full text of the paper.
 * @param {string} targetFormat - The desired output format (e.g., 'ieee', 'apa').
 * @param {Object} metadata - Optional metadata (title, authors, abstract, keywords).
 * @returns {Promise<Object>} - Object containing formattedPaper and detectedFormat.
 */
async function structurePaperWithAI(paperText, targetFormat, metadata = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // List of supported formats for identification
    const supportedFormats = [
      "IEEE",
      "ACM",
      "APA",
      "MLA",
      "Chicago",
      "Harvard",
      "Vancouver",
      "Nature",
      "Science",
      "Cell",
      "Elsevier",
      "Springer LNCS",
    ];

    const prompt = `
You are an expert academic paper typesetter and formatter. Your task is to reformat the following research paper text into the ${targetFormat.toUpperCase()} style and output it as a single, complete HTML document.

**Primary Goal: Reformat the provided text into HTML according to ${targetFormat.toUpperCase()} style guidelines, preserving ALL original content perfectly.**

**Crucial Instructions:**
1.  **Content Preservation (ABSOLUTE REQUIREMENT):** You MUST NOT alter, rephrase, summarize, add to, or delete ANY of the original textual content from the paper. Every sentence, word, figure reference, table reference, and piece of data must remain IDENTICAL to the input text. Your role is to re-structure, not re-write or interpret. If you are uncertain about how to format a specific part without changing content, preserve its original structure within the HTML as best as possible.
2.  **HTML Output:** The output must be a single, well-structured HTML document. Start with <!DOCTYPE html> and include <html>, <head> (with a <title> based on metadata if available), and <body> tags. Use appropriate semantic HTML5 tags (e.g., <article>, <section>, <header>, <h1-h6>, <p>, <ul>, <ol>, <li>, <table>, <tr>, <td>, <th>, <figure>, <figcaption>, <cite> for references if applicable).
3.  **Formatting Only:** Your changes must solely be related to the structure, layout, and styling as dictated by the ${targetFormat.toUpperCase()} style guide. This includes section order (e.g., Abstract, Introduction, Methods, Results, Discussion, Conclusion, References), heading levels, paragraph formatting, and general document flow.
4.  **Metadata Integration:** If metadata (title, authors, abstract, keywords) is provided, integrate it correctly into the HTML structure according to the ${targetFormat.toUpperCase()} style. For example, the title should typically be in a <h1> tag, authors listed appropriately (e.g., in a <p> or <meta> tags if appropriate for the style). The abstract and keywords should also be clearly sectioned.
5.  **Full Document:** Ensure the entire paper text is included in the HTML output. Do not truncate or omit any part of it.
6.  **Simplicity for PDF Conversion:** Aim for HTML that can be reasonably converted to PDF. Standard structural HTML is preferred. Avoid complex JavaScript. Inline CSS or a <style> block in the <head> can be used for basic styling that reflects the target format if necessary (e.g., font choices, margins, heading styles), but prioritize structural HTML.
7.  **References Section:** Pay special attention to the references/bibliography section. Format each reference as an individual item (e.g., in an ordered or unordered list) and preserve all details of each citation.

**Input Paper Text for Reformatting:**
---
[PAPER_TEXT_BEGINS]
${paperText}
[PAPER_TEXT_ENDS]
---

**Metadata to Incorporate:**
Title: ${metadata.title || "Not Provided"}
Authors: ${
      metadata.authors
        ? Array.isArray(metadata.authors)
          ? metadata.authors.join(", ")
          : metadata.authors
        : "Not Provided"
    }
Abstract: ${metadata.abstract || "Not Provided"}
Keywords: ${
      metadata.keywords
        ? Array.isArray(metadata.keywords)
          ? metadata.keywords.join(", ")
          : metadata.keywords
        : "Not Provided"
    }

**Output Instructions:**
1.  **First Line (Optional):** If you can confidently identify the *original* formatting style of the paper text from this list: ${supportedFormats.join(
      ", "
    )}, please state it on the VERY FIRST line as "Original Detected Format: [Format/Unknown]". If unsure, omit this line and start directly with the delimiter or HTML.
2.  **Delimiter (Required):** On the line immediately following the optional format detection (or on the first line if format detection is omitted), output the exact delimiter text: "---HTML_PAPER_START---".
3.  **HTML Content:** Immediately after the "---HTML_PAPER_START---" delimiter, provide the complete HTML document. Do NOT include any explanatory text, preamble, or comments before the <!DOCTYPE html> tag, other than the optional "Original Detected Format:" line and the "---HTML_PAPER_START---" delimiter.

Begin your response now.
`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // --- Parse the response ---
    let detectedFormat = "Unknown"; // This will be the original detected format
    let formattedPaper = // This will be the HTML string
      "Error: Could not extract formatted HTML paper from AI response.";

    const htmlDelimiter = "---HTML_PAPER_START---";
    let htmlStartIndex = responseText.indexOf(htmlDelimiter);

    if (htmlStartIndex !== -1) {
      const beforeDelimiter = responseText.substring(0, htmlStartIndex).trim();
      formattedPaper = responseText
        .substring(htmlStartIndex + htmlDelimiter.length)
        .trim();

      // Try to extract original detected format from lines before the delimiter
      const formatLinePrefix = "Original Detected Format:";
      const linesBeforeDelimiter = beforeDelimiter.split("\n");
      for (const line of linesBeforeDelimiter) {
        if (line.startsWith(formatLinePrefix)) {
          detectedFormat = line.substring(formatLinePrefix.length).trim();
          break;
        }
      }

      if (
        !formattedPaper.toLowerCase().startsWith("<!doctype html>") &&
        !formattedPaper.toLowerCase().startsWith("<html>")
      ) {
        console.warn(
          "Formatted paper does not start with <!DOCTYPE html> or <html>. Potential formatting issue."
        );
        // Keep the content as is, but be aware it might not be pure HTML.
      }
    } else {
      // Delimiter not found. This is a problem.
      // The AI might have failed to follow instructions.
      // Try to see if the response itself is HTML, otherwise it's an error.
      console.warn(
        "HTML_PAPER_START delimiter not found in AI response. Attempting to treat entire response as HTML if it looks like it."
      );
      if (
        responseText.toLowerCase().includes("<html") &&
        responseText.toLowerCase().includes("</html")
      ) {
        formattedPaper = responseText;
        // Attempt to find original format still if it's on the first line
        const lines = responseText.split("\n");
        if (lines.length > 0) {
          const firstLine = lines[0].trim();
          const formatLinePrefix = "Original Detected Format:";
          if (firstLine.startsWith(formatLinePrefix)) {
            detectedFormat = firstLine
              .substring(formatLinePrefix.length)
              .trim();
          }
        }
      } else {
        formattedPaper = `Error: AI response did not contain the required '${htmlDelimiter}' delimiter and does not appear to be HTML. Response: ${responseText}`;
      }
    }

    // Ensure formattedPaper is not empty if it was supposed to be HTML
    if (
      formattedPaper.startsWith("Error:") &&
      responseText.length > 0 &&
      htmlStartIndex !== -1 &&
      responseText.substring(htmlStartIndex + htmlDelimiter.length).trim()
        .length === 0
    ) {
      formattedPaper =
        "Error: AI returned empty content after the HTML delimiter.";
    }

    return {
      detectedFormat, // Original detected format
      formattedPaper, // HTML string
    };
  } catch (error) {
    console.error("Error structuring paper with AI:", error);
    // Check for specific Gemini API errors if possible, e.g., quota, API key issues
    if (error.message && error.message.includes("API key not valid")) {
      throw new Error("Failed to structure paper: Invalid Gemini API Key.");
    }
    if (error.message && error.message.includes("quota")) {
      throw new Error("Failed to structure paper: Gemini API quota exceeded.");
    }
    throw new Error(
      `Failed to structure paper using AI service: ${error.message}`
    );
  }
}

module.exports = { structurePaperWithAI };
