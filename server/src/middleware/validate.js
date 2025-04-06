const { validationResult } = require('express-validator');

/**
 * Middleware to validate request using express-validator
 * Checks for validation errors and returns formatted response
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} Returns error response if validation fails, otherwise calls next()
 */
exports.validateRequest = (req, res, next) => {
  // Get validation errors from express-validator
  const errors = validationResult(req);
  
  // If no errors, continue to next middleware
  if (errors.isEmpty()) {
    return next();
  }
  
  // Format validation errors for better readability
  const formattedErrors = formatValidationErrors(errors.array());
  
  // Return standardized error response
  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
    errorCount: formattedErrors.length
  });
};

/**
 * Format validation errors into a consistent structure
 * 
 * @param {Array} errors - Array of validation errors from express-validator
 * @returns {Array} Formatted array of error objects
 */
const formatValidationErrors = (errors) => {
  return errors.map(error => {
    // Format the error based on its type
    const formattedError = {
      param: error.param,
      location: error.location || 'body',
      message: error.msg
    };
    
    // Add value if in development mode (for debugging)
    if (process.env.NODE_ENV === 'development') {
      formattedError.value = error.value;
    }
    
    // Handle nested parameter errors (e.g., user.name)
    if (error.param.includes('.')) {
      const paramParts = error.param.split('.');
      formattedError.object = paramParts[0];
      formattedError.field = paramParts.slice(1).join('.');
    }
    
    return formattedError;
  });
};

/**
 * Custom validator for checking if a field exists when another field has a certain value
 * 
 * @param {string} field - The field that should exist
 * @param {string} dependentField - The field this depends on
 * @param {any} dependentValue - The value that triggers this validation
 * @returns {Function} Validation function for express-validator
 */
exports.existsIf = (field, dependentField, dependentValue) => {
  return (value, { req }) => {
    if (req.body[dependentField] === dependentValue && (req.body[field] === undefined || req.body[field] === null)) {
      throw new Error(`${field} is required when ${dependentField} is ${dependentValue}`);
    }
    return true;
  };
};

/**
 * Custom validator for checking if a value is unique in a database
 * 
 * @param {Object} model - Mongoose model to check against
 * @param {string} field - Database field to check
 * @param {string} message - Error message to return
 * @param {Function} customQuery - Optional function to customize the query (e.g., to exclude current user)
 * @returns {Function} Validation function for express-validator
 */
exports.isUnique = (model, field, message, customQuery = null) => {
  return async (value, { req }) => {
    let query = { [field]: value };
    
    // Apply custom query function if provided
    if (customQuery) {
      query = customQuery(query, req);
    }
    
    const exists = await model.findOne(query);
    
    if (exists) {
      throw new Error(message || `${field} already exists`);
    }
    
    return true;
  };
};

/**
 * Custom validator for checking if array has minimum number of items
 * 
 * @param {number} min - Minimum number of items required
 * @param {string} message - Custom error message
 * @returns {Function} Validation function for express-validator
 */
exports.arrayMinLength = (min, message) => {
  return (value) => {
    if (!Array.isArray(value) || value.length < min) {
      throw new Error(message || `Array must contain at least ${min} items`);
    }
    return true;
  };
};

/**
 * Custom validator for checking if all items in array match a pattern
 * 
 * @param {RegExp} pattern - Regular expression pattern to match
 * @param {string} message - Custom error message
 * @returns {Function} Validation function for express-validator
 */
exports.arrayItemsMatch = (pattern, message) => {
  return (value) => {
    if (!Array.isArray(value)) {
      throw new Error('Value must be an array');
    }
    
    const invalidItems = value.filter(item => !pattern.test(item));
    
    if (invalidItems.length > 0) {
      throw new Error(message || `Some items do not match the required pattern`);
    }
    
    return true;
  };
};
