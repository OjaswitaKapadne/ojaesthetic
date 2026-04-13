/**
 * models/Newsletter.js
 * Email subscription schema
 */

const mongoose = require('mongoose');

const NewsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      default: 'website_footer',
    },
  },
  {
    timestamps: true,
  }
);

NewsletterSchema.index({ email: 1 });
NewsletterSchema.index({ isActive: 1 });

module.exports = mongoose.model('Newsletter', NewsletterSchema);
