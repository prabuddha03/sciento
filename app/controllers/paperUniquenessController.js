const dbConnect = require("../utils/dbConnect");
const Paper = require("../models/Paper");
const { uploadPDFToCloudinary } = require("../utils/cloudinaryUploader");
const {
  extractFromPdf,
  generatePaperEmbeddings,
  calculatePaperSimilarity,
} = require("../utils/paperExtractor");

/**
 * Check the uniqueness of a research paper against existing papers using Gemini
 * @param {Object} req - Express request object with uploaded PDF file
 * @param {Object} res - Express response object
 */
async function checkPaperUniqueness(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded",
      });
    }

    // Extract metadata if provided
    const { title, authors, doi, journal, year } = req.body;

    // Process the uploaded PDF
    const pdfBuffer = req.file.buffer;

    // Step 1: Extract abstract and conclusion from the PDF
    const extractedData = await extractFromPdf(pdfBuffer);

    // Make sure we have enough data to analyze
    if (!extractedData.abstract && !extractedData.conclusion) {
      return res.status(400).json({
        success: false,
        error: "Could not extract abstract or conclusion from the PDF",
      });
    }

    // Step 2: Generate paper data for Gemini analysis
    const paperData = await generatePaperEmbeddings(extractedData);

    // Step 3: Calculate similarity with Gemini
    const similarityResults = await calculatePaperSimilarity(paperData);

    // Step 4: Upload the PDF to Cloudinary
    const cloudinaryResult = await uploadPDFToCloudinary(
      pdfBuffer,
      title || extractedData.info?.Title || "untitled_paper"
    );

    // --- Calculate Publication Year Safely ---
    let finalPublicationYear = undefined; // Use undefined for optional fields
    if (year) {
      const parsedYear = parseInt(year);
      if (!isNaN(parsedYear)) {
        finalPublicationYear = parsedYear;
      }
    } else if (extractedData.info?.CreationDate) {
      const date = new Date(extractedData.info.CreationDate);
      // Check if the date is valid before getting the year
      if (!isNaN(date.getTime())) {
        finalPublicationYear = date.getFullYear();
      }
    }
    // --- End Calculation ---

    // Step 5: Save the paper and analysis results to the database
    const paper = new Paper({
      title: title || extractedData.info?.Title || "Untitled Paper",
      authors: authors ? authors.split(",").map((a) => a.trim()) : [],
      abstract: extractedData.abstract,
      conclusion: extractedData.conclusion,
      publicationYear: finalPublicationYear, // Assign the safely calculated year or undefined
      doi: doi,
      journal: journal,
      uniquenessScore: similarityResults.uniquenessScore,
      similarityExplanation: similarityResults.explanation,
      similarPapers: similarityResults.similarPapers.map((paper) => ({
        paperId: paper.paperId,
        similarityScore: paper.similarity,
        explanation: paper.explanation,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
      })),
      originalPdf: {
        cloudinaryUrl: cloudinaryResult.url,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        publicId: cloudinaryResult.publicId,
      },
      isAnalyzed: true,
    });

    await paper.save();

    // Return the analysis results to the client
    res.status(200).json({
      success: true,
      paper: {
        id: paper._id,
        title: paper.title,
        abstract:
          extractedData.abstract.substring(0, 250) +
          (extractedData.abstract.length > 250 ? "..." : ""),
        conclusion:
          extractedData.conclusion.substring(0, 250) +
          (extractedData.conclusion.length > 250 ? "..." : ""),
        pageCount: extractedData.pageCount,
      },
      uniquenessScore: similarityResults.uniquenessScore,
      explanation: similarityResults.explanation,
      similarPapers: similarityResults.similarPapers,
      message: "Paper uniqueness analysis completed successfully",
    });
  } catch (error) {
    console.error("Error analyzing paper uniqueness:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

/**
 * Get a list of papers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPapers(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract query parameters
    const {
      limit = 10,
      skip = 0,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query;

    // Build sort criteria
    const sortCriteria = {};
    sortCriteria[sortBy] = sortDir === "asc" ? 1 : -1;

    // Query database
    const papers = await Paper.find()
      .select("title authors abstract uniquenessScore createdAt originalPdf")
      .sort(sortCriteria)
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    // Get total count
    const total = await Paper.countDocuments();

    // Return papers
    res.status(200).json({
      success: true,
      count: papers.length,
      total,
      papers: papers.map((paper) => ({
        id: paper._id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract
          ? paper.abstract.substring(0, 200) +
            (paper.abstract.length > 200 ? "..." : "")
          : "",
        uniquenessScore: paper.uniquenessScore,
        createdAt: paper.createdAt,
        pdfUrl: paper.originalPdf?.cloudinaryUrl,
      })),
    });
  } catch (error) {
    console.error("Error getting papers:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

/**
 * Get a single paper with its similarity details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPaper(req, res) {
  try {
    // Connect to database
    await dbConnect();

    // Extract paper ID
    const { paperId } = req.params;

    // Query database
    const paper = await Paper.findById(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        error: "Paper not found",
      });
    }

    // Return paper with detailed info
    res.status(200).json({
      success: true,
      paper: {
        id: paper._id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        conclusion: paper.conclusion,
        uniquenessScore: paper.uniquenessScore,
        similarityExplanation: paper.similarityExplanation,
        similarPapers: paper.similarPapers.map((sp) => ({
          title: sp.title,
          authors: sp.authors,
          year: sp.year,
          similarityScore: sp.similarityScore,
          explanation: sp.explanation,
        })),
        pdfUrl: paper.originalPdf?.cloudinaryUrl,
        createdAt: paper.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting paper:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Server error",
    });
  }
}

module.exports = { checkPaperUniqueness, getPapers, getPaper };
