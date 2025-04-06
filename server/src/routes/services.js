const express = require('express');
const router = express.Router();
const { check, body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Import controllers
const servicesController = require('../controllers/services');

// Import middleware
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/role');
const { validateRequest } = require('../middleware/validate');

// Rate limiter for public routes
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// More restrictive rate limiter for search and computation-heavy routes
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many search requests from this IP, please try again after 5 minutes',
  standardHeaders: true,
  legacyHeaders: false
});

// Validation for service creation
const validateServiceCreate = [
  body('name.en', 'English name is required').notEmpty().isString(),
  body('shortName', 'Short name is required').notEmpty().isString()
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Short name can only contain letters, numbers, dashes and underscores'),
  body('description.en', 'English description is required').notEmpty().isString(),
  body('category', 'Valid category is required').isIn([
    'health', 'education', 'employment', 'finance', 'welfare', 
    'agriculture', 'housing', 'legal', 'transport', 'utilities', 
    'business', 'certificates', 'pension', 'taxes', 'other'
  ]),
  body('department.name.en', 'Department name is required').notEmpty().isString(),
  body('status', 'Status must be valid').optional().isIn(['draft', 'active', 'inactive', 'deprecated']),
  body('requirements.*.documentType', 'Valid document type is required').optional().isString(),
  body('requirements.*.name.en', 'Document name in English is required').optional().isString(),
  body('requirements.*.isMandatory', 'isMandatory must be boolean').optional().isBoolean(),
  body('fees.*.amount', 'Fee amount must be a number').optional().isNumeric(),
  body('fees.*.feeType', 'Fee type is required').optional().isString(),
  body('fees.*.name.en', 'Fee name in English is required').optional().isString()
];

// Validation for service update
const validateServiceUpdate = [
  body('name.en', 'English name must be a string').optional().isString(),
  body('description.en', 'English description must be a string').optional().isString(),
  body('category', 'Valid category is required').optional().isIn([
    'health', 'education', 'employment', 'finance', 'welfare', 
    'agriculture', 'housing', 'legal', 'transport', 'utilities', 
    'business', 'certificates', 'pension', 'taxes', 'other'
  ]),
  body('status', 'Status must be valid').optional().isIn(['draft', 'active', 'inactive', 'deprecated']),
  body('department.name.en', 'Department name must be a string').optional().isString()
];

// Language param validation
const validateLanguage = [
  query('language', 'Language must be a valid ISO code').optional()
    .isIn(['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'])
];

// ===============================================================
// Public Routes
// ===============================================================

// @route   GET /api/services
// @desc    Get all services with pagination
// @access  Public
router.get(
  '/', 
  publicLimiter,
  validateLanguage,
  validateRequest,
  servicesController.listServices
);

// @route   GET /api/services/search
// @desc    Search services with filters
// @access  Public
router.get(
  '/search', 
  searchLimiter,
  [
    ...validateLanguage,
    query('q', 'Search query must be a string').optional().isString(),
    query('category', 'Category must be valid').optional().isString(),
    query('provider', 'Provider must be valid').optional().isIn(['central', 'state', 'local', 'private']),
    query('state', 'State must be a string').optional().isString(),
    query('page', 'Page must be a number').optional().isInt({ min: 1 }),
    query('limit', 'Limit must be a number').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  servicesController.searchServices
);

// @route   GET /api/services/category/:category
// @desc    Get services by category
// @access  Public
router.get(
  '/category/:category', 
  publicLimiter,
  [
    param('category', 'Category is required').isIn([
      'health', 'education', 'employment', 'finance', 'welfare', 
      'agriculture', 'housing', 'legal', 'transport', 'utilities', 
      'business', 'certificates', 'pension', 'taxes', 'other'
    ]),
    ...validateLanguage
  ],
  validateRequest,
  servicesController.getServicesByCategory
);

// @route   GET /api/services/:id
// @desc    Get single service
// @access  Public
router.get(
  '/:id', 
  publicLimiter,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    ...validateLanguage
  ],
  validateRequest,
  servicesController.getService
);

