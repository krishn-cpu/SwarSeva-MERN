/**
 * Custom API Error classes and global error handler
 */

/**
 * Base Error class for API errors
 * Extends the native Error object
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag operational errors vs programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Error - For auth-related errors
 */
class AuthError extends ApiError {
  constructor(message = 'Authentication error', statusCode = 401) {
    super(message, statusCode);
    this.name = 'AuthError';
  }
}

/**
 * Validation Error - For data validation errors
 */
class ValidationError extends ApiError {
  constructor(message = 'Validation error', errors = [], statusCode = 400) {
    super(message, statusCode);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Not Found Error - For resource not found errors
 */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', statusCode = 404) {
    super(message, statusCode);
    this.name = 'NotFoundError';
  }
}

/**
 * Forbidden Error - For permission-related errors
 */
class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden', statusCode = 403) {
    super(message, statusCode);
    this.name = 'ForbiddenError';
  }
}

/**
 * Handle MongoDB/Mongoose CastError (invalid ObjectId)
 * 
 * @param {Object} err - The error object
 * @returns {ApiError} Formatted API error
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ApiError(message, 400);
};

/**
 * Handle MongoDB/Mongoose duplicate key error
 * 
 * @param {Object} err - The error object
 * @returns {ApiError} Formatted API error
 */
const handleDuplicateKeyError = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new ApiError(message, 400);
};

/**
 * Handle Mongoose validation error
 * 
 * @param {Object} err - The error object
 * @returns {ValidationError} Formatted validation error
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => ({
    field: val.path,
    message: val.message
  }));
  
  return new ValidationError('Validation failed', errors);
};

/**
 * Handle JWT errors
 * 
 * @param {Object} err - The error object
 * @returns {AuthError} Formatted auth error
 */
const handleJwtError = (err) => {
  let message = 'Authentication error';
  let statusCode = 401;
  
  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired';
  } else if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
  }
  
  return new AuthError(message, statusCode);
};

/**
 * Format error response based on error type and environment
 * 
 * @param {Object} err - The error object
 * @param {Object} req - Express request object
 * @returns {Object} Formatted error response
 */
const formatError = (err, req) => {
  // Default error format
  const error = {
    success: false,
    message: err.message || 'Server Error',
    statusCode: err.statusCode || 500
  };
  
  // Add request ID if available (useful for logging)
  if (req.id) {
    error.requestId = req.id;
  }
  
  // Add validation errors if present
  if (err.name === 'ValidationError' && err.errors) {
    error.errors = err.errors;
    error.errorCount = err.errors.length;
  }
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    
    // Add more details in development
    if (err.code) error.code = err.code;
    if (err.path) error.path = err.path;
  }
  
  return error;
};

/**
 * Global error handler middleware
 * 
 * @param {Object} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;
  
  // Log error
  console.error('ERROR:', {
    message: error.message,
    statusCode: error.statusCode,
    stack: process.env.NODE_ENV === 'development' ? error.stack : 'Hidden in production',
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
    timestamp: new Date().toISOString()
  });
  
  // Handle Mongoose/MongoDB errors
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }
  
  if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }
  
  if (err.name === 'ValidationError' && err._message && err._message.includes('validation failed')) {
    error = handleValidationError(err);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJwtError(err);
  }
  
  // Format error response
  const formattedError = formatError(error, req);
  
  // Send response
  res.status(formattedError.statusCode).json(formattedError);
};

// Export error classes and handler
module.exports = {
  errorHandler,
  ApiError,
  AuthError,
  ValidationError,
  NotFoundError,
  ForbiddenError
};
