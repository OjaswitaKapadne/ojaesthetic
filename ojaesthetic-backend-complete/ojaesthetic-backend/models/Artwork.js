/**
 * models/Artwork.js
 * Artwork/Gallery schema
 */

const mongoose = require('mongoose');

const ArtworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Artwork title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Painting', 'Sketch', 'Digital', 'Mixed Media'],
        message: 'Category must be one of: Painting, Sketch, Digital, Mixed Media',
      },
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    cloudinaryPublicId: {
      type: String, // For deletion from Cloudinary
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: null, // null = not for sale / price on request
    },
    currency: {
      type: String,
      default: 'INR',
    },
    downloadable: {
      type: Boolean,
      default: false,
    },
    downloadUrl: {
      type: String,
      default: null,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// INDEXES for search/filter performance
// ============================================================
ArtworkSchema.index({ title: 'text', description: 'text', tags: 'text' });
ArtworkSchema.index({ category: 1 });
ArtworkSchema.index({ featured: 1 });
ArtworkSchema.index({ isPublished: 1 });
ArtworkSchema.index({ createdAt: -1 });

// ============================================================
// Virtual: formatted price string
// ============================================================
ArtworkSchema.virtual('priceFormatted').get(function () {
  if (!this.price) return 'Price on Request';
  return `${this.currency} ${this.price.toLocaleString('en-IN')}`;
});

module.exports = mongoose.model('Artwork', ArtworkSchema);
