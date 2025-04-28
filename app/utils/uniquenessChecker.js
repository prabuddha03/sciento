const axios = require("axios");
const murmurhash = require("murmurhash");
require("dotenv").config();

// URL for the Python embedding service
const EMBEDDING_SERVICE_URL =
  process.env.EMBEDDING_SERVICE_URL || "http://localhost:5000/api/embeddings";

// Log the embedding service URL for debugging
console.log(`Using embedding service URL: ${EMBEDDING_SERVICE_URL}`);

/**
 * Generate murmurhash for quick exact matching
 * @param {string} text - Text to hash
 * @returns {string} - Hash string
 */
function generateHash(text) {
  return murmurhash.v3(text).toString();
}

/**
 * Check for exact matches using murmurhash
 * @param {Object} newIdea - The new idea to check
 * @param {Array} existingIdeas - List of existing ideas
 * @returns {Object|null} - Matching idea or null if no exact match
 */
function checkExactMatch(newIdea, existingIdeas) {
  const problemStatementHash = generateHash(newIdea.problemStatement);
  const proposedSolutionHash = generateHash(newIdea.proposedSolution);

  for (const idea of existingIdeas) {
    // Skip if the idea doesn't have hashes (older ideas)
    if (!idea.hashes) continue;

    // Check for exact match on problem statement or proposed solution
    if (
      idea.hashes.problemStatement === problemStatementHash ||
      idea.hashes.proposedSolution === proposedSolutionHash
    ) {
      return {
        matched: true,
        ideaId: idea._id,
        field:
          idea.hashes.problemStatement === problemStatementHash
            ? "problemStatement"
            : "proposedSolution",
      };
    }
  }

  return { matched: false };
}

/**
 * Get BERT embeddings for text fields
 * @param {Object} idea - Idea object with text fields
 * @returns {Promise<Object>} - Object with embeddings for each field
 */
async function getEmbeddings(idea) {
  try {
    const response = await axios.post(EMBEDDING_SERVICE_URL, {
      problemStatement: idea.problemStatement,
      proposedSolution: idea.proposedSolution,
      description: idea.description,
      domain: idea.domain,
    });

    return response.data.embeddings;
  } catch (error) {
    console.error("Error getting embeddings:", error);
    throw new Error("Failed to generate embeddings");
  }
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} - Similarity score (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  // If either vector is empty or undefined, return 0
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate similarity between ideas using field embeddings
 * @param {Object} newIdeaEmbeddings - Embeddings of the new idea
 * @param {Object} existingIdea - Existing idea with embeddings
 * @returns {Object} - Field-level similarity scores
 */
function calculateFieldSimilarity(newIdeaEmbeddings, existingIdea) {
  const fields = [
    "problemStatement",
    "proposedSolution",
    "description",
    "domain",
  ];
  const similarity = {};

  fields.forEach((field) => {
    // If embeddings exist for both ideas, calculate similarity
    if (
      newIdeaEmbeddings[field] &&
      existingIdea.embeddings &&
      existingIdea.embeddings[field]
    ) {
      similarity[field] = cosineSimilarity(
        newIdeaEmbeddings[field],
        existingIdea.embeddings[field]
      );
    } else {
      similarity[field] = 0;
    }
  });

  // Overall similarity is average of field similarities
  const overallSimilarity =
    fields.reduce((sum, field) => sum + similarity[field], 0) / fields.length;

  return {
    fieldSimilarity: similarity,
    overallSimilarity: overallSimilarity,
  };
}

/**
 * Convert similarity score (0-1) to uniqueness score (0-100)
 * @param {number} similarityScore - Similarity score between 0-1
 * @returns {number} - Uniqueness score between 0-100
 */
function similarityToUniqueness(similarityScore) {
  return Math.round((1 - similarityScore) * 100);
}

/**
 * Check if an idea is unique by comparing with existing ideas
 * @param {Object} newIdea - The new idea to check
 * @param {Array} existingIdeas - List of existing ideas
 * @returns {Promise<Object>} - The uniqueness analysis results
 */
async function checkIdeaUniqueness(newIdea, existingIdeas) {
  try {
    // If there are no existing ideas, the idea is 100% unique
    if (!existingIdeas || existingIdeas.length === 0) {
      // Generate embeddings for the first idea
      const embeddings = await getEmbeddings(newIdea);

      // Generate hashes for quick comparison later
      const hashes = {
        problemStatement: generateHash(newIdea.problemStatement),
        proposedSolution: generateHash(newIdea.proposedSolution),
      };

      return {
        uniquenessScore: 100,
        similarIdeas: [],
        explanation:
          "This is the first idea in this room, so it's considered 100% unique.",
        embeddings,
        hashes,
        fieldUniqueness: {
          problemStatement: 100,
          proposedSolution: 100,
          description: 100,
          domain: 100,
        },
      };
    }

    // Check for exact matches using murmurhash
    const exactMatch = checkExactMatch(newIdea, existingIdeas);
    if (exactMatch.matched) {
      return {
        uniquenessScore: 0,
        similarIdeas: [
          {
            ideaId: exactMatch.ideaId,
            similarityScore: 100,
            explanation: `This idea has an identical ${exactMatch.field} to an existing idea.`,
          },
        ],
        explanation: `This idea is rejected because it has an identical ${exactMatch.field} to an existing idea.`,
        isRejected: true,
      };
    }

    // Generate embeddings for the new idea
    const newIdeaEmbeddings = await getEmbeddings(newIdea);

    // Generate hashes for quick comparison later
    const hashes = {
      problemStatement: generateHash(newIdea.problemStatement),
      proposedSolution: generateHash(newIdea.proposedSolution),
    };

    // Calculate similarity with each existing idea
    const similarities = [];
    let lowestUniqueness = {
      problemStatement: 100,
      proposedSolution: 100,
      description: 100,
      domain: 100,
    };

    for (const idea of existingIdeas) {
      // Skip ideas without embeddings
      if (!idea.embeddings) continue;

      // Calculate similarity for each field
      const similarity = calculateFieldSimilarity(newIdeaEmbeddings, idea);

      // Update the lowest uniqueness scores
      Object.keys(lowestUniqueness).forEach((field) => {
        const fieldUniqueness = similarityToUniqueness(
          similarity.fieldSimilarity[field]
        );
        if (fieldUniqueness < lowestUniqueness[field]) {
          lowestUniqueness[field] = fieldUniqueness;
        }
      });

      // Add to similarities list if overall similarity is above threshold (e.g., 0.3)
      if (similarity.overallSimilarity > 0.3) {
        similarities.push({
          ideaId: idea._id,
          similarityScore: Math.round(similarity.overallSimilarity * 100),
          fieldSimilarity: {
            problemStatement: Math.round(
              similarity.fieldSimilarity.problemStatement * 100
            ),
            proposedSolution: Math.round(
              similarity.fieldSimilarity.proposedSolution * 100
            ),
            description: Math.round(
              similarity.fieldSimilarity.description * 100
            ),
            domain: Math.round(similarity.fieldSimilarity.domain * 100),
          },
          explanation: generateSimilarityExplanation(
            similarity.fieldSimilarity,
            idea.title
          ),
        });
      }
    }

    // Calculate overall uniqueness score (average of field uniqueness)
    const overallUniqueness = Math.round(
      Object.values(lowestUniqueness).reduce((sum, score) => sum + score, 0) /
        Object.keys(lowestUniqueness).length
    );

    // Sort similar ideas by similarity score (descending)
    similarities.sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      uniquenessScore: overallUniqueness,
      fieldUniqueness: lowestUniqueness,
      similarIdeas: similarities.slice(0, 5), // Limit to top 5 similar ideas
      explanation: generateUniquenessExplanation(
        overallUniqueness,
        lowestUniqueness
      ),
      embeddings: newIdeaEmbeddings,
      hashes,
    };
  } catch (error) {
    console.error("Error checking idea uniqueness:", error);
    throw new Error("Failed to analyze idea uniqueness");
  }
}

