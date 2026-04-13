/**
 * routes/reviews.js
 */
const router = require('express').Router();
const {
  submitReview, getApprovedReviews, getAllReviews, approveReview, deleteReview,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { reviewRules, validate } = require('../middleware/validate');

router.get('/',       getApprovedReviews);
router.post('/',      protect, reviewRules, validate, submitReview);
router.get('/all',    protect, authorize('admin'), getAllReviews);
router.patch('/:id',  protect, authorize('admin'), approveReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
