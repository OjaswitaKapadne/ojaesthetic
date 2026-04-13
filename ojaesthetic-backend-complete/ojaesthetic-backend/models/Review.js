/**
 * models/Review.js
 * User review/testimonial schema
 */

const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [500, 'Review cannot exceed 500 characters'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 5,
    },
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork',
      default: null, // Optional — can be a general platform review
    },
    isApproved: {
      type: Boolean,
      default: false, // Admin must approve before showing publicly
    },
    isHighlighted: {
      type: Boolean,
      default: false, // Featured on homepage
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// Prevent duplicate reviews per user per artwork
// ============================================================
ReviewSchema.index({ userId: 1, artworkId: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ isApproved: 1, isHighlighted: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
