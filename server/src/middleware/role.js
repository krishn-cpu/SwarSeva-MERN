/**
 * Role-based authorization middleware for SwarSeva
 * Provides role verification and access control for routes
 */

// Define role hierarchy and permissions
// Higher number means higher privileges
const ROLE_HIERARCHY = {
  user: 1,
  serviceProvider: 2,
  moderator: 3,
  admin: 4,
  superAdmin: 5
};

/**
 * Check if a user has admin role
 * Used to protect admin-only routes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Function} Next middleware or error response
 */
exports.adminOnly = (req, res, next) => {
  // Verify user exists (should be added by auth middleware)
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin permission required'
    });
  }

  // User is admin, proceed to next middleware
  next();
};

/**
 * Check if a user has a specific role
 * 
 * @param {String} role - Required role for access
 * @returns {Function} Express middleware function
 */
exports.hasRole = (role) => {
  return (req, res, next) => {
    // Verify user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user's role level
    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[role] || 999; // Default to high number if role not found

    // Check if user's role level is sufficient
    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${capitalizeFirstLetter(role)} permission required`
      });
    }

    // User has sufficient permissions, proceed
    next();
  };
};

/**
 * Check if a user has any of the specified roles
 * 
 * @param {Array} roles - Array of roles, any of which grants access
 * @returns {Function} Express middleware function
 */
exports.hasAnyRole = (roles) => {
  return (req, res, next) => {
    // Verify user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user's role level
    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;

    // Check if user's role matches any of the required roles
    const hasPermission = roles.some(role => {
      const requiredRoleLevel = ROLE_HIERARCHY[role] || 999;
      return userRoleLevel >= requiredRoleLevel;
    });

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied: You need one of these roles: ${roles.join(', ')}`
      });
    }

    // User has one of the required roles, proceed
    next();
  };
};

/**
 * Check if a user has at least the minimum role level
 * 
 * @param {Number} minLevel - Minimum hierarchy level required
 * @returns {Function} Express middleware function
 */
exports.hasMinimumRoleLevel = (minLevel) => {
  return (req, res, next) => {
    // Verify user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user's role level
    const userRoleLevel = ROLE_HIERARCHY[req.user.role] || 0;

    // Check if user's role level is sufficient
    if (userRoleLevel < minLevel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }

    // User has sufficient permissions, proceed
    next();
  };
};

/**
 * Super admin only middleware - restricts access to super admins
 * Used for highly sensitive operations
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Function} Next middleware or error response
 */
exports.superAdminOnly = (req, res, next) => {
  // Verify user exists
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user has super admin role
  if (req.user.role !== 'superAdmin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin permission required'
    });
  }

  // User is super admin, proceed
  next();
};

/**
 * Owner or admin middleware - allows access to resource owner or admins
 * Useful for letting users edit their own resources while admins can edit all
 * 
 * @param {Function} getResourceOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware function
 */
exports.ownerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
    // Verify user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // If user is admin or super admin, allow access
    if (req.user.role === 'admin' || req.user.role === 'superAdmin') {
      return next();
    }

    try {
      // Get the owner ID of the resource
      const ownerId = await getResourceOwnerId(req);

      // Check if user is the owner
      if (ownerId && ownerId.toString() === req.user.id.toString()) {
        return next();
      }

      // User is not owner or admin
      return res.status(403).json({
        success: false,
        message: 'Access denied: You must be the owner or an admin'
      });
    } catch (error) {
      console.error('Error in ownerOrAdmin middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

/**
 * Helper function to capitalize the first letter of a string
 * Used for formatting role names in error messages
 * 
 * @param {String} string - Input string
 * @returns {String} String with first letter capitalized
 */
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Get the role level for a specific role
 * Used for programmatic role level comparison
 * 
 * @param {String} role - Role to check
 * @returns {Number} Numeric role level from hierarchy
 */
exports.getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

/**
 * Check if role1 has higher or equal privileges than role2
 * 
 * @param {String} role1 - First role to compare
 * @param {String} role2 - Second role to compare against
 * @returns {Boolean} True if role1 has higher or equal privileges
 */
exports.hasHigherOrEqualRole = (role1, role2) => {
  const role1Level = ROLE_HIERARCHY[role1] || 0;
  const role2Level = ROLE_HIERARCHY[role2] || 0;
  return role1Level >= role2Level;
};
