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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // List of supported formats for identification
    const supportedFormats = [
      "IEEE",
      "ACM",
      "APA",
      "MLA",
      "Chicago",
      "Harvard",
    ];

    // Construct the prompt - Ask for separate output, not JSON
    const prompt = `
You are an expert academic editor. Analyze the following research paper text.

TASKS:
1. On the first line, state the identified current formatting style of the paper from this list: ${supportedFormats.join(
      ", "
    )}. If unsure, state "Unknown". Use the format "Detected Format: [Format/Unknown]".
2. On the next line, output the exact delimiter text "---PAPER_START---".
3. After the delimiter, output the entire paper text reformatted strictly according to the ${targetFormat.toUpperCase()} style guide.
4. Use the provided metadata if the paper text seems incomplete for a required field.

METADATA (Use if needed):
Title: ${metadata.title || "N/A"}
Authors: ${metadata.authors || "N/A"}
Abstract: ${metadata.abstract || "N/A"}
Keywords: ${metadata.keywords || "N/A"}

PAPER TEXT:
---
${paperText}
---

IMPORTANT: Do NOT output JSON. Output the detected format line, the delimiter line, and then the raw reformatted paper text directly.
`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // --- Parse the non-JSON response ---
    let detectedFormat = "Unknown";
    let formattedPaper =
      "Error: Could not extract formatted paper from AI response.";

    const delimiter = "---PAPER_START---";
    const delimiterIndex = responseText.indexOf(delimiter);

    if (delimiterIndex !== -1) {
      const formatLine = responseText.substring(0, delimiterIndex).trim();
      formattedPaper = responseText
        .substring(delimiterIndex + delimiter.length)
        .trim();

      // Extract format from the first line
      const formatMatch = formatLine.match(/^Detected Format:\s*(.*)/i);
      if (formatMatch && formatMatch[1]) {
        detectedFormat = formatMatch[1].trim();
      } else {
        // Attempt fallback if first line isn't exactly as expected
        const firstLine = formatLine.split("\n")[0].trim();
        if (
          supportedFormats
            .map((f) => f.toLowerCase())
            .includes(firstLine.toLowerCase())
        ) {
          detectedFormat = firstLine;
        } else if (firstLine) {
          detectedFormat = firstLine; // Store whatever was on the first line if unknown
        } else {
          detectedFormat = "Unknown"; // Default if empty
        }
      }

      if (!formattedPaper) {
        // Check if paper content is empty after delimiter
        formattedPaper = "Error: AI returned empty content after delimiter.";
      }
    } else {
      // Delimiter not found, maybe the whole response is the paper or an error message
      console.warn(
        "Paper structuring delimiter not found in AI response. Treating entire response as formatted paper (or error)."
      );
      // Try to guess format based on first line still?
      const lines = responseText.split("\n");
      if (lines.length > 0) {
        const firstLine = lines[0].trim();
        const formatMatch = firstLine.match(/^Detected Format:\s*(.*)/i);
        if (formatMatch && formatMatch[1]) {
          detectedFormat = formatMatch[1].trim();
        }
      }
      formattedPaper = responseText; // Assign the whole text as paper
    }

    return {
      detectedFormat,
      formattedPaper,
    };
    // --- End non-JSON parsing ---
  } catch (error) {
    console.error("Error structuring paper with AI:", error);
    throw new Error("Failed to structure paper using AI service");
  }
}

module.exports = { structurePaperWithAI };
