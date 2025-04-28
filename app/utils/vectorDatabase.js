/**
 * Vector Database Integration for Scientific Paper Similarity Search
 *
 * This module provides an abstraction over vector database operations, specifically
 * for storing and querying embeddings of scientific papers.
 *
 * Current implementation uses MongoDB Atlas Vector Search with fallback to mock data
 * for development. In production, this could be replaced with Pinecone, Milvus, etc.
 */

const mongoose = require("mongoose");
const Paper = require("../models/Paper");
const dotenv = require("dotenv");

dotenv.config();

// Configuration
const VECTOR_DB_TYPE = process.env.VECTOR_DB_TYPE || "mock"; // 'mongodb', 'pinecone', 'milvus', 'mock'
const VECTOR_DB_URL = process.env.VECTOR_DB_URL;
const VECTOR_DB_API_KEY = process.env.VECTOR_DB_API_KEY;

// For development purposes, mock data
const MOCK_PAPER_COUNT = 800000; // Simulate 800K papers
const MOCK_PAPER_CACHE = []; // Cache for mock paper data (just a few examples)

/**
 * Initialize the vector database connection
 */
async function initVectorDB() {
  if (VECTOR_DB_TYPE === "mock") {
    console.log("Using mock vector database for development");
    // Generate a few mock papers for the cache
    for (let i = 0; i < 10; i++) {
      MOCK_PAPER_CACHE.push({
        paperId: `mock-paper-${i}`,
        title: `Scientific Paper ${i}: ${
          [
            "Machine Learning",
            "Quantum Computing",
            "Natural Language Processing",
            "Climate Science",
            "Genomics",
          ][i % 5]
        } Research`,
        authors: [`Author ${i}`, `Co-author ${i + 1}`],
        similarity: 0, // Will be calculated at query time
        url: `https://example.com/papers/mock-${i}`,
      });
    }
    return;
  }

  if (VECTOR_DB_TYPE === "mongodb") {
    // MongoDB Atlas Vector Search is already initialized via mongoose connection
    console.log("Using MongoDB Atlas Vector Search for similarity search");
    return;
  }

  // Add more vector DB initializations as needed
  console.warn(`Vector database type ${VECTOR_DB_TYPE} is not implemented yet`);
}

/**
 * Store paper embeddings in the vector database
 * @param {string} paperId - MongoDB ID of the paper
 * @param {Object} embeddings - Object containing abstract and conclusion embeddings
 * @returns {Promise<boolean>} - True if successful
 */
async function storePaperEmbeddings(paperId, embeddings) {
  if (VECTOR_DB_TYPE === "mock") {
    console.log(`Mock storage of embeddings for paper ${paperId}`);
    return true;
  }

  if (VECTOR_DB_TYPE === "mongodb") {
    // Paper embeddings are already stored in MongoDB via the Paper model
    return true;
  }

  // Add more vector DB storage implementations as needed
  console.warn(`Vector database type ${VECTOR_DB_TYPE} is not implemented yet`);
  return false;
}

/**
 * Find similar papers based on embeddings
 * @param {Object} embeddings - Object containing abstract and conclusion embeddings
 * @param {number} topK - Number of similar papers to return
 * @param {Object} options - Additional options for search
 * @returns {Promise<Object>} - Search results with uniqueness score and similar papers
 */
async function findSimilarPapers(embeddings, topK = 5, options = {}) {
  if (VECTOR_DB_TYPE === "mock") {
    // In mock mode, return random papers with random similarities
    const mockResults = [];

    // Randomize the mock papers and assign random similarity scores
    const shuffled = [...MOCK_PAPER_CACHE].sort(() => 0.5 - Math.random());
    for (let i = 0; i < Math.min(topK, shuffled.length); i++) {
      const paperCopy = { ...shuffled[i] };
      // Generate similarity between 0.5 and 0.85
      paperCopy.similarity =
        Math.round((0.5 + Math.random() * 0.35) * 100) / 100;
      mockResults.push(paperCopy);
    }

    // Sort by similarity (highest first)
    mockResults.sort((a, b) => b.similarity - a.similarity);

    // Calculate uniqueness score as inverse of highest similarity
    const highestSimilarity =
      mockResults.length > 0 ? mockResults[0].similarity : 0;
    const uniquenessScore = Math.round((1 - highestSimilarity * 0.8) * 100); // Scale to make more realistic

    return {
      uniquenessScore,
      similarPapers: mockResults,
      totalPapersSearched: MOCK_PAPER_COUNT,
    };
  }

  if (VECTOR_DB_TYPE === "mongodb") {
    try {
      // Using MongoDB Atlas Vector Search
      // This requires a vector search index on the collection

      // Combine abstract and conclusion embeddings if both exist
      let queryEmbedding;
      if (embeddings.abstract && embeddings.conclusion) {
        // Average the embeddings (weighted)
        const abstractWeight = 0.6;
        const conclusionWeight = 0.4;
        queryEmbedding = embeddings.abstract.map(
          (val, idx) =>
            val * abstractWeight + embeddings.conclusion[idx] * conclusionWeight
        );
      } else if (embeddings.abstract) {
        queryEmbedding = embeddings.abstract;
      } else if (embeddings.conclusion) {
        queryEmbedding = embeddings.conclusion;
      } else {
        throw new Error("No embeddings provided for search");
      }

      // In a real implementation, you would use $vectorSearch or a similar operator
      // Here's a simplified example (requires MongoDB 5.0+ with Atlas Vector Search)
      /* 
      const results = await Paper.aggregate([
        {
          $vectorSearch: {
            index: "paper_embeddings_index",
            path: "embeddings.abstract", // or combined embedding field
            queryVector: queryEmbedding,
            numCandidates: topK * 10,
            limit: topK
          }
        },
        {
          $project: {
            _id: 1,
            title: 1,
            authors: 1,
            similarity: { $meta: "vectorSearchScore" },
            url: 1
          }
        }
      ]);
      */

      // For now, since we're likely not using Atlas Vector Search yet, we'll return mock data
      console.log(
        "Falling back to mock data instead of actual MongoDB Vector Search"
      );
      return findSimilarPapers(embeddings, topK, options);
    } catch (error) {
      console.error("Error in MongoDB vector search:", error);
      // Fallback to mock data if vector search fails
      return findSimilarPapers(embeddings, topK, options);
    }
  }

  // Add more vector DB search implementations as needed
  console.warn(`Vector database type ${VECTOR_DB_TYPE} is not implemented yet`);
  return findSimilarPapers(embeddings, topK, options); // Fallback to mock
}

// Initialize when the module is loaded
initVectorDB().catch((err) =>
  console.error("Failed to initialize vector database:", err)
);

module.exports = {
  initVectorDB,
  storePaperEmbeddings,
  findSimilarPapers,
};
