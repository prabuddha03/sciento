const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a PDF buffer to Cloudinary
 * @param {Buffer} pdfBuffer - The PDF buffer to upload
 * @param {string} fileName - The name for the file
 * @returns {Promise<Object>} - Cloudinary upload response with URL and other info
 */
async function uploadPDFToCloudinary(pdfBuffer, fileName) {
  try {
    // Create a unique file name to avoid collisions
    const uniqueFileName = `${fileName.replace(/\s+/g, "_")}_${Date.now()}`;

    // Convert buffer to base64 string for Cloudinary upload
    const base64Data = pdfBuffer.toString("base64");
    const dataURI = `data:application/pdf;base64,${base64Data}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: "raw",
      public_id: uniqueFileName,
      folder: "research_papers",
      format: "pdf",
      overwrite: true,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload PDF to Cloudinary");
  }
}

module.exports = { uploadPDFToCloudinary };
