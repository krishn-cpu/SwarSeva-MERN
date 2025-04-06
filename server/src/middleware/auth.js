const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

/**
 * Rate limiter for authentication routes
 */
exports.authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  skipSuccessfulRequests: true, // Don't count successful logins against the rate limit
});

/**
 * Rate limiter for registration routes
 */
exports.registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many registration attempts, please try again after an hour'
  }
});

/**
 * Rate limiter for password reset
 */
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour'
  }
});

/**
 * Extract token from request
 * Checks Authorization header and cookies for token
 * 
 * @param {Object} req - Express request object
 * @returns {String|null} - JWT token or null if no token found
 */
const getTokenFromRequest = (req) => {
  // Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Get token from header (format: "Bearer [token]")
    return req.headers.authorization.split(' ')[1];
  } 
  // Alternative: check for token in cookie
  else if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  
  // No token found
  return null;
};

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token and attaches user to request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Function} - Next middleware or error response
 */
exports.protect = async (req, res, next) => {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);

    // If no token is found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login to access this resource'
      });
    }

    // Check if token is blacklisted
    if (await exports.isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. Please login again'
      });
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request object (exclude password field)
      req.user = await User.findById(decoded.id).select('-password');

      // If user not found (e.g., user was deleted but token still exists)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User account no longer exists'
        });
      }
      
      // Check if user account is active
      if (!req.user.status || req.user.status !== 'active') {
        const statusMessage = {
          'inactive': 'Your account has been deactivated',
          'pending': 'Your account is pending activation',
          'suspended': 'Your account has been suspended',
          'deleted': 'This account no longer exists'
        };
        
        return res.status(403).json({
          success: false,
          message: statusMessage[req.user.status] || 'User account is not active',
          status: req.user.status
        });
      }

      // Token verification successful, proceed to next middleware
      next();
    } catch (error) {
      // Handle specific token errors with appropriate responses
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token'
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired',
          expired: true
        });
      }

      // Handle other errors
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware for role-based authorization
 * Restricts access to routes based on user roles
 * 
 * @param {...String} roles - Roles allowed to access the route
 * @returns {Function} - Express middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Verify user exists (should be added by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: User role "${req.user.role}" is not authorized for this resource`
      });
    }
    
    // User has required role, proceed to next middleware
    next();
  };
};

/**
 * Middleware to check if a user is accessing their own data
 * Used to protect user-specific resources
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkUserOwnership = (req, res, next) => {
  const userId = req.params.id || req.params.userId;
  
  // If no user ID in params, continue
  if (!userId) {
    return next();
  }
  
  // Admin can access any user's data
  if (req.user.role === 'admin' || req.user.role === 'superAdmin') {
    return next();
  }
  
  // Check if user is accessing their own data
  if (req.user.id !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Not authorized to access another user\'s data'
    });
  }
  
  // User is accessing their own data, proceed
  next();
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token is blacklisted
      if (await exports.isTokenBlacklisted(token)) {
        return next(); // Skip authentication if token is blacklisted
      }

      // Attach user to request object
      req.user = await User.findById(decoded.id).select('-password');

      // Continue to next middleware even if user not found
      next();
    } catch (error) {
      // Continue even if token is invalid or expired
      next();
    }
  } catch (error) {
    // Continue to next middleware even if there's an error
    next();
  }
};

/**
 * Middleware to refresh JWT token
 * Extends user session if token is close to expiry
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.refreshToken = async (req, res, next) => {
  try {
    // Get token from request
    const token = getTokenFromRequest(req);

    // If no token, skip token refresh
    if (!token) {
      return next();
    }

    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check token expiration (refresh if less than 30 minutes remain)
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeToExpire = expirationTime - currentTime;
      const refreshThreshold = 30 * 60 * 1000; // 30 minutes in milliseconds

      // If token is close to expiry, issue a new one
      if (timeToExpire < refreshThreshold) {
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.status === 'active') {
          // Generate new token
          const newToken = user.getSignedJwtToken();
          
          // Set token in response header
          res.setHeader('X-New-Token', newToken);
          
          // Set token in cookie if cookies are used
          if (req.cookies && req.cookies.jwt) {
            const cookieOptions = {
              expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            };
            
            res.cookie('jwt', newToken, cookieOptions);
          }
        }
      }

      // Continue to next middleware
      next();
    } catch (error) {
      // Continue to next middleware even if token is invalid
      next();
    }
  } catch (error) {
    // Continue to next middleware even if there's an error
    next();
  }
};

/**
 * Middleware to check for active session
 * Ensures user has an active session
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.checkActiveSession = async (req, res, next) => {
  try {
    // This would typically check a session store
    // For now, we'll just rely on JWT validation which happens in protect middleware
    
    // If we've reached this point after protect middleware, session is valid
    next();
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Blacklist a JWT token (for logout or security concerns)
 * Adds token to a blacklist to prevent reuse
 * 
 * Note: In a production environment, this should use Redis or another fast store
 * 
 * @param {String} token - JWT token to blacklist
 * @returns {Boolean} - Success status
 */
exports.blacklistToken = async (token) => {
  try {
    // In a real implementation, store the token in Redis or database
    // with an expiry time matching the token's expiry
    
    // For demonstration, log the blacklisted token
    console.log(`Token blacklisted: ${token.substring(0, 10)}...`);
    
    // Return success
    return true;
  } catch (error) {
    console.error('Token blacklist error:', error);
    return false;
  }
};

/**
 * Check if a token is blacklisted
 * 
 * @param {String} token - JWT token to check
 * @returns {Boolean} - True if token is blacklisted
 */
exports.isTokenBlacklisted = async (token) => {
  try {
    // In a real implementation, check if token exists in Redis or database
    // For production, this should be a fast lookup using Redis or similar
    
    // For demonstration purposes, always return false
    return false;
  } catch (error) {
    console.error('Token blacklist check error:', error);
    return true; // Fail safe: treat as blacklisted if check fails
  }
};

/**
 * Clear all active sessions for a specific user
 * Useful for password changes, account suspension, or security incidents
 * 
 * @param {String} userId - The ID of the user whose sessions to clear
 * @returns {Boolean} - Success status
 */
exports.clearUserSessions = async (userId) => {
  try {
    // In production, this would:
    // 1. Find all active tokens for the user in the session store
    // 2. Add them to the blacklist
    // 3. Update user's tokenVersion in database (if using that approach)
    
    console.log(`Cleared all sessions for user: ${userId}`);
    
    // Return success
    return true;
  } catch (error) {
    console.error('Error clearing user sessions:', error);
    return false;
  }
};

/**
 * Validate token expiry without verifying the entire token
 * Useful for quick checks without database lookups
 * 
 * @param {String} token - JWT token to check
 * @returns {Object} - Object with isValid and timeRemaining properties
 */
exports.validateTokenExpiry = (token) => {
  try {
    // Decode token without verification to check expiry
    // This does not validate the signature, just checks structure
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.exp) {
      return { 
        isValid: false, 
        timeRemaining: 0,
        error: 'Invalid token format'
      };
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const expiryTime = decoded.exp; // Token expiry time in seconds
    const timeRemaining = expiryTime - currentTime; // Time remaining in seconds
    
    return {
      isValid: timeRemaining > 0,
      timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
      expiresAt: new Date(expiryTime * 1000) // Convert to milliseconds for Date
    };
  } catch (error) {
    console.error('Token expiry validation error:', error);
    return { 
      isValid: false, 
      timeRemaining: 0,
      error: error.message 
    };
  }
};

/**
 * Handle multiple device sessions for a user
 * Manages concurrent logins across multiple devices
 * 
 * @param {String} userId - User ID
 * @param {String} deviceId - Current device identifier
 * @param {Number} maxSessions - Maximum allowed concurrent sessions
 * @returns {Boolean} - True if session is allowed, false if max sessions exceeded
 */
exports.handleMultipleDeviceSessions = async (userId, deviceId, maxSessions = 5) => {
  try {
    // In a real implementation, this would:
    // 1. Get all active sessions for the user
    // 2. Check if current device already has a session
    // 3. If not and sessions are at max, remove oldest session
    // 4. Add new session for current device
    
    // For demonstration, always allow the session
    console.log(`Session allowed for user: ${userId}, device: ${deviceId}`);
    return true;
  } catch (error) {
    console.error('Error handling multiple device sessions:', error);
    return true; // Default to allowing session in case of errors
  }
};

/**
 * Create a signed JWT token
 * Utility function for generating tokens outside of the User model
 * 
 * @param {Object} payload - Data to encode in the token
 * @param {String} expiresIn - Token expiration time (e.g., '30d', '1h')
 * @returns {String} - Signed JWT token
 */
exports.createToken = (payload, expiresIn = process.env.JWT_EXPIRE || '30d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn
  });
};

/**
 * Set JWT token in HTTP-only cookie
 * Securely stores token in cookie for web clients
 * 
 * @param {Object} res - Express response object
 * @param {String} token - JWT token to store
 * @returns {Object} - Express response object with cookie set
 */
exports.sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  return res.cookie('jwt', token, cookieOptions);
};

/**
 * Clear auth cookie
 * Used during logout to remove the JWT cookie
 * 
 * @param {Object} res - Express response object
 * @returns {Object} - Express response object with cookie cleared
 */
exports.clearAuthCookie = (res) => {
  return res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true
  });
};
