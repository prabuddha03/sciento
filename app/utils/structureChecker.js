const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Uses Gemini to check how well paper text conforms to a specific format.
 * @param {string} paperText - The full text of the paper.
 * @param {string} targetFormat - The format to check against (e.g., 'ieee', 'apa').
 * @returns {Promise<Object>} - Object containing complianceScore, detectedFormat, and justification.
 */
async function checkStructureWithAI(paperText, targetFormat) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const supportedFormats = [
      "IEEE",
      "ACM",
      "APA",
      "MLA",
      "Chicago",
      "Harvard",
    ]; // For format detection

    // Construct the prompt - Ask for separate output, not JSON
    const prompt = `
You are an expert academic editor specializing in the ${targetFormat.toUpperCase()} formatting style.
Analyze the following research paper text.

TASKS:
1.  Provide a compliance score from 0 (no adherence) to 100 (perfect adherence) regarding the paper's compliance with the ${targetFormat.toUpperCase()} style guide.
2.  Identify the *actual* formatting style used in the paper from this list: ${supportedFormats.join(
      ", "
    )}. If unsure or it doesn't match, state "Unknown".
3.  Provide a detailed justification explaining the compliance score, highlighting specific examples of correct usage and areas needing improvement according to the ${targetFormat.toUpperCase()} standard.

PAPER TEXT:
---
${paperText}
---

RESPONSE FORMAT:
Line 1: Compliance Score: [Score as a number between 0-100]
Line 2: Detected Format: [Actual Format Found or Unknown]
Line 3: ---JUSTIFICATION_START---
Line 4 onwards: [Detailed justification text here]

IMPORTANT: Do NOT output JSON. Output the score line, detected format line, the delimiter line, and then the raw justification text directly.
`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // --- Parse the non-JSON response ---
    let complianceScore = 0; // Default
    let detectedFormat = "Unknown"; // Default
    let justification =
      "Error: Could not extract justification from AI response."; // Default

    const lines = responseText.split("\n");
    const delimiter = "---JUSTIFICATION_START---";
    let delimiterIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === delimiter) {
        delimiterIndex = i;
        break;
      }
    }

    // Extract Score (Line 1)
    if (lines.length > 0) {
      const scoreMatch = lines[0].match(/^Compliance Score:\s*(\d+)/i);
      if (scoreMatch && scoreMatch[1]) {
        complianceScore = parseInt(scoreMatch[1], 10);
      }
    }

    // Extract Detected Format (Line 2)
    if (lines.length > 1) {
      const formatMatch = lines[1].match(/^Detected Format:\s*(.*)/i);
      if (formatMatch && formatMatch[1]) {
        detectedFormat = formatMatch[1].trim();
      }
    }

    // Extract Justification (After delimiter)
    if (delimiterIndex !== -1 && lines.length > delimiterIndex + 1) {
      justification = lines
        .slice(delimiterIndex + 1)
        .join("\n")
        .trim();
    } else if (lines.length > 2) {
      // Fallback: If delimiter missing, assume justification starts from line 3
      console.warn(
        "Structure check delimiter '---JUSTIFICATION_START---' not found. Assuming justification starts from line 3."
      );
      justification = lines.slice(2).join("\n").trim();
    } else {
      console.warn(
        "Structure check delimiter not found and not enough lines for fallback justification."
      );
    }

    if (!justification) {
      // Handle empty justification after processing
      justification = "(No justification provided by AI)";
    }

    return {
      complianceScore,
      detectedFormat, // Return the detected format
      justification,
    };
    // --- End non-JSON parsing ---
  } catch (error) {
    console.error("Error checking structure with AI:", error);
    throw new Error("Failed to check paper structure using AI service");
  }
}

module.exports = { checkStructureWithAI };
