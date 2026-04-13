/**
 * controllers/reviewController.js
 */

const Review = require('../models/Review');
const { AppError } = require('../middleware/errorHandler');

exports.submitReview = async (req, res, next) => {
  try {
    const { text, rating, artworkId } = req.body;

    // Check for existing review from this user for this artwork
    const existingQuery = { userId: req.user._id };
    if (artworkId) existingQuery.artworkId = artworkId;
    else existingQuery.artworkId = null;

    const existing = await Review.findOne(existingQuery);
    if (existing) {
      return next(new AppError('You have already submitted a review for this item.', 400));
    }

    const review = await Review.create({
      userId:    req.user._id,
      text,
      rating:    rating || 5,
      artworkId: artworkId || null,
      isApproved: false, // requires admin approval
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted! It will appear after approval. Thank you 🌸',
      review,
    });
  } catch (err) {
    next(err);
  }
};

exports.getApprovedReviews = async (req, res, next) => {
  try {
    const { artworkId, highlighted } = req.query;
    const filter = { isApproved: true };
    if (artworkId)          filter.artworkId     = artworkId;
    if (highlighted === 'true') filter.isHighlighted = true;

    const reviews = await Review.find(filter)
      .populate('userId', 'name avatar')
      .sort('-createdAt')
      .lean();

    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (err) {
    next(err);
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name email')
      .populate('artworkId', 'title')
      .sort('-createdAt')
      .lean();
    res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (err) { next(err); }
};

exports.approveReview = async (req, res, next) => {
  try {
    const { isApproved, isHighlighted } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved, isHighlighted },
      { new: true }
    );
    if (!review) return next(new AppError('Review not found.', 404));
    res.status(200).json({ success: true, review });
  } catch (err) { next(err); }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return next(new AppError('Review not found.', 404));
    res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (err) { next(err); }
};
