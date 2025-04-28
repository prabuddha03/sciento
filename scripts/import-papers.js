#!/usr/bin/env node

/**
 * Script to import scientific papers from a Kaggle dataset into MongoDB
 * and generate embeddings for each paper's abstract and conclusion
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const mongoose = require("mongoose");
const axios = require("axios");
const { program } = require("commander");
const Paper = require("../app/models/Paper");
const {
  extractAbstract,
  extractConclusion,
} = require("../app/utils/paperExtractor");

//cli
program
  .version("1.0.0")
  .description("Import scientific papers from a Kaggle dataset into MongoDB")
  .option(
    "-d, --dataset <path>",
    "Path to the dataset directory or file",
    "./dataset"
  )
  .option(
    "-l, --limit <number>",
    "Limit the number of papers to import",
    parseInt,
    0
  )
  .option(
    "-b, --batch <number>",
    "Batch size for processing papers",
    parseInt,
    100
  )
  .option("-s, --skip <number>", "Number of papers to skip", parseInt, 0)
  .parse(process.argv);

const options = program.opts();

// MongoDB connection string from environment or default
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sciento";

// Embedding service URL from environment or default
const EMBEDDING_SERVICE_URL =
  process.env.EMBEDDING_SERVICE_URL?.replace(
    "/embeddings",
    "/paper/embeddings"
  ) || "http://localhost:5000/api/paper/embeddings";

// Stats
let processed = 0;
let imported = 0;
let failed = 0;
let startTime = Date.now();

/**
 * Generate embeddings for abstract and conclusion using the embedding service
 * @param {Object} data - Object containing abstract and conclusion
 * @returns {Promise<Object>} - Embeddings for the abstract and conclusion
 */
async function generateEmbeddings(data) {
  try {
    // Only include fields that are not empty
    const requestData = {};
    if (data.abstract) requestData.abstract = data.abstract;
    if (data.conclusion) requestData.conclusion = data.conclusion;

    // Return empty object if no data to embed
    if (Object.keys(requestData).length === 0) {
      return {};
    }

    const response = await axios.post(EMBEDDING_SERVICE_URL, requestData);
    return response.data.embeddings;
  } catch (error) {
    console.error("Error generating paper embeddings:", error.message);
    return {};
  }
}

/**
 * Process a single paper and save it to MongoDB
 * @param {Object} paper - Paper data
 * @returns {Promise<boolean>} - Whether the paper was successfully processed
 */
async function processPaper(paper) {
  try {
    // Skip if no title or empty abstract
    if (!paper.title || !paper.abstract) {
      return false;
    }

    // Check if paper already exists
    const existingPaper = await Paper.findOne({ title: paper.title });
    if (existingPaper) {
      console.log(`Paper already exists: ${paper.title.substring(0, 50)}...`);
      return false;
    }

    // Get abstract and conclusion
    let abstract = paper.abstract || "";
    let conclusion = paper.conclusion || "";

    // If we have full text but no abstract or conclusion, extract them
    if (paper.full_text && (!abstract || !conclusion)) {
      if (!abstract) {
        abstract = extractAbstract(paper.full_text);
      }
      if (!conclusion) {
        conclusion = extractConclusion(paper.full_text);
      }
    }

    // Generate embeddings
    const embeddings = await generateEmbeddings({
      abstract,
      conclusion,
    });

    // Create paper document
    const paperDoc = new Paper({
      title: paper.title,
      authors: paper.authors || [],
      abstract,
      conclusion,
      year: paper.year || null,
      doi: paper.doi || null,
      journal: paper.journal || null,
      url: paper.url || null,
      keywords: paper.keywords || [],
      citations: paper.citations || 0,
      embeddings,
    });

    // Save to MongoDB
    await paperDoc.save();
    return true;
  } catch (error) {
    console.error(`Error processing paper: ${error.message}`);
    return false;
  }
}

/**
 * Import papers from a CSV file
 * @param {string} filePath - Path to the CSV file
 * @param {number} batchSize - Number of papers to process in a batch
 * @returns {Promise<Object>} - Stats about the import process
 */
