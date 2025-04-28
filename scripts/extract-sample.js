#!/usr/bin/env node

/**
 * Script to extract a sample subset from a large dataset
 * Creates a smaller dataset for development and testing
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { program } = require("commander");

// Command line options
program
  .version("1.0.0")
  .description("Extract a sample subset from a large dataset")
  .option(
    "-s, --source <path>",
    "Path to the source dataset file",
    "./original-dataset.json"
  )
  .option(
    "-o, --output <path>",
    "Path for the output sample file",
    "./dataset/papers-sample.json"
  )
  .option(
    "-n, --size <number>",
    "Number of papers to include in the sample",
    parseInt,
    1000
  )
  .option(
    "-r, --random",
    "Select papers randomly instead of from the beginning",
    false
  )
  .parse(process.argv);

const options = program.opts();

async function extractSample() {
  try {
    console.log(`
====================================================
             DATASET SAMPLE EXTRACTOR
====================================================
Source: ${options.source}
Output: ${options.output}
Sample size: ${options.size}
Random selection: ${options.random ? "Yes" : "No"}
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
    let papers = [];
    if (Array.isArray(data)) {
      papers = data;
    } else if (data.papers && Array.isArray(data.papers)) {
      papers = data.papers;
    } else {
      console.error("Could not find papers array in the source file");
      process.exit(1);
    }

    console.log(`Found ${papers.length} papers in the source file`);

    // Select papers for the sample
    let samplePapers = [];
    if (options.random) {
      // Random selection
      const indices = new Set();
      while (indices.size < Math.min(options.size, papers.length)) {
        indices.add(Math.floor(Math.random() * papers.length));
      }
      samplePapers = Array.from(indices).map((i) => papers[i]);
    } else {
      // Take first N papers
      samplePapers = papers.slice(0, options.size);
    }

    console.log(`Selected ${samplePapers.length} papers for the sample`);

    // Write the sample to the output file
    const outputData = JSON.stringify(samplePapers, null, 2);
    fs.writeFileSync(options.output, outputData);

    console.log(`
====================================================
                 SAMPLE CREATED
====================================================
Successfully created sample with ${samplePapers.length} papers
Output file: ${options.output}
File size: ${(outputData.length / 1024 / 1024).toFixed(2)} MB
====================================================
`);
  } catch (error) {
    console.error(`Error extracting sample: ${error.message}`);
    process.exit(1);
  }
}

// Run the extraction
extractSample().catch(console.error);
