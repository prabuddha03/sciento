const pdfParse = require("pdf-parse");
const axios = require("axios");
const { findSimilarPapers } = require("./vectorDatabase");

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
 * Generate embeddings for abstract and conclusion using the embedding service
 * @param {Object} data - Object containing abstract and conclusion
 * @returns {Promise<Object>} - Embeddings for the abstract and conclusion
 */
async function generatePaperEmbeddings(data) {
  try {
    const embeddingServiceUrl =
      process.env.EMBEDDING_SERVICE_URL?.replace(
        "/embeddings",
        "/paper/embeddings"
      ) || "http://localhost:5000/api/paper/embeddings";

    // Only include fields that are not empty
    const requestData = {};
    if (data.abstract) requestData.abstract = data.abstract;
    if (data.conclusion) requestData.conclusion = data.conclusion;

    // Return empty object if no data to embed
    if (Object.keys(requestData).length === 0) {
      return {};
    }

    const response = await axios.post(embeddingServiceUrl, requestData);
    return response.data.embeddings;
  } catch (error) {
    console.error("Error generating paper embeddings:", error);
    throw new Error("Failed to generate embeddings for paper");
  }
}

/**
 * Calculate paper similarity using the vector database
 * @param {Object} embeddings - Object containing abstract and conclusion embeddings
 * @param {number} topK - Number of similar papers to return
 * @returns {Promise<Object>} - Similarity results with uniqueness score and similar papers
 */
async function calculatePaperSimilarity(embeddings, topK = 5) {
  try {
    // Use vector database to find similar papers
    return await findSimilarPapers(embeddings, topK);
  } catch (error) {
    console.error("Error calculating paper similarity:", error);

    // Fallback to embedding service if vector DB fails
    try {
      const similarityServiceUrl =
        process.env.EMBEDDING_SERVICE_URL?.replace(
          "/embeddings",
          "/paper/similarity"
        ) || "http://localhost:5000/api/paper/similarity";

      const response = await axios.post(similarityServiceUrl, {
        embeddings,
        top_k: topK,
      });

      return response.data;
    } catch (fallbackError) {
      console.error("Error in fallback similarity calculation:", fallbackError);
      throw new Error("Failed to calculate paper similarity");
    }
  }
}

module.exports = {
  extractFromPdf,
  generatePaperEmbeddings,
  calculatePaperSimilarity,
  extractAbstract,
  extractConclusion,
};
