/**
 * routes/admin.js
 */
const router = require('express').Router();
const {
  getDashboard, getAllUsers, toggleUserStatus,
  moderateReview, exportSubscribers,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/dashboard',                getDashboard);
router.get('/users',                    getAllUsers);
router.patch('/users/:id/toggle',       toggleUserStatus);
router.patch('/reviews/:id/moderate',   moderateReview);
router.get('/newsletter/export',        exportSubscribers);

module.exports = router;
