/**
 * utils/email.js
 * Nodemailer email sender utility
 */

const nodemailer = require('nodemailer');

// ============================================================
// Create transporter
// ============================================================
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ============================================================
// Send email
// @param {object} options — { to, subject, html, text }
// ============================================================
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — skipping email send');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from:    process.env.EMAIL_FROM || 'Ojaesthetic <noreply@ojaesthetic.com>',
    to,
    subject,
    html,
    text:    text || html.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId} → ${to}`);
  return info;
};

module.exports = { sendEmail };
