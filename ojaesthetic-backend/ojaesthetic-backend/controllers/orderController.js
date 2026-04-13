/**
 * controllers/orderController.js
 * Custom artwork order management
 */

const Order  = require('../models/Order');
const User   = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { uploadToCloudinary } = require('../middleware/upload');
const { sendEmail } = require('../utils/email');

// ============================================================
// POST /api/orders — create order (authenticated user)
// ============================================================
exports.createOrder = async (req, res, next) => {
  try {
    const { name, email, artworkType, message, budget } = req.body;

    // Upload reference images if provided
    const referenceImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer, 'order-references', {
          transformation: [{ width: 1200, quality: 'auto' }],
        });
        referenceImages.push(result.secure_url);
      }
    }

    const order = await Order.create({
      userId:   req.user._id,
      name,
      email:    email || req.user.email,
      artworkType,
      message,
      budget:   budget ? Number(budget) : null,
      referenceImages,
    });

    // Link order to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orders: order._id },
    });

    // Send confirmation email (non-blocking)
    sendEmail({
      to:      order.email,
      subject: '🦋 Your Ojaesthetic order is received!',
      html:    `
        <div style="font-family:Georgia,serif;color:#2F4F4F;max-width:520px;margin:auto">
          <h2 style="color:#3FA7A3">Thank you, ${order.name}! ✨</h2>
          <p>Your custom artwork request has been received. I'll review it and get back to you soon!</p>
          <div style="background:#EAF7F6;border-radius:12px;padding:1rem 1.5rem;margin:1.5rem 0">
            <strong>Artwork Type:</strong> ${order.artworkType}<br>
            <strong>Your Vision:</strong><br>
            <em>${order.message.substring(0, 200)}${order.message.length > 200 ? '…' : ''}</em>
          </div>
          <p style="opacity:.7;font-size:.88rem">Order ID: <code>${order._id}</code></p>
          <p>With love, <strong>Ojaesthetic 🌸</strong></p>
        </div>
      `,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Your dream artwork request has been sent! 🌸',
      order,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/orders/my — user's own orders
// ============================================================
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort('-createdAt')
      .lean();

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/orders/:id — single order (owner or admin)
// ============================================================
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) return next(new AppError('Order not found.', 404));

    const isOwner = order.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new AppError('Access denied.', 403));
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/orders — all orders (admin)
// ============================================================
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true, total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// PATCH /api/orders/:id/status — update status (admin)
// ============================================================
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, estimatedDelivery, finalArtworkUrl } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(new AppError('Order not found.', 404));

    order.status = status;
    if (adminNotes)        order.adminNotes        = adminNotes;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);
    if (finalArtworkUrl)   order.finalArtworkUrl   = finalArtworkUrl;

    await order.save();

    // Notify user of status change
    sendEmail({
      to:      order.email,
      subject: `Ojaesthetic Order Update — ${status.replace('_', ' ').toUpperCase()}`,
      html:    `
        <div style="font-family:Georgia,serif;color:#2F4F4F;max-width:520px;margin:auto">
          <h2 style="color:#3FA7A3">Order Status Update ✨</h2>
          <p>Hi ${order.name}, your order status has been updated to: <strong>${status}</strong></p>
          ${adminNotes ? `<p><em>${adminNotes}</em></p>` : ''}
          ${estimatedDelivery ? `<p>Estimated Delivery: ${new Date(estimatedDelivery).toDateString()}</p>` : ''}
          ${finalArtworkUrl && status === 'completed' ? `<p><a href="${finalArtworkUrl}" style="color:#3FA7A3">View Your Artwork →</a></p>` : ''}
          <p>With love, <strong>Ojaesthetic 🌸</strong></p>
        </div>
      `,
    }).catch(console.error);

    res.status(200).json({ success: true, message: 'Order status updated.', order });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// DELETE /api/orders/:id — (admin)
// ============================================================
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return next(new AppError('Order not found.', 404));
    res.status(200).json({ success: true, message: 'Order deleted.' });
  } catch (err) {
    next(err);
  }
};
