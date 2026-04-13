/**
 * controllers/newsletterController.js
 * Email subscription management
 */

const Newsletter = require('../models/Newsletter');
const { AppError } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/email');

// ============================================================
// POST /api/newsletter/subscribe
// ============================================================
exports.subscribe = async (req, res, next) => {
  try {
    const { email, source } = req.body;

    // Check for existing subscription
    const existing = await Newsletter.findOne({ email });

    if (existing && existing.isActive) {
      return res.status(200).json({
        success: true,
        message: 'You are already subscribed to the aesthetic journey! 🌸',
      });
    }

    if (existing && !existing.isActive) {
      // Re-subscribe
      existing.isActive = true;
      existing.unsubscribedAt = null;
      existing.subscribedAt = new Date();
      await existing.save();
    } else {
      await Newsletter.create({ email, source: source || 'website_footer' });
    }

    // Send welcome email (non-blocking)
    sendEmail({
      to:      email,
      subject: '🦋 Welcome to the Ojaesthetic Journey!',
      html:    `
        <div style="font-family:Georgia,serif;color:#2F4F4F;max-width:520px;margin:auto;padding:2rem">
          <h2 style="color:#3FA7A3;font-size:2rem;margin-bottom:.5rem">Ojaesthetic</h2>
          <p style="opacity:.7;font-style:italic;margin-bottom:1.5rem">Where colors speak and art feels alive.</p>
          <p>Thank you for joining the aesthetic journey ✨</p>
          <p>You'll receive:</p>
          <ul style="color:#3FA7A3;line-height:2">
            <li>New artwork reveals</li>
            <li>Behind-the-scenes process stories</li>
            <li>Exclusive commission offers</li>
            <li>Quiet creative musings</li>
          </ul>
          <p style="margin-top:1.5rem">With love, <strong>Oja 🌸</strong></p>
          <hr style="border:none;border-top:1px solid #B8E1DD;margin:2rem 0">
          <p style="font-size:.75rem;opacity:.5">
            To unsubscribe, reply with "unsubscribe" or click 
            <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${email}" style="color:#6EC6C3">here</a>.
          </p>
        </div>
      `,
    }).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'You have joined the aesthetic journey! Welcome 🌿',
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// POST /api/newsletter/unsubscribe
// ============================================================
exports.unsubscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    const sub = await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false, unsubscribedAt: new Date() },
      { new: true }
    );
    if (!sub) return next(new AppError('Email not found in our list.', 404));

    res.status(200).json({ success: true, message: 'Successfully unsubscribed.' });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// GET /api/newsletter/subscribers — admin only
// ============================================================
exports.getAllSubscribers = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = {};
    if (active !== undefined) filter.isActive = active === 'true';

    const subscribers = await Newsletter.find(filter).sort('-subscribedAt').lean();
    res.status(200).json({ success: true, count: subscribers.length, subscribers });
  } catch (err) {
    next(err);
  }
};
