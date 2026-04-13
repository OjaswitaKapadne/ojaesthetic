/**
 * controllers/artworkController.js
 * Full CRUD for gallery artworks
 */

const Artwork  = require('../models/Artwork');
const { AppError } = require('../middleware/errorHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// ============================================================
// GET /api/artworks — all published artworks with search & filter
// ============================================================
exports.getAllArtworks = async (req, res, next) => {
  try {
    const {
      category, tags, search,
      featured, page = 1, limit = 12,
      sort = '-createdAt',
    } = req.query;

    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) };
    if (search) {
      filter.$text = { $search: search };
    }

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Artwork.countDocuments(filter);

    const artworks = await Artwork.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: artworks.length,
      artworks,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/artworks/:id — single artwork
// ============================================================
exports.getArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findOne({
      _id: req.params.id,
      isPublished: true,
    }).populate('createdBy', 'name');

    if (!artwork) return next(new AppError('Artwork not found.', 404));

    res.status(200).json({ success: true, artwork });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/artworks — create (admin only)
// ============================================================
exports.createArtwork = async (req, res, next) => {
  try {
    const { title, description, category, tags, price, downloadable, featured } = req.body;

    if (!req.file) return next(new AppError('Please upload an artwork image.', 400));

    // Upload image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'artworks', {
      public_id: `artwork_${Date.now()}`,
      transformation: [{ width: 1400, quality: 'auto', fetch_format: 'auto' }],
    });

    const artwork = await Artwork.create({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      price:        price ? Number(price) : null,
      downloadable: downloadable === 'true',
      featured:     featured === 'true',
      imageUrl:     result.secure_url,
      cloudinaryPublicId: result.public_id,
      downloadUrl:  downloadable === 'true' ? result.secure_url : null,
      createdBy:    req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Artwork created successfully! 🎨',
      artwork,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PATCH /api/artworks/:id — update (admin only)
// ============================================================
exports.updateArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return next(new AppError('Artwork not found.', 404));

    const updates = { ...req.body };
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((t) => t.trim());
    }

    // New image uploaded?
    if (req.file) {
      if (artwork.cloudinaryPublicId) {
        await deleteFromCloudinary(artwork.cloudinaryPublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'artworks', {
        transformation: [{ width: 1400, quality: 'auto', fetch_format: 'auto' }],
      });
      updates.imageUrl = result.secure_url;
      updates.cloudinaryPublicId = result.public_id;
    }

    const updated = await Artwork.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Artwork updated.', artwork: updated });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE /api/artworks/:id — (admin only)
// ============================================================
exports.deleteArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return next(new AppError('Artwork not found.', 404));

    // Remove image from Cloudinary
    if (artwork.cloudinaryPublicId) {
      await deleteFromCloudinary(artwork.cloudinaryPublicId);
    }

    await artwork.deleteOne();

    res.status(200).json({ success: true, message: 'Artwork deleted.' });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/artworks/:id/download — secure download
// ============================================================
exports.downloadArtwork = async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return next(new AppError('Artwork not found.', 404));
    if (!artwork.downloadable) {
      return next(new AppError('This artwork is not available for download.', 403));
    }
    // Redirect to Cloudinary URL (Cloudinary handles secure delivery)
    res.redirect(artwork.downloadUrl || artwork.imageUrl);
  } catch (err) {
    next(err);
  }
};