// @route   GET /api/services/:id/voice
// @desc    Get voice commands for a service
// @access  Public
router.get(
  '/:id/voice', 
  publicLimiter,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    ...validateLanguage
  ],
  validateRequest,
  servicesController.getVoiceCommands
);

// ===============================================================
// Protected Routes (User Authentication Required)
// ===============================================================

// @route   POST /api/services/:id/check-eligibility
// @desc    Check user eligibility for a service
// @access  Private
router.post(
  '/:id/check-eligibility', 
  protect,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    body('dateOfBirth', 'Date of birth must be a valid date').optional().isISO8601(),
    body('income', 'Income must be a number').optional().isNumeric(),
    body('gender', 'Gender must be valid').optional().isIn(['male', 'female', 'other']),
    body('maritalStatus', 'Marital status must be valid').optional().isString(),
    body('category', 'Category must be valid').optional().isString(),
    body('address.state', 'State must be a string').optional().isString()
  ],
  validateRequest,
  servicesController.checkEligibility
);

// @route   POST /api/services/:id/calculate-fees
// @desc    Calculate fees for a service
// @access  Private
router.post(
  '/:id/calculate-fees', 
  protect,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    body('income', 'Income must be a number if provided').optional().isNumeric(),
    body('age', 'Age must be a number if provided').optional().isInt({ min: 0, max: 150 }),
    body('hasDisability', 'hasDisability must be a boolean').optional().isBoolean(),
    body('isStudent', 'isStudent must be a boolean').optional().isBoolean(),
    body('isBPL', 'isBPL must be a boolean').optional().isBoolean(),
    body('gender', 'Gender must be valid').optional().isIn(['male', 'female', 'other'])
  ],
  validateRequest,
  servicesController.calculateFees
);

// @route   POST /api/services/:id/validate-documents
// @desc    Validate documents for a service
// @access  Private
router.post(
  '/:id/validate-documents', 
  protect,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    body('documents', 'Documents must be an array').isArray(),
    body('documents.*.type', 'Document type is required').isString(),
    body('documents.*.file', 'File name is required').isString(),
    body('documents.*.sizeKB', 'File size must be a number').isNumeric()
  ],
  validateRequest,
  servicesController.validateDocuments
);

// @route   GET /api/services/:id/status/:statusCode
// @desc    Get service status template
// @access  Private
router.get(
  '/:id/status/:statusCode', 
  protect,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    param('statusCode', 'Status code is required').isString(),
    ...validateLanguage
  ],
  validateRequest,
  servicesController.getServiceStatus
);

// ===============================================================
// Admin Only Routes
// ===============================================================

// @route   POST /api/services
// @desc    Create a new service
// @access  Private (Admin)
router.post(
  '/', 
  protect,
  adminOnly,
  validateServiceCreate,
  validateRequest,
  servicesController.createService
);

// @route   PUT /api/services/:id
// @desc    Update a service
// @access  Private (Admin)
router.put(
  '/:id', 
  protect,
  adminOnly,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    ...validateServiceUpdate
  ],
  validateRequest,
  servicesController.updateService
);

// @route   DELETE /api/services/:id
// @desc    Delete a service
// @access  Private (Admin)
router.delete(
  '/:id', 
  protect,
  adminOnly,
  [
    param('id', 'Service ID or shortName is required').notEmpty(),
    query('permanent', 'Permanent must be true or false').optional().isBoolean()
  ],
  validateRequest,
  servicesController.deleteService
);

// @route   GET /api/services/:id/metrics
// @desc    Get service metrics
// @access  Private (Admin)
router.get(
  '/:id/metrics', 
  protect,
  adminOnly,
  [
    param('id', 'Service ID or shortName is required').notEmpty()
  ],
  validateRequest,
  servicesController.getServiceMetrics
);

// @route   POST /api/services/batch-update
// @desc    Batch update services
// @access  Private (Admin)
router.post(
  '/batch-update', 
  protect,
  adminOnly,
  [
    body('services', 'Services must be an array of IDs or shortNames').isArray(),
    body('services.*', 'Each service identifier must be a string').isString(),
    body('updateData', 'Update data is required').notEmpty().isObject()
  ],
  validateRequest,
  servicesController.batchUpdateServices
);

module.exports = router;
