const multer = require("multer");

// Configure multer for memory storage (keep files in memory as buffers)
const storage = multer.memoryStorage();

// Set up file filter to only accept PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

// Configure upload options
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
});

// Middleware to handle PDF file upload
const uploadPDF = upload.single("pdf");

module.exports = { uploadPDF };
