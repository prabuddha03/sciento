const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import middleware
const { uploadPDF } = require("./app/middleware/upload");
const errorHandler = require("./app/middleware/errorHandler");

// Import controllers
const { generatePaper } = require("./app/controllers/paperController");
const { analyzePaper } = require("./app/controllers/analyzeController");

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.post("/generate-paper", uploadPDF, generatePaper);
app.post("/analyze-paper", uploadPDF, analyzePaper);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Research Paper Generator API",
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
    ],
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
