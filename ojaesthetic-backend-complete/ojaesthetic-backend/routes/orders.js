/**
 * routes/orders.js
 */

const router = require('express').Router();
const {
  createOrder, getMyOrders, getOrder,
  getAllOrders, updateOrderStatus, deleteOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { orderRules, statusRules, validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

// Authenticated users
router.post('/',
  protect,
  upload.array('referenceImages', 5),
  orderRules, validate,
  createOrder
);
router.get('/my',    protect, getMyOrders);
router.get('/:id',   protect, getOrder);

// Admin only
router.get('/',             protect, authorize('admin'), getAllOrders);
router.patch('/:id/status', protect, authorize('admin'), statusRules, validate, updateOrderStatus);
router.delete('/:id',       protect, authorize('admin'), deleteOrder);

module.exports = router;
