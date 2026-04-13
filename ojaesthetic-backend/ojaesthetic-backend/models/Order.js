/**
 * models/Order.js
 * Custom artwork order schema
 */

const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    artworkType: {
      type: String,
      required: [true, 'Artwork type is required'],
      enum: {
        values: [
          'Texture Painting',
          'Canvas Portrait',
          'Pencil Sketch',
          'Digital Illustration',
          'Custom Aesthetic Artwork',
        ],
        message: 'Invalid artwork type',
      },
    },
    message: {
      type: String,
      required: [true, 'Order message/description is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    referenceImages: {
      type: [String], // Array of Cloudinary URLs
      default: [],
    },
    budget: {
      type: Number,
      min: [0, 'Budget cannot be negative'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'reviewing', 'accepted', 'in_progress', 'completed', 'cancelled'],
        message: 'Invalid status value',
      },
      default: 'pending',
    },
    adminNotes: {
      type: String,
      trim: true,
      default: '',
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    finalArtworkUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEXES
// ============================================================
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

// ============================================================
// Pre-save: set completedAt when status changes to completed
// ============================================================
OrderSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'completed') {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Order', OrderSchema);
