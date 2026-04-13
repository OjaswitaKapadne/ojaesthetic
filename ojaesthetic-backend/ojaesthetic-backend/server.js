/**
 * OJAESTHETIC BACKEND — server.js
 * Entry point for the Express application
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes        = require('./routes/auth');
const artworkRoutes     = require('./routes/artworks');
const orderRoutes       = require('./routes/orders');
const reviewRoutes      = require('./routes/reviews');
const favoritesRoutes   = require('./routes/favorites');
const newsletterRoutes  = require('./routes/newsletter');
const uploadRoutes      = require('./routes/upload');
const adminRoutes       = require('./routes/admin');

// Import error handler
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Set secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — allow frontend origin
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5500',   // Live Server
    'http://127.0.0.1:5500',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Sanitize MongoDB queries (prevent NoSQL injection)
app.use(mongoSanitize());

// Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// Auth-specific rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

// ============================================================
// BODY PARSING
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// LOGGING (dev only)
// ============================================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '🦋 Ojaesthetic API is alive',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/artworks',   artworkRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/favorites',  favoritesRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/admin',      adminRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFound);
app.use(errorHandler);

// ============================================================
// DATABASE + SERVER START
// ============================================================
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🦋 Ojaesthetic server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
  process.exit(1);
});

module.exports = app;
