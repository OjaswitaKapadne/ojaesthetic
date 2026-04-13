/**
 * middleware/errorHandler.js
 * Centralized error handling for the entire API
 */

// ============================================================
// Custom API Error class
// ============================================================
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// Specific error handlers
// ============================================================
const handleCastErrorDB = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(
    `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use.`,
    400
  );
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Validation failed: ${errors.join('. ')}`, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your session has expired. Please log in again.', 401);

// ============================================================
// Development error response (verbose)
// ============================================================
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status:  err.status,
    message: err.message,
    stack:   err.stack,
    error:   err,
  });
};

// ============================================================
// Production error response (clean)
// ============================================================
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    // Don't leak internal details
    console.error('💥 Unexpected error:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};

// ============================================================
// Main error handler middleware
// ============================================================
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };
    if (err.name === 'CastError')           error = handleCastErrorDB(err);
    if (err.code === 11000)                 error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError')     error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError')   error = handleJWTError();
    if (err.name === 'TokenExpiredError')   error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }
};

// ============================================================
// 404 Not Found handler
// ============================================================
const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

module.exports = { errorHandler, notFound, AppError };
