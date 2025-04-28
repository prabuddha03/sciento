const dbConnect = require("../utils/dbConnect");
const Idea = require("../models/Idea");
const Room = require("../models/Room");
const { checkIdeaUniqueness } = require("../utils/uniquenessChecker");

/**
 * Submit a new idea and check its uniqueness
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitIdea(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract data from request
    const {
      title,
      description,
      domain,
      problemStatement,
      proposedSolution,
      authorName,
      authorEmail,
      roomId,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "title",
      "description",
      "domain",
      "problemStatement",
      "proposedSolution",
      "authorName",
      "roomId",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        missingFields,
      });
    }

    // Verify room exists and is active
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    if (!room.isActive || room.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: "This room is no longer active or has expired",
      });
    }

    // Get existing ideas in the room for uniqueness check
    const existingIdeas = await Idea.find({ roomId });

    // Create new idea object
    const newIdea = {
      title,
      description,
      domain,
      problemStatement,
      proposedSolution,
      authorName,
      authorEmail,
      roomId,
    };

    // Check uniqueness against existing ideas
    const uniquenessResult = await checkIdeaUniqueness(newIdea, existingIdeas);

    // If idea is rejected due to exact match, return error
    if (uniquenessResult.isRejected) {
      return res.status(400).json({
        success: false,
        error: "Idea rejected",
        explanation: uniquenessResult.explanation,
      });
    }

    // Save the idea with uniqueness analysis
    const idea = new Idea({
      ...newIdea,
      uniquenessScore: uniquenessResult.uniquenessScore,
      fieldUniqueness: uniquenessResult.fieldUniqueness,
      embeddings: uniquenessResult.embeddings,
      hashes: uniquenessResult.hashes,
      similarIdeas: uniquenessResult.similarIdeas.map((similar) => ({
        ideaId: similar.ideaId,
        similarityScore: similar.similarityScore,
        fieldSimilarity: similar.fieldSimilarity,
        explanation: similar.explanation,
      })),
      isAnalyzed: true,
    });

    await idea.save();

    // Return the created idea with uniqueness analysis
    res.status(201).json({
      success: true,
      message: "Idea submitted successfully",
      idea: {
        id: idea._id,
        title: idea.title,
        description: idea.description,
        domain: idea.domain,
        problemStatement: idea.problemStatement,
        proposedSolution: idea.proposedSolution,
        authorName: idea.authorName,
        createdAt: idea.createdAt,
        roomId: idea.roomId,
        uniquenessScore: idea.uniquenessScore,
        fieldUniqueness: idea.fieldUniqueness,
      },
      uniquenessAnalysis: {
        uniquenessScore: uniquenessResult.uniquenessScore,
        fieldUniqueness: uniquenessResult.fieldUniqueness,
        explanation: uniquenessResult.explanation,
        similarIdeas: uniquenessResult.similarIdeas.map((idea) => ({
          ideaId: idea.ideaId,
          similarityScore: idea.similarityScore,
          fieldSimilarity: idea.fieldSimilarity,
          explanation: idea.explanation,
        })),
      },
    });
  } catch (error) {
    console.error("Error submitting idea:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

/**
 * Get all ideas for a specific room
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getRoomIdeas(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract room ID from params
    const { roomId } = req.params;

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Get all ideas for the room
    const ideas = await Idea.find({ roomId })
      .select(
        "title description domain problemStatement proposedSolution authorName createdAt uniquenessScore fieldUniqueness"
      )
      .sort("-createdAt");

    // Return the ideas
    res.status(200).json({
      success: true,
      count: ideas.length,
      ideas: ideas.map((idea) => ({
        id: idea._id,
        title: idea.title,
        description: idea.description,
        domain: idea.domain,
        problemStatement: idea.problemStatement,
        proposedSolution: idea.proposedSolution,
        authorName: idea.authorName,
        createdAt: idea.createdAt,
        uniquenessScore: idea.uniquenessScore,
        fieldUniqueness: idea.fieldUniqueness,
      })),
    });
  } catch (error) {
    console.error("Error getting room ideas:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

/**
 * Get ideas similar to a specific idea
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSimilarIdeas(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract idea ID from params
    const { ideaId } = req.params;

    // Find the idea
    const idea = await Idea.findById(ideaId).populate({
      path: "similarIdeas.ideaId",
      select:
        "title description domain problemStatement proposedSolution authorName createdAt uniquenessScore",
    });

    if (!idea) {
      return res.status(404).json({
        success: false,
        error: "Idea not found",
      });
    }

    // Return the similar ideas
    res.status(200).json({
      success: true,
      idea: {
        id: idea._id,
        title: idea.title,
        uniquenessScore: idea.uniquenessScore,
        fieldUniqueness: idea.fieldUniqueness,
      },
      similarIdeas: idea.similarIdeas.map((similar) => ({
        idea: {
          id: similar.ideaId._id,
          title: similar.ideaId.title,
          description: similar.ideaId.description,
          domain: similar.ideaId.domain,
          problemStatement: similar.ideaId.problemStatement,
          proposedSolution: similar.ideaId.proposedSolution,
          authorName: similar.ideaId.authorName,
          createdAt: similar.ideaId.createdAt,
          uniquenessScore: similar.ideaId.uniquenessScore,
        },
        similarityScore: similar.similarityScore,
        fieldSimilarity: similar.fieldSimilarity,
        explanation: similar.explanation,
      })),
    });
  } catch (error) {
    console.error("Error getting similar ideas:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

module.exports = { submitIdea, getRoomIdeas, getSimilarIdeas };
