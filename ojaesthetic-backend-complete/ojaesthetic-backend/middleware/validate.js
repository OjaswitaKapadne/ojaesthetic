/**
 * middleware/validate.js
 * express-validator rules for each route
 */

const { body, param, query, validationResult } = require('express-validator');

// ============================================================
// Run validation & return errors
// ============================================================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);
    return res.status(400).json({
      success: false,
      message: messages[0],
      errors:  messages,
    });
  }
  next();
};

// ============================================================
// AUTH validators
// ============================================================
const signupRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 60 }).withMessage('Name cannot exceed 60 characters'),
  body('email')
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number'),
];

const loginRules = [
  body('email')
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ============================================================
// ORDER validators
// ============================================================
const orderRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Your name is required'),
  body('email')
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email'),
  body('artworkType')
    .notEmpty().withMessage('Artwork type is required')
    .isIn([
      'Texture Painting',
      'Canvas Portrait',
      'Pencil Sketch',
      'Digital Illustration',
      'Custom Aesthetic Artwork',
    ]).withMessage('Invalid artwork type'),
  body('message')
    .trim()
    .notEmpty().withMessage('Please describe your dream artwork')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Message must be between 20 and 2000 characters'),
  body('budget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
];

// ============================================================
// REVIEW validators
// ============================================================
const reviewRules = [
  body('text')
    .trim()
    .notEmpty().withMessage('Review text is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Review must be between 10 and 500 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

// ============================================================
// ARTWORK validators
// ============================================================
const artworkRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 120 }).withMessage('Title cannot exceed 120 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['Painting', 'Sketch', 'Digital', 'Mixed Media'])
    .withMessage('Invalid category'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('downloadable')
    .optional()
    .isBoolean().withMessage('downloadable must be true or false'),
];

// ============================================================
// NEWSLETTER validator
// ============================================================
const newsletterRules = [
  body('email')
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email'),
];

// ============================================================
// STATUS UPDATE validator (admin)
// ============================================================
const statusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'reviewing', 'accepted', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),
];

module.exports = {
  validate,
  signupRules,
  loginRules,
  orderRules,
  reviewRules,
  artworkRules,
  newsletterRules,
  statusRules,
};