async function importFromCsv(filePath, batchSize) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        // Skip if we're below the skip option
        if (count < options.skip) {
          count++;
          return;
        }

        // Stop if we've reached the limit
        if (options.limit > 0 && results.length >= options.limit) {
          return;
        }

        results.push(data);

        // Process in batches
        if (results.length >= batchSize) {
          processBatch(results).catch(console.error);
          results.length = 0; // Clear the array
        }

        count++;
      })
      .on("end", () => {
        // Process any remaining papers
        if (results.length > 0) {
          processBatch(results).catch(console.error);
        }
        resolve({ count });
      })
      .on("error", reject);
  });
}

/**
 * Import papers from a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {number} batchSize - Number of papers to process in a batch
 * @returns {Promise<Object>} - Stats about the import process
 */
async function importFromJson(filePath, batchSize) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let papers = Array.isArray(data) ? data : data.papers || [];

    // Apply skip and limit
    if (options.skip > 0) {
      papers = papers.slice(options.skip);
    }

    if (options.limit > 0) {
      papers = papers.slice(0, options.limit);
    }

    // Process in batches
    for (let i = 0; i < papers.length; i += batchSize) {
      const batch = papers.slice(i, i + batchSize);
      await processBatch(batch);
    }

    return { count: papers.length };
  } catch (error) {
    console.error(`Error importing from JSON: ${error.message}`);
    throw error;
  }
}

/**
 * Process a batch of papers
 * @param {Array} papers - Array of paper data
 * @returns {Promise<void>}
 */
async function processBatch(papers) {
  const results = await Promise.all(papers.map(processPaper));

  processed += papers.length;
  imported += results.filter(Boolean).length;
  failed += results.filter((r) => !r).length;

  // Calculate processing rate and elapsed time
  const elapsedTime = (Date.now() - startTime) / 1000;
  const rate = processed / elapsedTime;

  console.log(`
Processed: ${processed} | Imported: ${imported} | Failed: ${failed}
Rate: ${rate.toFixed(2)} papers/second | Elapsed: ${elapsedTime.toFixed(1)}s
  `);
}

/**
 * Main function to run the import process
 */
async function main() {
  try {
    console.log(`
====================================================
           SCIENTIFIC PAPERS IMPORT TOOL
====================================================
Dataset: ${options.dataset}
Limit: ${options.limit || "No limit"}
Batch size: ${options.batch}
Skip: ${options.skip}
====================================================
`);

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const datasetPath = path.resolve(options.dataset);

    // Check if path exists
    if (!fs.existsSync(datasetPath)) {
      console.error(`Dataset path does not exist: ${datasetPath}`);
      process.exit(1);
    }

    // Process a directory of files
    if (fs.statSync(datasetPath).isDirectory()) {
      const files = fs.readdirSync(datasetPath);
      console.log(`Found ${files.length} files in the dataset directory`);

      for (const file of files) {
        const filePath = path.join(datasetPath, file);

        // Skip directories and non-data files
        if (
          fs.statSync(filePath).isDirectory() ||
          !(file.endsWith(".csv") || file.endsWith(".json"))
        ) {
          continue;
        }

        console.log(`Processing file: ${file}`);

        if (file.endsWith(".csv")) {
          await importFromCsv(filePath, options.batch);
        } else if (file.endsWith(".json")) {
          await importFromJson(filePath, options.batch);
        }
      }
    }
    // Process a single file
    else {
      if (datasetPath.endsWith(".csv")) {
        await importFromCsv(datasetPath, options.batch);
      } else if (datasetPath.endsWith(".json")) {
        await importFromJson(datasetPath, options.batch);
      } else {
        console.error(
          "Unsupported file format. Please provide a CSV or JSON file."
        );
        process.exit(1);
      }
    }

    console.log(`
====================================================
                 IMPORT COMPLETED
====================================================
Total processed: ${processed}
Successfully imported: ${imported}
Failed: ${failed}
Total time: ${((Date.now() - startTime) / 1000).toFixed(1)}s
====================================================
`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error(`Error in import process: ${error.message}`);
    process.exit(1);
  }
}

// Start the import process
main().catch(console.error);