/**
 * Generate explanation for similarity between ideas
 * @param {Object} fieldSimilarity - Similarity scores for each field
 * @param {string} ideaTitle - Title of the similar idea
 * @returns {string} - Explanation of similarity
 */
function generateSimilarityExplanation(fieldSimilarity, ideaTitle) {
  const fields = Object.keys(fieldSimilarity);
  fields.sort((a, b) => fieldSimilarity[b] - fieldSimilarity[a]);

  const topSimilarFields = fields
    .filter((field) => fieldSimilarity[field] > 0.5)
    .slice(0, 2);

  if (topSimilarFields.length === 0) {
    return `Some general similarity with "${ideaTitle}".`;
  }

  const fieldNames = topSimilarFields
    .map((f) => {
      const similarity = Math.round(fieldSimilarity[f] * 100);
      return `${f} (${similarity}% similar)`;
    })
    .join(" and ");

  return `Similar ${fieldNames} to "${ideaTitle}".`;
}

/**
 * Generate explanation for overall uniqueness analysis
 * @param {number} overallUniqueness - Overall uniqueness score
 * @param {Object} fieldUniqueness - Uniqueness scores for each field
 * @returns {string} - Explanation of uniqueness
 */
function generateUniquenessExplanation(overallUniqueness, fieldUniqueness) {
  const fields = Object.keys(fieldUniqueness);

  // Find the least unique field
  let leastUniqueField = fields[0];
  let leastUniqueScore = fieldUniqueness[fields[0]];

  fields.forEach((field) => {
    if (fieldUniqueness[field] < leastUniqueScore) {
      leastUniqueField = field;
      leastUniqueScore = fieldUniqueness[field];
    }
  });

  // Generate explanation based on overall uniqueness
  let explanation = "";

  if (overallUniqueness >= 90) {
    explanation =
      "This idea is highly unique compared to existing ideas in this room.";
  } else if (overallUniqueness >= 70) {
    explanation =
      "This idea is mostly unique with some similarities to existing ideas.";
  } else if (overallUniqueness >= 50) {
    explanation = `This idea has moderate uniqueness, with the ${leastUniqueField} being the least unique aspect.`;
  } else if (overallUniqueness >= 30) {
    explanation = `This idea shows significant similarities to existing ideas, particularly in the ${leastUniqueField}.`;
  } else {
    explanation = `This idea has low uniqueness, with very similar ${leastUniqueField} to existing ideas.`;
  }

  return explanation;
}

module.exports = { checkIdeaUniqueness };
