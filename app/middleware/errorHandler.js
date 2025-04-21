/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Handle multer errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 10MB.",
      });
    }
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
    });
  }

  // Handle other known errors
  if (err.message === "Only PDF files are allowed") {
    return res.status(400).json({
      error: "Only PDF files are allowed",
    });
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
