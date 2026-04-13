/**
 * middleware/upload.js
 * Multer + Cloudinary upload configuration
 */

const multer      = require('multer');
const cloudinary  = require('../config/cloudinary');
const { AppError } = require('./errorHandler');

// ============================================================
// Memory storage (files buffered in memory, then sent to Cloudinary)
// ============================================================
const storage = multer.memoryStorage();

// File filter — images only
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB max
    files: 5,                  // Max 5 files per request
  },
});

// ============================================================
// Upload a buffer to Cloudinary
// ============================================================
const uploadToCloudinary = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `ojaesthetic/${folder}`,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        ...options,
      },
      (error, result) => {
        if (error) reject(new AppError(`Cloudinary upload failed: ${error.message}`, 500));
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ============================================================
// Delete image from Cloudinary by publicId
// ============================================================
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (err) {
    console.error('Cloudinary delete error:', err);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
