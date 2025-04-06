const Service = require('../models/Service');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all services with pagination
 * @route   GET /api/services
 * @access  Public
 */
exports.listServices = async (req, res) => {
  try {
    // Parse query parameters with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const language = req.query.language || 'en';
    const status = req.query.status || 'active';
    const sortField = req.query.sort || 'priority';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    // Create sort object
    const sort = {};
    sort[sortField] = sortOrder;

    // Build query
    const query = { status };
    
    // If state is specified, filter by applicable states
    if (req.query.state) {
      query.$or = [
        { stateSpecific: false },
        { 
          stateSpecific: true, 
          applicableStates: req.query.state 
        }
      ];
    }

    // Handle provider filter
    if (req.query.provider) {
      query.provider = req.query.provider;
    }

    // Count total matching documents for pagination
    const total = await Service.countDocuments(query);
    
    // Execute query with pagination
    const services = await Service.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name shortName description category department processingTime status priority');

    // Format services for the requested language
    const formattedServices = services.map(service => 
      service.getServiceSummary(language)
    );

    // Prepare pagination metadata
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    };

    res.status(200).json({
      success: true,
      count: services.length,
      pagination,
      language,
      data: formattedServices
    });
  } catch (error) {
    console.error('Error in listServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single service by ID or shortName
 * @route   GET /api/services/:id
 * @access  Public
 */
exports.getService = async (req, res) => {
  try {
    const language = req.query.language || 'en';
    const { id } = req.params;
    let service;

    // Check if id is a valid MongoDB ObjectId or a shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      // Search by shortName (case insensitive)
      service = await Service.findOne({ 
        shortName: id.toLowerCase() 
      });
    }

    // If no service found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Get language-specific service details
    const serviceDetails = service.getDetailsInLanguage(language);

    // Return success response
    res.status(200).json({
      success: true,
      language,
      data: serviceDetails
    });
  } catch (error) {
    console.error('Error in getService:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching service details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Create a new service
 * @route   POST /api/services
 * @access  Private (Admin)
 */
exports.createService = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    // Add creator info if available
    if (req.user && req.user.id) {
      req.body.createdBy = req.user.id;
      req.body.updatedBy = req.user.id;
    }

    // Create service
    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        id: service._id,
        name: service.name,
        shortName: service.shortName,
        status: service.status
      }
    });
  } catch (error) {
    console.error('Error in createService:', error);
    
    // Handle duplicate shortName error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A service with this shortName already exists',
        field: 'shortName'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle other server errors
    res.status(500).json({
      success: false,
      message: 'Server error while creating service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update a service
 * @route   PUT /api/services/:id
 * @access  Private (Admin)
 */
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find service by ID
    let service = await Service.findById(id);
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Update the updatedBy field if user info available
    if (req.user && req.user.id) {
      req.body.updatedBy = req.user.id;
    }
    
    // Update service
    service = await Service.findByIdAndUpdate(
      id, 
      req.body, 
      { 
        new: true,         // Return the updated document
        runValidators: true // Run mongoose validators
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: {
        id: service._id,
        name: service.name,
        shortName: service.shortName,
        status: service.status
      }
    });
  } catch (error) {
    console.error('Error in updateService:', error);
    
    // Handle duplicate shortName error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Another service with this shortName already exists',
        field: 'shortName'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    // Handle other server errors
    res.status(500).json({
      success: false,
      message: 'Server error while updating service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Search services with advanced filters
 * @route   GET /api/services/search
 * @access  Public
 */
exports.searchServices = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const language = req.query.language || 'en';
    const searchTerm = req.query.q || '';
    
    // Build search query
    let query = {};
    
    // Add text search if search term provided
    if (searchTerm) {
      query.$text = { $search: searchTerm };
    }
    
    // Add filters
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.provider) {
      query.provider = req.query.provider;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    } else {
      // Default to active services only
      query.status = 'active';
    }
    
    // Handle state-specific services
    if (req.query.state) {
      query.$or = [
        { stateSpecific: false },
        { 
          stateSpecific: true, 
          applicableStates: req.query.state 
        }
      ];
    }
    
    // Count total matching documents for pagination
    const total = await Service.countDocuments(query);
    
    // Prepare sort options
    let sort = {};
    
    // If text search is active, sort by text score first
    if (searchTerm) {
      sort.score = { $meta: 'textScore' };
    }
    
    // Add secondary sort field
    const sortField = req.query.sort || 'priority';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;
    sort[sortField] = sortOrder;
    
    // Execute search query with pagination
    let services;
    
    if (searchTerm) {
      // Include text score for results ranking
      services = await Service.find(
        query,
        { score: { $meta: 'textScore' } }
      )
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
    } else {
      services = await Service.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);
    }
    
    // Format services for the requested language
    const formattedServices = services.map(service => 
      service.getServiceSummary(language)
    );
    
    // Prepare pagination metadata
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    };
    
    // Return search results
    res.status(200).json({
      success: true,
      count: services.length,
      pagination,
      language,
      searchTerm: searchTerm || null,
      data: formattedServices
    });
  } catch (error) {
    console.error('Error in searchServices:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get services by category
 * @route   GET /api/services/category/:category
 * @access  Public
 */
exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const language = req.query.language || 'en';
    
    // Build query
    const query = { 
      category, 
      status: 'active' 
    };
    
    // Handle state-specific services
    if (req.query.state) {
      query.$or = [
        { stateSpecific: false },
        { 
          stateSpecific: true, 
          applicableStates: req.query.state 
        }
      ];
    }
    
    // Count total matching documents
    const total = await Service.countDocuments(query);
    
    // Get services in category with pagination
    const services = await Service.find(query)
      .sort({ priority: -1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Format services for the requested language
    const formattedServices = services.map(service => 
      service.getServiceSummary(language)
    );
    
    // Prepare pagination metadata
    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    };
    
    res.status(200).json({
      success: true,
      count: services.length,
      pagination,
      language,
      category,
      data: formattedServices
    });
  } catch (error) {
    console.error('Error in getServicesByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching services by category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get voice commands for a service
 * @route   GET /api/services/:id/voice
 * @access  Public
 */
exports.getVoiceCommands = async (req, res) => {
  try {
    const { id } = req.params;
    const language = req.query.language || 'en';
    
    let service;
    
    // Check if id is a valid MongoDB ObjectId or a shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      // Search by shortName
      service = await Service.findOne({ 
        shortName: id.toLowerCase() 
      });
    }
    
    // If no service found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Get voice commands for the requested language
    const voiceCommands = service.getVoiceCommands(language);
    
    res.status(200).json({
      success: true,
      service: {
        id: service._id,
        name: service.name.en || service.shortName
      },
      language: voiceCommands.language || language,
      isFallback: voiceCommands.isFallback || false,
      data: voiceCommands
    });
  } catch (error) {
    console.error('Error in getVoiceCommands:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving voice commands',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Check user eligibility for a service
 * @route   POST /api/services/:id/check-eligibility
 * @access  Private
 */
exports.checkEligibility = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // Validate request data
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: 'User data is required for eligibility check'
      });
    }
    
    let service;
    
    // Find service by ID or shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      service = await Service.findOne({ shortName: id.toLowerCase() });
    }
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Check if service is active
    if (service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This service is currently not active'
      });
    }
    
    // Check eligibility
    const eligibilityResult = service.checkEligibility(userData);
    
    // Return eligibility result
    return res.status(200).json({
      success: true,
      service: {
        id: service._id,
        name: service.name.en,
        shortName: service.shortName
      },
      eligible: eligibilityResult.eligible,
      message: eligibilityResult.message,
      data: eligibilityResult
    });
  } catch (error) {
    console.error('Error in checkEligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking eligibility',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Calculate fees for a service based on user data
 * @route   POST /api/services/:id/calculate-fees
 * @access  Private
 */
exports.calculateFees = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    // Validate request data
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: 'User data is required for fee calculation'
      });
    }
    
    let service;
    
    // Find service by ID or shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      service = await Service.findOne({ shortName: id.toLowerCase() });
    }
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Check if service is active
    if (service.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This service is currently not active'
      });
    }
    
    // Calculate fees
    const feesResult = service.calculateFees(userData);
    
    // Return calculated fees
    return res.status(200).json({
      success: true,
      service: {
        id: service._id,
        name: service.name.en,
        shortName: service.shortName
      },
      data: feesResult
    });
  } catch (error) {
    console.error('Error in calculateFees:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating fees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Validate user documents for a service
 * @route   POST /api/services/:id/validate-documents
 * @access  Private
 */
exports.validateDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;
    
    // Validate request data
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({
        success: false,
        message: 'Valid documents array is required'
      });
    }
    
    let service;
    
    // Find service by ID or shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      service = await Service.findOne({ shortName: id.toLowerCase() });
    }
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Validate documents
    const validationResult = service.validateDocuments(documents);
    
    // Return validation result
    return res.status(200).json({
      success: true,
      service: {
        id: service._id,
        name: service.name.en,
        shortName: service.shortName
      },
      valid: validationResult.valid,
      message: validationResult.message,
      data: validationResult
    });
  } catch (error) {
    console.error('Error in validateDocuments:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating documents',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get service application status template
 * @route   GET /api/services/:id/status/:statusCode
 * @access  Private
 */
exports.getServiceStatus = async (req, res) => {
  try {
    const { id, statusCode } = req.params;
    const language = req.query.language || 'en';
    
    let service;
    
    // Find service by ID or shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      service = await Service.findOne({ shortName: id.toLowerCase() });
    }
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Get status template
    const statusTemplate = service.getStatusUpdateTemplate(statusCode, language);
    
    // Return status template
    return res.status(200).json({
      success: true,
      language,
      data: statusTemplate
    });
  } catch (error) {
    console.error('Error in getServiceStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving service status template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get service usage metrics
 * @route   GET /api/services/:id/metrics
 * @access  Private (Admin)
 */
exports.getServiceMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has admin access
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin permission required'
      });
    }
    
    let service;
    
    // Find service by ID or shortName
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id)
        .populate('applicationsCount')
        .populate('activeApplicationsCount');
    } else {
      service = await Service.findOne({ shortName: id.toLowerCase() })
        .populate('applicationsCount')
        .populate('activeApplicationsCount');
    }
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Get service metrics
    // Note: In a real app, you would aggregate data from User applications
    // and possibly other sources to build metrics
    
    const metrics = {
      service: {
        id: service._id,
        name: service.name.en,
        shortName: service.shortName,
        status: service.status
      },
      applications: {
        total: service.applicationsCount || 0,
        active: service.activeApplicationsCount || 0,
        completed: 0, // Would be calculated from aggregation
        rejected: 0   // Would be calculated from aggregation
      },
      performance: {
        averageProcessingDays: service.processingTime.averageDays || 0,
        averageTimeToComplete: 0, // Would be calculated from actual data
        satisfactionRating: 0     // Would be calculated from user feedback
      },
      usage: {
        dailyAverage: 0,          // Would be calculated from actual data
        weeklyTrend: [],          // Would be calculated from actual data
        monthlyTrend: []          // Would be calculated from actual data
      },
      created: service.createdAt,
      updated: service.updatedAt
    };
    
    // Return metrics
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error in getServiceMetrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving service metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete or deactivate a service
 * @route   DELETE /api/services/:id
 * @access  Private (Admin)
 */
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    
    // Check if user has admin access
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin permission required'
      });
    }
    
    let service;
    
    // Find service
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await Service.findById(id);
    } else {
      service = await Service.findOne({ shortName: id.toLowerCase() });
    }
    
    // If service not found
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Check if permanent delete is requested (destructive)
    if (permanent === 'true') {
      // Require additional confirmation (e.g., through a confirmation code or separate auth)
      const confirmationCode = req.headers['x-confirmation-code'];
      
      if (!confirmationCode || confirmationCode !== process.env.ADMIN_DELETE_CONFIRMATION) {
        return res.status(400).json({
          success: false,
          message: 'Permanent deletion requires confirmation code'
        });
      }
      
      // Perform actual deletion
      await Service.findByIdAndDelete(service._id);
      
      return res.status(200).json({
        success: true,
        message: `Service '${service.name.en}' has been permanently deleted`,
        deletionType: 'permanent'
      });
    } else {
      // Soft delete by setting status to 'deprecated'
      service.status = 'deprecated';
      service.updatedBy = req.user.id;
      
      // Save the updated service
      await service.save();
      
      // Optional: Add audit log entry
      // In a real app, you would have a separate audit logging system
      console.log(`Service ${service._id} (${service.shortName}) was deprecated by user ${req.user.id} at ${new Date()}`);
      
      // Check if service has active applications
      // In a real app, you would count active applications and notify users
      let activeApplicationsMessage = '';
      if (service.activeApplicationsCount > 0) {
        activeApplicationsMessage = ` Note: There are ${service.activeApplicationsCount} active applications that need to be processed.`;
      }
      
      return res.status(200).json({
        success: true,
        message: `Service '${service.name.en}' has been deprecated.${activeApplicationsMessage}`,
        deletionType: 'soft',
        newStatus: service.status
      });
    }
  } catch (error) {
    console.error('Error in deleteService:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Batch update multiple services at once
 * @route   POST /api/services/batch-update
 * @access  Private (Admin)
 */
exports.batchUpdateServices = async (req, res) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if user has admin access
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin permission required'
      });
    }
    
    const { services, updateData } = req.body;
    
    // Validate request
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of service IDs or shortNames to update'
      });
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide update data'
      });
    }
    
    // Add updater info
    updateData.updatedBy = req.user.id;
    
    // Prevent changing critical fields in batch operations
    const restrictedFields = ['_id', 'shortName', 'createdBy', 'createdAt'];
    restrictedFields.forEach(field => {
      if (field in updateData) {
        delete updateData[field];
      }
    });
    
    // Initialize result tracking
    const results = {
      success: true,
      total: services.length,
      updated: 0,
      failed: 0,
      notFound: 0,
      updatedServices: [],
      failedServices: []
    };
    
    // Process each service
    for (const serviceIdentifier of services) {
      let service;
      
      // Find service by ID or shortName
      if (mongoose.Types.ObjectId.isValid(serviceIdentifier)) {
        service = await Service.findById(serviceIdentifier).session(session);
      } else {
        service = await Service.findOne({ 
          shortName: serviceIdentifier.toLowerCase() 
        }).session(session);
      }
      
      // If service not found, track it
      if (!service) {
        results.notFound++;
        results.failedServices.push({
          identifier: serviceIdentifier,
          reason: 'Service not found'
        });
        continue;
      }
      
      try {
        // Update the service
        const updatedService = await Service.findByIdAndUpdate(
          service._id,
          { $set: updateData },
          { 
            new: true, 
            runValidators: true,
            session
          }
        );
        
        // Track success
        results.updated++;
        results.updatedServices.push({
          id: updatedService._id,
          name: updatedService.name.en,
          shortName: updatedService.shortName
        });
      } catch (updateError) {
        // Track failure
        results.failed++;
        results.failedServices.push({
          identifier: serviceIdentifier,
          reason: updateError.message
        });
      }
    }
    
    // If any services were updated, commit the transaction
    if (results.updated > 0) {
      await session.commitTransaction();
      
      // Optional: Add batch update to audit log
      console.log(`Batch update of ${results.updated} services performed by user ${req.user.id} at ${new Date()}`);
    } else {
      // If no services were updated, abort the transaction
      await session.abortTransaction();
      results.success = false;
    }
    
    // End the session
    session.endSession();
    
    // Return results
    return res.status(200).json({
      success: results.success,
      message: `Batch update completed. Updated ${results.updated} of ${results.total} services.`,
      data: results
    });
  } catch (error) {
    // If error occurred, abort the transaction
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error in batchUpdateServices:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing batch update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
