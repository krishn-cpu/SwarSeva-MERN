/**
 * SwarSeva Middleware Index
 * Central export point for all middleware components
 */

// Import middleware modules
const auth = require('./auth');
const role = require('./role');
const { errorHandler, ApiError, AuthError, ValidationError, NotFoundError, ForbiddenError } = require('./error');

/**
 * Authentication Middleware
 */
const authentication = {
  // Core authentication middleware
  protect: auth.protect,
  optionalAuth: auth.optionalAuth,
  refreshToken: auth.refreshToken,
  checkActiveSession: auth.checkActiveSession,
  
  // Rate limiters
  authRateLimiter: auth.authRateLimiter,
  registerRateLimiter: auth.registerRateLimiter,
  passwordResetLimiter: auth.passwordResetLimiter,
  
  // Token utilities
  blacklistToken: auth.blacklistToken,
  isTokenBlacklisted: auth.isTokenBlacklisted,
  createToken: auth.createToken,
  sendTokenCookie: auth.sendTokenCookie,
  clearAuthCookie: auth.clearAuthCookie,
  validateTokenExpiry: auth.validateTokenExpiry,
  
  // Session management
  clearUserSessions: auth.clearUserSessions,
  handleMultipleDeviceSessions: auth.handleMultipleDeviceSessions
};

/**
 * Authorization Middleware
 */
const authorization = {
  // Role-based middleware
  hasRole: role.hasRole,
  hasAnyRole: role.hasAnyRole,
  hasMinimumRoleLevel: role.hasMinimumRoleLevel,
  adminOnly: role.adminOnly,
  superAdminOnly: role.superAdminOnly,
  ownerOrAdmin: role.ownerOrAdmin,
  
  // Role utilities
  getRoleLevel: role.getRoleLevel,
  hasHigherOrEqualRole: role.hasHigherOrEqualRole,
  
  // User-specific access
  checkUserOwnership: auth.checkUserOwnership
};

/**
 * Error Handling Middleware
 */
const errors = {
  handler: errorHandler,
  
  // Error classes
  ApiError,
  AuthError,
  ValidationError,
  NotFoundError,
  ForbiddenError
};

/**
 * Check if the current user has the required permissions
 * Utility function to check permissions from within controllers
 * 
 * @param {Object} user - User object (typically req.user)
 * @param {String|Array} requiredRoles - Required role(s)
 * @param {Object} options - Additional options
 * @returns {Boolean} - True if user has required permissions
 */
const checkPermissions = (user, requiredRoles, options = {}) => {
  // If no user, no permissions
  if (!user) return false;
  
  // Convert to array if single role provided
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  // If user is admin or superAdmin, they have all permissions
  if (user.role === 'admin' || user.role === 'superAdmin') {
    return true;
  }
  
  // Check if user's role is in the required roles
  return roles.includes(user.role);
};

/**
 * Apply a combination of middleware in a specific order
 * Useful for routes with common middleware requirements
 * 
 * @param {Object} options - Options specifying which middleware to include
 * @returns {Array} - Array of middleware functions
 */
const applyMiddleware = (options = {}) => {
  const middlewareStack = [];
  
  // Add rate limiters if specified
  if (options.rateLimit === 'auth') {
    middlewareStack.push(authentication.authRateLimiter);
  } else if (options.rateLimit === 'register') {
    middlewareStack.push(authentication.registerRateLimiter);
  } else if (options.rateLimit === 'passwordReset') {
    middlewareStack.push(authentication.passwordResetLimiter);
  }
  
  // Add authentication if specified
  if (options.auth === true) {
    middlewareStack.push(authentication.protect);
  } else if (options.auth === 'optional') {
    middlewareStack.push(authentication.optionalAuth);
  }
  
  // Add token refresh if specified
  if (options.refreshToken) {
    middlewareStack.push(authentication.refreshToken);
  }
  
  // Add role-based authorization if specified
  if (options.role) {
    if (options.role === 'admin') {
      middlewareStack.push(authorization.adminOnly);
    } else if (options.role === 'superAdmin') {
      middlewareStack.push(authorization.superAdminOnly);
    } else if (Array.isArray(options.role)) {
      middlewareStack.push(authorization.hasAnyRole(options.role));
    } else {
      middlewareStack.push(authorization.hasRole(options.role));
    }
  }
  
  // Add user ownership check if specified
  if (options.ownerOnly) {
    middlewareStack.push(authorization.checkUserOwnership);
  } else if (options.ownerOrAdmin) {
    // We'll need to pass a function that determines the owner ID
    middlewareStack.push(authorization.ownerOrAdmin(options.getOwnerId));
  }
  
  return middlewareStack;
};

/**
 * Usage Examples
 * 
 * Example 1: Protected route with role authorization
 * router.get('/admin/dashboard', 
 *   applyMiddleware({ auth: true, role: 'admin' }),
 *   adminController.getDashboard
 * );
 * 
 * Example 2: User profile with owner check
 * router.put('/users/:id',
 *   applyMiddleware({ auth: true, ownerOnly: true }),
 *   userController.updateProfile
 * );
 * 
 * Example 3: Login route with rate limiting
 * router.post('/auth/login',
 *   applyMiddleware({ rateLimit: 'auth' }),
 *   authController.login
 * );
 * 
 * Example 4: Public route with optional auth
 * router.get('/services',
 *   applyMiddleware({ auth: 'optional', refreshToken: true }),
 *   serviceController.getAllServices
 * );
 */

module.exports = {
  authentication,
  authorization,
  errors,
  checkPermissions,
  applyMiddleware
};
