/**
 * controllers/authController.js
 * Signup, Login, Logout, Profile
 */

const User     = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

// ============================================================
// Helper — send token response
// ============================================================
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.generateAuthToken();
  const userObj = {
    _id:       user._id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    avatar:    user.avatar,
    favorites: user.favorites,
    createdAt: user.createdAt,
  };
  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: userObj,
  });
};

// ============================================================
// POST /api/auth/signup
// ============================================================
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('An account with this email already exists.', 400));
    }

    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to Ojaesthetic 🦋');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/login
// ============================================================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    sendTokenResponse(user, 200, res, 'Welcome back! 🌸');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/auth/me
// ============================================================
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title imageUrl category')
      .populate('orders', 'artworkType status createdAt');

    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PATCH /api/auth/update-profile
// ============================================================
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const allowedFields = {};
    if (name)   allowedFields.name   = name;
    if (avatar) allowedFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, allowedFields, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PATCH /api/auth/change-password
// ============================================================
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new AppError('Current password is incorrect.', 401));
    }

    user.password = newPassword;
    user.passwordChangedAt = Date.now();
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/auth/logout (client-side only — for logging)
// ============================================================
exports.logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. See you soon! 🌿',
  });
};
