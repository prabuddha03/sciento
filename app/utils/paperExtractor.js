const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Extract the abstract and conclusion from a scientific paper PDF
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<Object>} - The extracted abstract and conclusion
 */
async function extractFromPdf(pdfBuffer) {
  try {
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    // Extract abstract
    const abstract = extractAbstract(text);

    // Extract conclusion
    const conclusion = extractConclusion(text);

    return {
      abstract,
      conclusion,
      pageCount: pdfData.numpages,
      info: pdfData.info,
    };
  } catch (error) {
    console.error("Error extracting from PDF:", error);
    throw new Error("Failed to extract content from PDF");
  }
}

/**
 * Extract the abstract section from text
 * @param {string} text - Full text of the paper
 * @returns {string} - The extracted abstract
 */
function extractAbstract(text) {
  // Common patterns to identify abstracts in scientific papers
  const abstractPatterns = [
    /abstract\s*[\r\n]+([\s\S]*?)(?=\n\s*(?:keywords|introduction|related work|background|methodology|methods|1\.|1\s+|2\.|2\s+))/i,
    /abstract\s*[\r\n]+([\s\S]*?)(?=\n\s*\n)/i,
    /abstract[:\.\s]+([\s\S]*?)(?=\n\s*(?:keywords|introduction|1\.|1\s+))/i,
  ];

  for (const pattern of abstractPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 50) {
      return match[1].trim();
    }
  }

  // If no clear abstract section, look for the beginning part of the paper
  // after the title and before the first section
  const introPattern =
    /(?:(?:^|\n)(?!abstract|introduction|background|methodology|methods|results|discussion|conclusion|references)([A-Z][^\n]*)){1,3}\n\n([\s\S]{100,1500}?)(?=\n\s*(?:introduction|1\.|1\s+))/i;
  const introMatch = text.match(introPattern);
  if (introMatch && introMatch[2]) {
    return introMatch[2].trim();
  }

  // Last resort - just take the first substantial paragraph (at least 100 chars)
  const paragraphs = text.split(/\n\s*\n/);
  for (const paragraph of paragraphs) {
    if (
      paragraph.trim().length > 100 &&
      !paragraph.match(/^(references|acknowledgements|table of contents)/i)
    ) {
      return paragraph.trim();
    }
  }

  return "";
}

/**
 * Extract the conclusion section from text
 * @param {string} text - Full text of the paper
 * @returns {string} - The extracted conclusion
 */
function extractConclusion(text) {
  // Common patterns to identify conclusions in scientific papers
  const conclusionPatterns = [
    /(?:conclusion|conclusions|concluding remarks)[\s\:\.]*\n+([\s\S]*?)(?=\n\s*(?:references|acknowledgements|bibliography))/i,
    /(?:conclusion|conclusions|concluding remarks)[:\.\s]+([\s\S]*?)(?=\n\s*(?:references|acknowledgements|bibliography))/i,
    /(?:\n|\r|\r\n)(?:5|6|7|8|9|V|VI|VII|VIII|IX)[\s\.\)]*(?:conclusion|conclusions|concluding remarks)([\s\S]*?)(?=\n\s*(?:references|acknowledgements|bibliography))/i,
  ];

  for (const pattern of conclusionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 50) {
      return match[1].trim();
    }
  }

  // If no clear conclusion section, look for the last section before references
  const lastSectionPattern =
    /(?:\n|\r|\r\n)(?:5|6|7|8|9|V|VI|VII|VIII|IX|[5-9]\.[0-9]*)[\s\.\)]*([\s\S]*?)(?=\n\s*(?:references|acknowledgements|bibliography))/i;
  const lastSectionMatch = text.match(lastSectionPattern);
  if (
    lastSectionMatch &&
    lastSectionMatch[1] &&
    lastSectionMatch[1].trim().length > 100
  ) {
    return lastSectionMatch[1].trim();
  }

  // Look for the last substantial paragraph before references
  const beforeReferences = text.split(/references|bibliography/i)[0];
  if (beforeReferences) {
    const paragraphs = beforeReferences
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 100);
    if (paragraphs.length > 0) {
      return paragraphs[paragraphs.length - 1].trim();
    }
  }

  return "";
}

/**
 * Generate embeddings for abstract and conclusion using Gemini
 * Note: This function maintains the same interface as before, but now uses Gemini
 * @param {Object} data - Object containing abstract and conclusion
 * @returns {Promise<Object>} - Embeddings for the abstract and conclusion (actually just processed text)
 */
async function generatePaperEmbeddings(data) {
  try {
    // Only include fields that are not empty and return a simplified structure
    // We're not actually computing embeddings, just storing the text for Gemini to use later
    const embeddings = {};
    if (data.abstract) embeddings.abstract = data.abstract;
    if (data.conclusion) embeddings.conclusion = data.conclusion;

    return embeddings;
  } catch (error) {
    console.error("Error generating paper representations:", error);
    throw new Error("Failed to generate representations for paper");
  }
}

/**
 * Calculate paper similarity using Gemini
 * @param {Object} paperData - Object containing abstract and conclusion text
 * @param {number} topK - Number of similar papers to return
 * @returns {Promise<Object>} - Similarity results with uniqueness score and similar papers
 */
async function calculatePaperSimilarity(paperData, topK = 5) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Extract abstract and conclusion
    const abstract = paperData.abstract || "";
    const conclusion = paperData.conclusion || "";

    // If there's not enough content to analyze, return a default response
    if (abstract.length < 50 && conclusion.length < 50) {
      return {
        uniquenessScore: 100,
        similarPapers: [],
        explanation: "Not enough content to analyze.",
      };
    }

    // Construct prompt for Gemini
    const prompt = `
Analyze the following scientific paper excerpt and determine how unique it is.
If you were to search academic databases, estimate how many similar papers exist and provide examples.

ABSTRACT:
${abstract}

CONCLUSION:
${conclusion}

Generate a JSON response with the following format:
{
  "uniquenessScore": 1-100 (higher means more unique),
  "explanation": "Explanation of the uniqueness analysis",
  "similarPapers": [
    {
      "title": "Title of a similar paper",
      "authors": "Authors of the paper",
      "year": "Estimated publication year",
      "similarity": 1-100 (higher means more similar),
      "description": "Brief description of how this paper is similar"
    }
  ]
}

Limit the similarPapers array to ${topK} items and ensure your response is valid JSON.
`;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response text: remove BOM and Markdown fences
    text = text
      .replace(/^\uFEFF/, "") // Remove potential BOM
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "");

    // Parse JSON response
    try {
      const data = JSON.parse(text);

      // Format the response to match the expected output format
      return {
        uniquenessScore: data.uniquenessScore || 50,
        explanation: data.explanation || "",
        similarPapers: (data.similarPapers || []).map((paper, index) => ({
          paperId: `sim_${index + 1}`,
          title: paper.title || "Unknown Title",
          authors: paper.authors || "Unknown Authors",
          year: paper.year || "Unknown Year",
          similarity: paper.similarity || 0,
          explanation: paper.description || "",
        })),
      };
    } catch (parseError) {
      console.error("Error parsing Gemini response as JSON:", parseError);

      // Return a default response if parsing fails
      return {
        uniquenessScore: 50,
        explanation: "Unable to determine uniqueness accurately.",
        similarPapers: [],
      };
    }
  } catch (error) {
    console.error("Error calculating paper similarity with Gemini:", error);
    throw new Error("Failed to analyze paper similarity");
  }
}

module.exports = {
  extractFromPdf,
  generatePaperEmbeddings,
  calculatePaperSimilarity,
  extractAbstract,
  extractConclusion,
};
