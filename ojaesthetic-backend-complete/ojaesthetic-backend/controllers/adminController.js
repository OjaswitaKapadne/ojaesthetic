/**
 * controllers/adminController.js
 * Admin-only dashboard data and management
 */

const User       = require('../models/User');
const Artwork    = require('../models/Artwork');
const Order      = require('../models/Order');
const Review     = require('../models/Review');
const Newsletter = require('../models/Newsletter');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// GET /api/admin/dashboard — summary stats
// ============================================================
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalArtworks,
      totalOrders,
      pendingOrders,
      completedOrders,
      pendingReviews,
      totalSubscribers,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Artwork.countDocuments({ isPublished: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Review.countDocuments({ isApproved: false }),
      Newsletter.countDocuments({ isActive: true }),
      Order.find().sort('-createdAt').limit(5)
        .populate('userId', 'name email').lean(),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalArtworks,
        totalOrders,
        pendingOrders,
        completedOrders,
        pendingReviews,
        totalSubscribers,
      },
      recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/admin/users — all users
// ============================================================
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments();

    const users = await User.find()
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.status(200).json({ success: true, total, users });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PATCH /api/admin/users/:id/toggle — activate/deactivate user
// ============================================================
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found.', 404));
    if (user.role === 'admin') return next(new AppError('Cannot deactivate an admin.', 403));

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}.`,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PATCH /api/admin/reviews/:id/approve — approve/highlight review
// ============================================================
exports.moderateReview = async (req, res, next) => {
  try {
    const { isApproved, isHighlighted } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved, isHighlighted },
      { new: true }
    ).populate('userId', 'name');

    if (!review) return next(new AppError('Review not found.', 404));
    res.status(200).json({ success: true, review });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/admin/newsletter/export — export subscriber emails
// ============================================================
exports.exportSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true })
      .select('email subscribedAt')
      .sort('-subscribedAt')
      .lean();

    // Return as CSV
    const csv = [
      'Email,Subscribed At',
      ...subscribers.map((s) => `${s.email},${s.subscribedAt.toISOString()}`),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ojaesthetic-subscribers.csv"');
    res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
};
