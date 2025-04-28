const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import database connection
const dbConnect = require("./app/utils/dbConnect");

// Import middleware
const { uploadPDF } = require("./app/middleware/upload");
const errorHandler = require("./app/middleware/errorHandler");

// Import controllers
const { generatePaper } = require("./app/controllers/paperController");
const { analyzePaper } = require("./app/controllers/analyzeController");
const { detectAI } = require("./app/controllers/aiDetectionController");
const { createRoom, getRoom } = require("./app/controllers/roomController");
const {
  submitIdea,
  getRoomIdeas,
  getSimilarIdeas,
} = require("./app/controllers/ideaController");
const {
  checkPaperUniqueness,
  getPapers,
  getPaper,
} = require("./app/controllers/paperUniquenessController");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
dbConnect().catch((err) => console.error("Failed to connect to MongoDB:", err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paper generation routes
app.post("/generate-paper", uploadPDF, generatePaper);
app.post("/analyze-paper", uploadPDF, analyzePaper);
app.post("/detect-ai", uploadPDF, detectAI);

// Room routes
app.post("/rooms", createRoom);
app.get("/rooms/:identifier", getRoom);

// Idea routes
app.post("/ideas", submitIdea);
app.get("/rooms/:roomId/ideas", getRoomIdeas);
app.get("/ideas/:ideaId/similar", getSimilarIdeas);

// Paper uniqueness routes
app.post("/papers/check-uniqueness", uploadPDF, checkPaperUniqueness);
app.get("/papers", getPapers);
app.get("/papers/:paperId", getPaper);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Research Paper Analysis API",
    endpoints: [
      {
        path: "/generate-paper",
        method: "POST",
        description: "Generate a research paper in PDF format",
      },
      {
        path: "/analyze-paper",
        method: "POST",
        description: "Analyze a research paper PDF",
        queryParams: {
          synopsis:
            "Level of detail: brief, moderate, or detailed (default: moderate)",
        },
      },
      {
        path: "/detect-ai",
        method: "POST",
        description: "Detect if text is AI-generated",
        body: "Either text field in JSON or a PDF file upload",
      },
      {
        path: "/rooms",
        method: "POST",
        description: "Create a new room for idea collection",
        body: "name, description, topic, createdBy fields",
      },
      {
        path: "/rooms/:identifier",
        method: "GET",
        description: "Get a room by ID or access code",
      },
      {
        path: "/ideas",
        method: "POST",
        description: "Submit a new idea and check its uniqueness",
        body: "title, description, domain, problemStatement, proposedSolution, authorName, roomId fields",
      },
      {
        path: "/rooms/:roomId/ideas",
        method: "GET",
        description: "Get all ideas for a specific room",
      },
      {
        path: "/ideas/:ideaId/similar",
        method: "GET",
        description: "Get ideas similar to a specific idea",
      },
      {
        path: "/papers/check-uniqueness",
        method: "POST",
        description:
          "Check uniqueness of a scientific paper against 800K papers",
        body: "PDF file upload with optional title, authors, doi, journal, year metadata",
      },
      {
        path: "/papers",
        method: "GET",
        description: "Get a list of papers",
        queryParams: {
          limit: "Number of papers to return (default: 10)",
          skip: "Number of papers to skip (default: 0)",
          sortBy: "Field to sort by (default: createdAt)",
          sortDir: "Sort direction: asc or desc (default: desc)",
        },
      },
      {
        path: "/papers/:paperId",
        method: "GET",
        description: "Get a single paper with its similarity details",
      },
    ],
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
