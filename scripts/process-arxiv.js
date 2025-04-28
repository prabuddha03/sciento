#!/usr/bin/env node

/**
 * Script to convert arXiv dataset format to match our Paper schema
 * This helps when importing from specific dataset formats
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { program } = require("commander");

// Command line options
program
  .version("1.0.0")
  .description("Convert arXiv or other dataset formats to our Paper schema")
  .option(
    "-s, --source <path>",
    "Path to the source dataset file",
    "./arxiv-data.json"
  )
  .option(
    "-o, --output <path>",
    "Path for the converted output file",
    "./dataset/papers-converted.json"
  )
  .parse(process.argv);

const options = program.opts();

function mapAminerFields(paper) {
  // Map from AMiner dataset format to our schema
  return {
    title: paper.title || "",
    abstract: paper.abstract || "",
    authors: Array.isArray(paper.authors)
      ? paper.authors
      : typeof paper.authors === "string"
      ? paper.authors.split(",").map((a) => a.trim())
      : [],
    year: paper.year || null,
    doi: paper.doi || null,
    journal: paper.venue || paper.journal || null,
    url: paper.url || null,
    keywords: paper.keywords || [],
    citations: paper.n_citation || 0,
    // Add any other field mappings as needed
  };
}

function mapArxivFields(paper) {
  // Map from arXiv dataset format to our schema
  return {
    title: paper.title || "",
    abstract: paper.abstract || paper.summary || "",
    authors: Array.isArray(paper.authors)
      ? paper.authors
      : typeof paper.authors === "string"
      ? paper.authors.split(",").map((a) => a.trim())
      : [],
    year:
      paper.year ||
      (paper.published ? new Date(paper.published).getFullYear() : null),
    doi: paper.doi || null,
    journal: paper.journal || paper.venue || null,
    url: paper.url || paper.pdf_url || null,
    keywords: paper.keywords || paper.categories || [],
    citations: paper.citation_count || 0,
    // Add any other field mappings as needed
  };
}

async function convertDataset() {
  try {
    console.log(`
====================================================
            DATASET FORMAT CONVERTER
====================================================
Source: ${options.source}
Output: ${options.output}
====================================================
`);

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Check if source file exists
    if (!fs.existsSync(options.source)) {
      console.error(`Source file does not exist: ${options.source}`);
      process.exit(1);
    }

    console.log("Reading source file...");
    const fileContent = fs.readFileSync(options.source, "utf8");
    let data;

    try {
      // Try parsing as JSON
      data = JSON.parse(fileContent);
    } catch (parseError) {
      console.error("Error parsing JSON file. Is it a valid JSON file?");
      process.exit(1);
    }

    // Get papers array - handle different formats
    let sourcePapers = [];
    if (Array.isArray(data)) {
      sourcePapers = data;
    } else if (data.papers && Array.isArray(data.papers)) {
      sourcePapers = data.papers;
    } else if (data.items && Array.isArray(data.items)) {
      // Common in some arXiv formats
      sourcePapers = data.items;
    } else {
      console.error("Could not find papers array in the source file");
      process.exit(1);
    }

    console.log(`Found ${sourcePapers.length} papers in the source file`);

    // Detect the format based on some heuristics
    const isArxiv =
      sourcePapers.length > 0 &&
      (sourcePapers[0].hasOwnProperty("summary") ||
        sourcePapers[0].hasOwnProperty("categories"));

    const isAminer =
      sourcePapers.length > 0 &&
      (sourcePapers[0].hasOwnProperty("n_citation") ||
        sourcePapers[0].hasOwnProperty("venue"));

    console.log(
      `Detected format: ${isArxiv ? "arXiv" : isAminer ? "AMiner" : "Unknown"}`
    );

    // Convert papers to our schema
    const convertedPapers = sourcePapers.map((paper) => {
      if (isArxiv) {
        return mapArxivFields(paper);
      } else if (isAminer) {
        return mapAminerFields(paper);
      } else {
        // Generic/unknown format - do basic mapping
        return {
          title: paper.title || "",
          abstract: paper.abstract || "",
          authors: paper.authors || [],
          year: paper.year || null,
          doi: paper.doi || null,
          journal: paper.journal || paper.venue || null,
          url: paper.url || null,
          keywords: paper.keywords || [],
        };
      }
    });

    // Filter out papers without title or abstract
    const validPapers = convertedPapers.filter((p) => p.title && p.abstract);
    console.log(
      `Converted ${validPapers.length} papers (filtered out ${
        convertedPapers.length - validPapers.length
      } invalid papers)`
    );

    // Write the converted papers to the output file
    const outputData = JSON.stringify(validPapers, null, 2);
    fs.writeFileSync(options.output, outputData);

    console.log(`
====================================================
                CONVERSION COMPLETED
====================================================
Successfully converted ${validPapers.length} papers
Output file: ${options.output}
File size: ${(outputData.length / 1024 / 1024).toFixed(2)} MB
====================================================
`);
  } catch (error) {
    console.error(`Error converting dataset: ${error.message}`);
    process.exit(1);
  }
}

// Run the conversion
convertDataset().catch(console.error);
