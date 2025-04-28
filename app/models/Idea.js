const mongoose = require("mongoose");

const IdeaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide an idea title"],
    trim: true,
    maxlength: [100, "Idea title cannot be more than 100 characters"],
    unique: true,
  },
  description: {
    type: String,
    required: [true, "Please provide an idea description"],
    trim: true,
    maxlength: [5000, "Idea description cannot be more than 5000 characters"],
  },
  domain: {
    type: String,
    required: [true, "Please provide a domain for this idea"],
    trim: true,
  },
  problemStatement: {
    type: String,
    required: [true, "Please provide a problem statement"],
    trim: true,
  },
  proposedSolution: {
    type: String,
    required: [true, "Please provide a proposed solution"],
    trim: true,
  },
  authorName: {
    type: String,
    required: [true, "Please provide an author name"],
    trim: true,
  },
  authorEmail: {
    type: String,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: [true, "Idea must be associated with a room"],
  },
  uniquenessScore: {
    type: Number,
    default: 0, // To be calculated later
  },
  // Field-specific uniqueness scores
  fieldUniqueness: {
    problemStatement: {
      type: Number,
      default: 100,
    },
    proposedSolution: {
      type: Number,
      default: 100,
    },
    description: {
      type: Number,
      default: 100,
    },
    domain: {
      type: Number,
      default: 100,
    },
  },
  // Store BERT embeddings for each field
  embeddings: {
    problemStatement: [Number],
    proposedSolution: [Number],
    description: [Number],
    domain: [Number],
  },
  similarIdeas: [
    {
      ideaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Idea",
      },
      similarityScore: {
        type: Number,
      },
      fieldSimilarity: {
        problemStatement: Number,
        proposedSolution: Number,
        description: Number,
        domain: Number,
      },
      explanation: String,
    },
  ],
  keywords: [
    {
      type: String,
      trim: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAnalyzed: {
    type: Boolean,
    default: false,
  },
  // Store the murmurhash of problem statement and proposed solution for quick exact matching
  hashes: {
    problemStatement: String,
    proposedSolution: String,
  },
});

module.exports = mongoose.models.Idea || mongoose.model("Idea", IdeaSchema);
