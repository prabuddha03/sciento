const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a research paper using Gemini
 * @param {Object} paperData - The data for generating the paper
 * @returns {Promise<string>} - The generated paper content
 */
async function generateResearchPaper(paperData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Construct prompt
    const prompt = constructPrompt(paperData);

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating paper with Gemini:", error);
    throw new Error("Failed to generate research paper");
  }
}

/**
 * Constructs a prompt for Gemini based on paper data
 * @param {Object} data - The paper data
 * @returns {string} - The constructed prompt
 */
function constructPrompt(data) {
  const {
    title,
    authors,
    email,
    affiliation,
    domain,
    problemStatement,
    proposedSolution,
    objectives,
    methodology,
    outcomes,
    references,
    format,
    extractedText,
  } = data;

  // Convert arrays to strings if necessary
  const authorsStr = Array.isArray(authors) ? authors.join(", ") : authors;
  const objectivesStr = Array.isArray(objectives)
    ? objectives.join("\n- ")
    : objectives;
  const referencesStr = references
    ? Array.isArray(references)
      ? references.join("\n")
      : references
    : "";

  let prompt = `Generate a complete research paper in ${format} format with the following details:

Title: ${title}
Authors: ${authorsStr}
${email ? `Email: ${email}` : ""}
${affiliation ? `Affiliation: ${affiliation}` : ""}
Domain: ${domain}

Problem Statement:
${problemStatement}

Proposed Solution:
${proposedSolution}

Objectives:
${objectivesStr.includes("\n-") ? objectivesStr : "- " + objectivesStr}

Methodology:
${methodology}

Expected Outcomes:
${outcomes}

${references ? `References:\n${referencesStr}` : ""}`;

  if (extractedText) {
    prompt += `\n\nAdditional context from uploaded document:\n${extractedText}`;
  }

  prompt += `\n\nPlease format the paper according to ${format} standards, including proper sections, citations, and formatting. Return the paper in HTML format that can be converted to PDF.`;

  return prompt;
}

module.exports = { generateResearchPaper };
