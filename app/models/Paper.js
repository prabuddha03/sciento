const mongoose = require("mongoose");

const PaperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a paper title"],
    trim: true,
    maxlength: [200, "Paper title cannot be more than 200 characters"],
  },
  authors: {
    type: [String],
    default: [],
  },
  abstract: {
    type: String,
    trim: true,
  },
  conclusion: {
    type: String,
    trim: true,
  },
  publicationYear: {
    type: Number,
  },
  doi: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
  },
  journal: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    trim: true,
  },
  keywords: {
    type: [String],
    default: [],
  },
  // No longer using embeddings, but keeping field for backward compatibility
  // with a different structure
  uniquenessScore: {
    type: Number,
    default: 0,
  },
  similarityExplanation: {
    type: String,
    default: "",
  },
  similarPapers: [
    {
      paperId: {
        type: String,
      },
      title: {
        type: String,
        default: "Unknown Title",
      },
      authors: {
        type: String,
        default: "Unknown Authors",
      },
      year: {
        type: String,
      },
      similarityScore: {
        type: Number,
      },
      explanation: String,
    },
  ],
  // Original PDF information
  originalPdf: {
    cloudinaryUrl: String,
    fileSize: Number,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAnalyzed: {
    type: Boolean,
    default: false,
  },
});

// Create indexes for faster querying
PaperSchema.index({ title: "text", abstract: "text", conclusion: "text" });
PaperSchema.index({ createdAt: -1 });
PaperSchema.index({ uniquenessScore: -1 });

module.exports = mongoose.models.Paper || mongoose.model("Paper", PaperSchema);
