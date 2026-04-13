/**
 * controllers/uploadController.js
 * General-purpose file upload (reference images, avatars)
 */

const { uploadToCloudinary } = require('../middleware/upload');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// POST /api/upload/avatar — user avatar upload
// ============================================================
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError('Please select an image to upload.', 400));

    const result = await uploadToCloudinary(req.file.buffer, 'avatars', {
      public_id:      `avatar_${req.user._id}`,
      overwrite:      true,
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    });

    // Update user avatar
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url });

    res.status(200).json({
      success:   true,
      message:   'Avatar uploaded successfully.',
      avatarUrl: result.secure_url,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/upload/references — reference images for orders
// ============================================================
exports.uploadReferences = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('Please select at least one image.', 400));
    }

    const urls = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer, 'order-references', {
        transformation: [{ width: 1200, quality: 'auto', fetch_format: 'auto' }],
      });
      urls.push(result.secure_url);
    }

    res.status(200).json({
      success: true,
      message: `${urls.length} image(s) uploaded successfully.`,
      urls,
    });
  } catch (err) {
    next(err);
  }
};
