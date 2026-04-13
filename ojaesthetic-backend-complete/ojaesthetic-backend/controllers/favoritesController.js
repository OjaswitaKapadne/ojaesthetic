/**
 * controllers/favoritesController.js
 * Add / remove / get user favorites (wishlist)
 */

const User    = require('../models/User');
const Artwork = require('../models/Artwork');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// GET /api/favorites — get user's saved artworks
// ============================================================
exports.getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title imageUrl category price downloadable tags createdAt')
      .lean();

    res.status(200).json({
      success: true,
      count: user.favorites.length,
      favorites: user.favorites,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/favorites/add
// ============================================================
exports.addFavorite = async (req, res, next) => {
  try {
    const { artworkId } = req.body;
    if (!artworkId) return next(new AppError('artworkId is required.', 400));

    const artwork = await Artwork.findById(artworkId);
    if (!artwork) return next(new AppError('Artwork not found.', 404));

    const user = await User.findById(req.user._id);
    if (user.favorites.includes(artworkId)) {
      return res.status(200).json({ success: true, message: 'Already in favorites.' });
    }

    user.favorites.push(artworkId);
    await user.save();

    // Increment likes count on artwork
    await Artwork.findByIdAndUpdate(artworkId, { $inc: { likesCount: 1 } });

    res.status(200).json({
      success: true,
      message: 'Added to favorites ❤️',
      favoritesCount: user.favorites.length,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/favorites/remove
// ============================================================
exports.removeFavorite = async (req, res, next) => {
  try {
    const { artworkId } = req.body;
    if (!artworkId) return next(new AppError('artworkId is required.', 400));

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: artworkId } },
      { new: true }
    );

    // Decrement likes count
    await Artwork.findByIdAndUpdate(artworkId, { $inc: { likesCount: -1 } });

    res.status(200).json({
      success: true,
      message: 'Removed from favorites.',
      favoritesCount: user.favorites.length,
    });
  } catch (err) {
    next(err);
  }
};
