const mongoose = require('mongoose');

/**
 * Service Schema
 * Represents government services available through the SwarSeva platform
 */
const ServiceSchema = new mongoose.Schema({
  // Basic service information with multilingual support
  name: {
    en: {
      type: String,
      required: [true, 'Service name in English is required'],
      trim: true,
      maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    hi: {
      type: String,
      trim: true,
      maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    mr: { type: String, trim: true },
    gu: { type: String, trim: true },
    pa: { type: String, trim: true },
    ta: { type: String, trim: true },
    te: { type: String, trim: true },
    kn: { type: String, trim: true },
    bn: { type: String, trim: true },
    ml: { type: String, trim: true },
    or: { type: String, trim: true },
    as: { type: String, trim: true }
  },
  
  description: {
    en: {
      type: String,
      required: [true, 'Service description in English is required'],
      trim: true
    },
    hi: { type: String, trim: true },
    mr: { type: String, trim: true },
    gu: { type: String, trim: true },
    pa: { type: String, trim: true },
    ta: { type: String, trim: true },
    te: { type: String, trim: true },
    kn: { type: String, trim: true },
    bn: { type: String, trim: true },
    ml: { type: String, trim: true },
    or: { type: String, trim: true },
    as: { type: String, trim: true }
  },
  
  shortDescription: {
    en: {
      type: String,
      required: [true, 'Short description in English is required'],
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    hi: { type: String, trim: true, maxlength: 200 },
    mr: { type: String, trim: true, maxlength: 200 },
    gu: { type: String, trim: true, maxlength: 200 },
    pa: { type: String, trim: true, maxlength: 200 },
    ta: { type: String, trim: true, maxlength: 200 },
    te: { type: String, trim: true, maxlength: 200 },
    kn: { type: String, trim: true, maxlength: 200 },
    bn: { type: String, trim: true, maxlength: 200 },
    ml: { type: String, trim: true, maxlength: 200 },
    or: { type: String, trim: true, maxlength: 200 },
    as: { type: String, trim: true, maxlength: 200 }
  },
  
  // Service categorization and metadata
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: {
      values: [
        'health', 'education', 'agriculture', 'finance', 'housing',
        'legal', 'employment', 'certification', 'welfare', 'pension',
        'utility', 'transportation', 'other'
      ],
      message: 'Please select a valid service category'
    }
  },
  
  subCategory: {
    type: String,
    trim: true
  },
  
  department: {
    type: String,
    required: [true, 'Government department is required'],
    trim: true
  },
  
  serviceCode: {
    type: String,
    required: [true, 'Service code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Service availability and status
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'draft', 'archived', 'seasonal'],
      message: 'Please select a valid status'
    },
    default: 'draft'
  },
  
  isPublished: {
    type: Boolean,
    default: false
  },
  
  availableOnline: {
    type: Boolean,
    default: true
  },
  
  availableOffline: {
    type: Boolean,
    default: true
  },
  
  offlineLocations: [{
    name: String,
    address: String,
    district: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactDetails: {
      phone: String,
      email: String,
      website: String
    },
    openingHours: String
  }],
  
  // Eligibility criteria
  eligibilityCriteria: {
    en: {
      type: String,
      required: [true, 'Eligibility criteria in English is required']
    },
    hi: { type: String },
    mr: { type: String },
    gu: { type: String },
    pa: { type: String },
    ta: { type: String },
    te: { type: String },
    kn: { type: String },
    bn: { type: String },
    ml: { type: String },
    or: { type: String },
    as: { type: String }
  },
  
  // Structured eligibility rules for programmatic evaluation
  eligibilityRules: [{
    criteriaType: {
      type: String,
      enum: {
        values: [
          'age', 'income', 'gender', 'residency', 'disability', 
          'education', 'occupation', 'maritalStatus', 'children',
          'minority', 'bpl', 'veteran', 'other'
        ]
      }
    },
    condition: {
      operator: {
        type: String,
        enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'between', 'includes', 'excludes']
      },
      value: mongoose.Schema.Types.Mixed,
      minValue: mongoose.Schema.Types.Mixed,
      maxValue: mongoose.Schema.Types.Mixed
    },
    description: {
      en: { type: String },
      hi: { type: String }
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  
  // Required documents
  requiredDocuments: [{
    name: {
      en: { 
        type: String,
        required: true
      },
      hi: { type: String },
      mr: { type: String },
      gu: { type: String },
      pa: { type: String },
      ta: { type: String },
      te: { type: String },
      kn: { type: String },
      bn: { type: String },
      ml: { type: String },
      or: { type: String },
      as: { type: String }
    },
    description: {
      en: { type: String },
      hi: { type: String }
    },
    documentType: {
      type: String,
      enum: ['identity', 'address', 'income', 'education', 'age', 'other']
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    acceptedFormats: [String], // pdf, jpg, png
    maxFileSize: Number, // in KB
    validationRules: {
      minAge: Number,
      maxAge: Number,
      yearValidity: Number,
      otherCriteria: String
    }
  }],
  
  // Application process
  processingSteps: [{
    stepNumber: Number,
    title: {
      en: { type: String, required: true },
      hi: { type: String }
    },
    description: {
      en: { type: String, required: true },
      hi: { type: String }
    },
    estimatedTime: {
      value: Number,
      unit: {
        type: String,
        enum: ['minutes', 'hours', 'days', 'weeks', 'months']
      }
    },
    responsibleDepartment: String,
    status: {
      type: String,
      enum: ['notStarted', 'inProgress', 'completed', 'onHold', 'failed'],
      default: 'notStarted'
    }
  }],
  
  processingTime: {
    min: Number, // in days
    max: Number, // in days
    description: {
      en: { type: String },
      hi: { type: String }
    }
  },
  
  // Voice interface settings
  voiceInterface: {
    enabled: {
      type: Boolean,
      default: true
    },
    voicePrompts: {
      welcome: {
        en: { type: String },
        hi: { type: String }
      },
      eligibility: {
        en: { type: String },
        hi: { type: String }
      },
      documents: {
        en: { type: String },
        hi: { type: String }
      },
      confirmation: {
        en: { type: String },
        hi: { type: String }
      }
    },
    keyPhrases: [String],
    voiceCommandMap: [{
      command: String,
      action: String,
      response: {
        en: { type: String },
        hi: { type: String }
      }
    }]
  },
  
  // Fees and payment
  fees: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    variableFee: Boolean,
    feeStructure: {
      en: { type: String },
      hi: { type: String }
    },
    feeCalculationRules: [{
      criteriaType: {
        type: String,
        enum: ['income', 'age', 'category', 'location', 'urgency', 'other']
      },
      condition: {
        operator: {
          type: String,
          enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'between']
        },
        value: mongoose.Schema.Types.Mixed,
        minValue: mongoose.Schema.Types.Mixed,
        maxValue: mongoose.Schema.Types.Mixed
      },
      feeAmount: Number,
      description: {
        en: { type: String },
        hi: { type: String }
      }
    }],
    feeWaiverAvailable: Boolean,
    feeWaiverCriteria: {
      en: { type: String },
      hi: { type: String }
    },
    paymentMethods: [{
      type: String,
      enum: ['online', 'challan', 'upi', 'netBanking', 'card', 'cash']
    }]
  },
  
  // Service provider information
  serviceProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Reviews and ratings
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Service statistics
  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    successfulApplications: {
      type: Number,
      default: 0
    },
    averageProcessingTime: Number, // in days
    viewCount: {
      type: Number,
      default: 0
    },
    applicationCount: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Additional service information
  additionalInfo: {
    en: { type: String },
    hi: { type: String }
  },
  
  // Contact information for queries
  contactInfo: {
    email: {
      type: String,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: String,
    website: String,
    helplineNumber: String
  },
  
  // FAQs
  faqs: [{
    question: {
      en: { type: String, required: true },
      hi: { type: String }
    },
    answer: {
      en: { type: String, required: true },
      hi: { type: String }
    }
  }],
  
  // Tracking information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for application URL
ServiceSchema.virtual('applicationUrl').get(function() {
  return `/services/${this.serviceCode}/apply`;
});

// Virtual for total number of documents required
ServiceSchema.virtual('totalDocumentsRequired').get(function() {
  return this.requiredDocuments.filter(doc => doc.isRequired).length;
});

// Index for faster searches
ServiceSchema.index({ serviceCode: 1 }, { unique: true });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ status: 1 });
ServiceSchema.index({ 'name.en': 'text', 'description.en': 'text' });
ServiceSchema.index({ department: 1 });
ServiceSchema.index({ isPublished: 1, status: 1 });

/**
 * Get service details in specific language
 * Falls back to English if requested language not available
 * 
 * @param {String} language - Language code (en, hi, etc.)
 * @returns {Object} - Service details in requested language
 */
ServiceSchema.methods.getDetailsInLanguage = function(language = 'en') {
  // Default to English if requested language not available
  const fallbackLang = 'en';
  
  return {
    id: this._id,
    serviceCode: this.serviceCode,
    name: this.name[language] || this.name[fallbackLang],
    description: this.description[language] || this.description[fallbackLang],
    shortDescription: this.shortDescription[language] || this.shortDescription[fallbackLang],
    eligibilityCriteria: this.eligibilityCriteria[language] || this.eligibilityCriteria[fall

const mongoose = require('mongoose');

/**
 * Service Schema
 * Represents government services available through the SwarSeva platform
 */
const ServiceSchema = new mongoose.Schema({
  // Basic service information
  name: {
    // Multilingual name fields
    en: {
      type: String,
      required: [true, 'Service name in English is required'],
      trim: true,
      maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    hi: {
      type: String,
      trim: true,
      maxlength: [100, 'Service name cannot be more than 100 characters']
    },
    // Fields for other languages
    mr: { type: String, trim: true },
    gu: { type: String, trim: true },
    pa: { type: String, trim: true },
    ta: { type: String, trim: true },
    te: { type: String, trim: true },
    kn: { type: String, trim: true },
    bn: { type: String, trim: true },
    ml: { type: String, trim: true },
    or: { type: String, trim: true },
    as: { type: String, trim: true }
  },
  description: {
    // Multilingual description fields
    en: {
      type: String,
      required: [true, 'Service description in English is required'],
      trim: true
    },
    hi: {
      type: String,
      trim: true
    },
    // Fields for other languages
    mr: { type: String, trim: true },
    gu: { type: String, trim: true },
    pa: { type: String, trim: true },
    ta: { type: String, trim: true },
    te: { type: String, trim: true },
    kn: { type: String, trim: true },
    bn: { type: String, trim: true },
    ml: { type: String, trim: true },
    or: { type: String, trim: true },
    as: { type: String, trim: true }
  },
  shortDescription: {
    // Multilingual short description fields
    en: {
      type: String,
      required: [true, 'Short description in English is required'],
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    hi: {
      type: String,
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    // Fields for other languages
    mr: { type: String, trim: true, maxlength: 200 },
    gu: { type: String, trim: true, maxlength: 200 },
    pa: { type: String, trim: true, maxlength: 200 },
    te: { type: String, trim: true, maxlength: 200 },
    ta: { type: String, trim: true, maxlength: 200 },
    kn: { type: String, trim: true, maxlength: 200 },
    bn: { type: String, trim: true, maxlength: 200 },
    ml: { type: String, trim: true, maxlength: 200 },
    or: { type: String, trim: true, maxlength: 200 },
    as: { type: String, trim: true, maxlength: 200 }
  },
  
  // Service category and classification
  category: {
    type: String,
    required: [true, 'Service category is required'],
    enum: {
      values: [
        'health', 'education', 'agriculture', 'finance', 
        'housing', 'legal', 'employment', 'certification',
        'welfare', 'pension', 'utility', 'transportation', 'other'
      ],
      message: 'Please select a valid service category'
    }
  },
  subCategory: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Government department is required'],
    trim: true
  },
  serviceCode: {
    type: String,
    required: [true, 'Service code is required'],
    unique: true,
    trim: true
  },
  
  // Service image and thumbnail
  imageUrl: {
    type: String,
    default: 'default-service.png'
  },
  thumbnailUrl: {
    type: String
  },
  
  // Service status
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'draft', 'archived', 'seasonal'],
      message: 'Please select a valid status'
    },
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  
  // Service availability
  availableOnline: {
    type: Boolean,
    default: true
  },
  availableOffline: {
    type: Boolean,
    default: true
  },
  offlineLocations: [{
    name: String,
    address: String,
    district: String,
    state: String,
    pincode: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    contactDetails: {
      phone: String,
      email: String,
      website: String
    },
    openingHours: String
  }],
  
  // Eligibility criteria
  eligibilityCriteria: {
    // Multilingual eligibility criteria
    en: {
      type: String,
      required: [true, 'Eligibility criteria in English is required']
    },
    hi: { type: String },
    // Fields for other languages
    mr: { type: String },
    gu: { type: String },
    pa: { type: String },
    ta: { type: String },
    te: { type: String },
    kn: { type: String },
    bn: { type: String },
    ml: { type: String },
    or: { type: String },
    as: { type: String }
  },
  eligibilityRules: [{
    criteria: {
      type: String,
      enum: {
        values: [
          'age', 'income', 'gender', 'residency', 'disability', 
          'education', 'occupation', 'maritalStatus', 'children',
          'minority', 'bpl', 'veteran', 'other'
        ]
      }
    },
    condition: {
      operator: {
        type: String,
        enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'between', 'includes']
      },
      value: mongoose.Schema.Types.Mixed,
      minValue: mongoose.Schema.Types.Mixed,
      maxValue: mongoose.Schema.Types.Mixed
    },
    description: {
      en: { type: String },
      hi: { type: String }
    }
  }],
  
  // Required documents
  requiredDocuments: [{
    name: {
      en: { 
        type: String,
        required: true
      },
      hi: { type: String },
      // Other languages...
      mr: { type: String },
      gu: { type: String },
      pa: { type: String }
    },
    description: {
      en: { type: String },
      hi: { type: String }
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    acceptedFormats: [String], // pdf, jpg, png
    maxFileSize: Number // in KB
  }],
  
  // Application process
  applicationProcess: {
    en: { 
      type: String,
      required: [true, 'Application process in English is required']
    },
    hi: { type: String },
    // Other languages...
    mr: { type: String },
    gu: { type: String },
    pa: { type: String }
  },
  processingTime: {
    min: Number, // in days
    max: Number, // in days
    description: {
      en: { type: String },
      hi: { type: String }
    }
  },
  
  // Fees and payment
  fees: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    variableFee: Boolean,
    feeStructure: {
      en: { type: String },
      hi: { type: String }
    },
    feeWaiverAvailable: Boolean,
    feeWaiverCriteria: {
      en: { type: String },
      hi: { type: String }
    },
    paymentMethods: [{
      type: String,
      enum: ['online', 'challan', 'upi', 'netBanking', 'card', 'cash']
    }]
  },
  
  // Service provider information
  serviceProviders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Reviews and ratings
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // Service statistics
  statistics: {
    totalApplications: {
      type: Number,
      default: 0
    },
    successfulApplications: {
      type: Number,
      default: 0
    },
    averageProcessingTime: Number, // in days
    popularityRank: Number,
    viewCount: {
      type: Number,
      default: 0
    },
    applicationCount: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  
  // Related services
  relatedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  
  // Additional information
  additionalInfo: {
    en: { type: String },
    hi: { type: String },
    // Other languages...
    mr: { type: String },
    gu: { type: String },
    pa: { type: String }
  },
  
  // Contact information for queries
  contactInfo: {
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },
    phone: String,
    website: String,
    helplineNumber: String
  },
  
  // FAQ section
  faqs: [{
    question: {
      en: { 
        type: String,
        required: true
      },
      hi: { type: String },
      // Other languages...
      mr: { type: String },
      gu: { type: String },
      pa: { type: String }
    },
    answer: {
      en: { 
        type: String,
        required: true
      },
      hi: { type: String },
      // Other languages...
      mr: { type: String },
      gu: { type: String },
      pa: { type: String }
    }
  }],
  
  // SEO metadata
  seo: {
    metaTitle: {
      en: String,
      hi: String
    },
    metaDescription: {
      en: String,
      hi: String
    },
    keywords: [String]
  },
  
  // Tracking information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for application URL
ServiceSchema.virtual('applicationUrl').get(function() {
  return `/services/${this.serviceCode}/apply`;
});

// Index for faster searches
ServiceSchema.index({ serviceCode: 1 }, { unique: true });
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ status: 1 });
ServiceSchema.index({ 'name.en': 'text', 'description.en': 'text' });

/**
 * Get service details in specific language
 * Falls back to English if translation not available
 * 
 * @param {String} language - Language code (en, hi, etc.)
 * @returns {Object} - Service details in requested language
 */
ServiceSchema.methods.getDetailsInLanguage = function(language = 'en') {
  // Default to English if requested language not available
  const fallbackLang = 'en';
  
  return {
    id: this._id,
    name: this.name[language] || this.name[fallbackLang],
    description: this.description[language] || this.description[fallbackLang],
    shortDescription: this.shortDescription[language] || this.shortDescription[fallbackLang],

/**
 * Multilingual text schema for fields that need to support multiple languages
 */
const MultilingualTextSchema = new mongoose.Schema({
  en: {
    type: String,
    required: [true, 'English text is required']
  },
  hi: String,
  bn: String,
  ta: String,
  te: String,
  mr: String,
  gu: String,
  kn: String,
  ml: String,
  pa: String,
  or: String,
  as: String
}, { _id: false });

/**
 * Process step schema for outlining the steps required for a service
 */
const ProcessStepSchema = new mongoose.Schema({
  stepNumber: {
    type: Number,
    required: true
  },
  title: {
    type: MultilingualTextSchema,
    required: true
  },
  description: {
    type: MultilingualTextSchema,
    required: true
  },
  estimatedTimeInDays: Number,
  responsibleDepartment: String,
  requiresUserAction: {
    type: Boolean,
    default: false
  },
  userActionDetails: MultilingualTextSchema
}, { _id: false });

/**
 * Document requirement schema
 */
const RequirementSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true,
    enum: ['aadhar', 'pan', 'voter', 'driving', 'passport', 'income', 'residence', 'photo', 'birth', 'caste', 'education', 'medical', 'bank', 'other']
  },
  name: {
    type: MultilingualTextSchema,
    required: true
  },
  description: MultilingualTextSchema,
  isMandatory: {
    type: Boolean,
    default: true
  },
  validationRules: {
    type: String,
    enum: ['none', 'format', 'expiry', 'photo', 'digital']
  },
  allowedFileTypes: [String],
  maxFileSizeKB: Number
}, { _id: false });

/**
 * Eligibility criteria schema
 */
const EligibilityCriteriaSchema = new mongoose.Schema({
  criteriaType: {
    type: String,
    required: true,
    enum: ['age', 'income', 'residence', 'education', 'gender', 'marital', 'occupation', 'category', 'disability', 'other']
  },
  name: {
    type: MultilingualTextSchema,
    required: true
  },
  description: MultilingualTextSchema,
  minValue: mongoose.Schema.Types.Mixed,
  maxValue: mongoose.Schema.Types.Mixed,
  allowedValues: [String],
  validationMethod: {
    type: String,
    enum: ['range', 'exact', 'minimum', 'maximum', 'list', 'boolean', 'custom'],
    default: 'range'
  }
}, { _id: false });

/**
 * Fee structure schema
 */
const FeeSchema = new mongoose.Schema({
  feeType: {
    type: String,
    required: true,
    enum: ['application', 'processing', 'certification', 'renewal', 'late', 'priority', 'other']
  },
  name: {
    type: MultilingualTextSchema,
    required: true
  },
  description: MultilingualTextSchema,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  variableFactors: [{
    factor: String,
    calculation: String
  }],
  waiver: {
    eligibility: [String],
    description: MultilingualTextSchema
  }
}, { _id: false });

/**
 * Voice command schema
 */
const VoiceCommandSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    enum: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as'],
    default: 'en'
  },
  triggers: {
    type: [String],
    required: true
  },
  examples: [String],
  synonyms: [String],
  responseTemplate: String
}, { _id: false });

/**
 * Main Service Schema
 */
const ServiceSchema = new mongoose.Schema({
  name: {
    type: MultilingualTextSchema,
    required: true
  },
  shortName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: MultilingualTextSchema,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'health', 'education', 'employment', 'finance', 'welfare', 
      'agriculture', 'housing', 'legal', 'transport', 'utilities', 
      'business', 'certificates', 'pension', 'taxes', 'other'
    ]
  },
  subCategory: String,
  requirements: [RequirementSchema],
  processSteps: [ProcessStepSchema],
  eligibilityCriteria: [EligibilityCriteriaSchema],
  fees: [FeeSchema],
  processingTime: {
    minDays: Number,
    maxDays: Number,
    averageDays: Number,
    description: MultilingualTextSchema
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'deprecated'],
    default: 'draft'
  },
  department: {
    name: {
      type: MultilingualTextSchema,
      required: true
    },
    code: String,
    contactEmail: String,
    contactPhone: String,
    website: String
  },
  provider: {
    type: String,
    enum: ['central', 'state', 'local', 'private'],
    default: 'central'
  },
  stateSpecific: {
    type: Boolean,
    default: false
  },
  applicableStates: [String],
  serviceUrl: String,
  helpUrl: String,
  faqs: [{
    question: MultilingualTextSchema,
    answer: MultilingualTextSchema
  }],
  voiceCommands: [VoiceCommandSchema],
  accessLevel: {
    type: String,
    enum: ['public', 'authenticated', 'eligible', 'restricted'],
    default: 'authenticated'
  },
  priority: {
    type: Number,
    default: 5,
    min: 1, 
    max: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Get service details in a specific language
 * @param {string} language - Language code (en, hi, etc.)
 * @returns {Object} Service details in the specified language
 */
ServiceSchema.methods.getDetailsInLanguage = function(language = 'en') {
  // Default to English if requested language is not available
  const getFallbackText = (field) => {
    if (!field) return null;
    return field[language] || field.en || null;
  };
  
  return {
    id: this._id,
    name: getFallbackText(this.name),
    shortName: this.shortName,
    description: getFallbackText(this.description),
    category: this.category,
    subCategory: this.subCategory,
    requirements: this.requirements.map(req => ({
      documentType: req.documentType,
      name: getFallbackText(req.name),
      description: getFallbackText(req.description),
      isMandatory: req.isMandatory,
      validationRules: req.validationRules,
      allowedFileTypes: req.allowedFileTypes,
      maxFileSizeKB: req.maxFileSizeKB
    })),
    processSteps: this.processSteps.map(step => ({
      stepNumber: step.stepNumber,
      title: getFallbackText(step.title),
      description: getFallbackText(step.description),
      estimatedTimeInDays: step.estimatedTimeInDays,
      responsibleDepartment: step.responsibleDepartment,
      requiresUserAction: step.requiresUserAction,
      userActionDetails: getFallbackText(step.userActionDetails)
    })),
    eligibilityCriteria: this.eligibilityCriteria.map(criteria => ({
      criteriaType: criteria.criteriaType,
      name: getFallbackText(criteria.name),
      description: getFallbackText(criteria.description),
      minValue: criteria.minValue,
      maxValue: criteria.maxValue,
      allowedValues: criteria.allowedValues,
      validationMethod: criteria.validationMethod
    })),
    fees: this.fees.map(fee => ({
      feeType: fee.feeType,
      name: getFallbackText(fee.name),
      description: getFallbackText(fee.description),
      amount: fee.amount,
      currency: fee.currency,
      variableFactors: fee.variableFactors,
      waiver: fee.waiver ? {
        eligibility: fee.waiver.eligibility,
        description: getFallbackText(fee.waiver.description)
      } : null
    })),
    processingTime: {
      minDays: this.processingTime.minDays,
      maxDays: this.processingTime.maxDays,
      averageDays: this.processingTime.averageDays,
      description: getFallbackText(this.processingTime.description)
    },
    department: {
      name: getFallbackText(this.department.name),
      code: this.department.code,
      contactEmail: this.department.contactEmail,
      contactPhone: this.department.contactPhone,
      website: this.department.website
    },
    status: this.status,
    provider: this.provider,
    stateSpecific: this.stateSpecific,
    applicableStates: this.applicableStates,
    serviceUrl: this.serviceUrl,
    helpUrl: this.helpUrl,
    faqs: this.faqs.map(faq => ({
      question: getFallbackText(faq.question),
      answer: getFallbackText(faq.answer)
    }))
  };
};

/**
 * Check if user is eligible for the service
 * @param {Object} userData - User profile data to check against eligibility criteria
 * @returns {Object} Eligibility result with status and reasons
 */
ServiceSchema.methods.checkEligibility = function(userData) {
  // Skip if no eligibility criteria defined
  if (!this.eligibilityCriteria || this.eligibilityCriteria.length === 0) {
    return { 
      eligible: true, 
      message: 'No eligibility criteria specified'
    };
  }
  
  const results = {
    eligible: true,
    failedCriteria: [],
    missingData: []
  };
  
  // Check each criterion
  this.eligibilityCriteria.forEach(criteria => {
    const criteriaName = criteria.name.en || 'Unnamed criterion';
    
    // Get corresponding user data based on criteria type
    let userValue;
    
    switch(criteria.criteriaType) {
      case 'age':
        if (!userData.dateOfBirth) {
          results.missingData.push({ field: 'dateOfBirth', criteria: criteriaName });
          return;
        }
        
        // Calculate age
        const today = new Date();
        const birthDate = new Date(userData.dateOfBirth);
        const age = today.getFullYear() - birthDate.getFullYear() - 
          (today.getMonth() < birthDate.getMonth() || 
            (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0);
        
        userValue = age;
        break;
        
      case 'income':
        userValue = userData.income;
        break;
        
      case 'residence':
        userValue = userData.address ? userData.address.state : undefined;
        break;
        
      case 'education':
        userValue = userData.education ? userData.education.level : undefined;
        break;
        
      case 'gender':
        userValue = userData.gender;
        break;
        
      case 'marital':
        userValue = userData.maritalStatus;
        break;
        
      case 'occupation':
        userValue = userData.occupation;
        break;
        
      case 'category':
        userValue = userData.category;
        break;
        
      case 'disability':
        userValue = userData.hasDisability;
        break;
        
      case 'other':
      default:
        // For other criteria, check if user data has a custom field with the same name
        const customFieldName = criteria.criteriaType.toLowerCase();
        userValue = userData[customFieldName];
        break;
    }
    
    // Check if required data is missing
    if (userValue === undefined) {
      results.missingData.push({ field: criteria.criteriaType, criteria: criteriaName });
      return;
    }
    
    // Evaluate based on validation method
    let criteriaResult = false;
    
    switch(criteria.validationMethod) {
      case 'range':
        criteriaResult = (criteria.minValue === null || userValue >= criteria.minValue) && 
                         (criteria.maxValue === null || userValue <= criteria.maxValue);
        break;
        
      case 'exact':
        criteriaResult = userValue === criteria.minValue;
        break;
        
      case 'minimum':
        criteriaResult = userValue >= criteria.minValue;
        break;
        
      case 'maximum':
        criteriaResult = userValue <= criteria.maxValue;
        break;
        
      case 'list':
        criteriaResult = criteria.allowedValues.includes(userValue);
        break;
        
      case 'boolean':
        criteriaResult = Boolean(userValue);
        break;
        
      case 'custom':
        // Custom validation would require specific logic per service
        criteriaResult = true; // Default to true for now
        break;
    }
    
    // If this criterion fails, add to failed list
    if (!criteriaResult) {
      results.failedCriteria.push({
        type: criteria.criteriaType,
        name: criteriaName,
        userValue: userValue,
        required: criteria.validationMethod === 'range' ? 
          `Between ${criteria.minValue} and ${criteria.maxValue}` : 
          criteria.validationMethod === 'list' ? 
            `One of: ${criteria.allowedValues.join(', ')}` : 
            `${criteria.validationMethod}: ${criteria.minValue || criteria.maxValue || 'Custom validation'}`
      });
    }
  });
  
  // If any criteria failed or data is missing, user is not eligible
  if (results.failedCriteria.length > 0) {
    results.eligible = false;
    results.message = 'User does not meet eligibility criteria';
  } else if (results.missingData.length > 0) {
    results.eligible = 'unknown';
    results.message = 'Missing required information to determine eligibility';
  } else {
    results.message = 'User meets all eligibility criteria';
  }
  
  return results;
};

/**
 * Calculate fees for the service based on user data
 * @param {Object} userData - User profile data to calculate fees
 * @returns {Object} Calculated fees with breakdown
 */
ServiceSchema.methods.calculateFees = function(userData) {
  if (!this.fees || this.fees.length === 0) {
    return {
      totalAmount: 0,
      currency: 'INR',
      breakdown: [],
      message: 'No fees associated with this service'
    };
  }
  
  const result = {
    totalAmount: 0,
    currency: this.fees[0].currency || 'INR',
    breakdown: [],
    waivers: []
  };
  
  try {
    // Process each fee type
    this.fees.forEach(fee => {
      let feeAmount = fee.amount;
      let waived = false;
      
      // Check for fee waivers if applicable
      if (fee.waiver && fee.waiver.eligibility && fee.waiver.eligibility.length > 0) {
        // Simple waiver check - in a real app, this would be more sophisticated
        const eligibleForWaiver = fee.waiver.eligibility.some(category => {
          // Check user category or other waiver eligibility factors
          if (category === 'bpl' && userData.isBPL) return true;
          if (category === 'senior' && userData.age >= 60) return true;
          if (category === 'student' && userData.isStudent) return true;
          if (category === 'disability' && userData.hasDisability) return true;
          if (category === 'female' && userData.gender === 'female') return true;
          return false;
        });
        
        if (eligibleForWaiver) {
          waived = true;
          result.waivers.push({
            feeType: fee.feeType,
            name: fee.name.en,
            amount: feeAmount,
            reason: fee.waiver.description.en || 'Eligible for fee waiver'
          });
        }
      }
      
      // Apply variable factors (like income-based scaling) if any
      if (!waived && fee.variableFactors && fee.variableFactors.length > 0) {
        fee.variableFactors.forEach(factor => {
          if (factor.factor === 'income' && userData.income) {
            // Simple income-based scaling example
            if (userData.income < 300000) { // Less than 3 lakhs
              feeAmount *= 0.5; // 50% discount
            } else if (userData.income > 1000000) { // More than 10 lakhs
              feeAmount *= 1.5; // 50% premium
            }
          }
          
          if (factor.factor === 'age' && userData.age) {
            // Age-based adjustments
            if (userData.age < 18) {
              feeAmount *= 0.5; // Child discount
            } else if (userData.age >= 60) {
              feeAmount *= 0.75; // Senior discount
            }
          }
          
          // Add other variable factors as needed
        });
      }
      
      // Add to breakdown only if not waived
      if (!waived) {
        result.breakdown.push({
          feeType: fee.feeType,
          name: fee.name.en,
          amount: feeAmount,
          description: fee.description ? fee.description.en : null
        });
        
        result.totalAmount += feeAmount;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error calculating fees:', error);
    return {
      totalAmount: 0,
      currency: 'INR',
      breakdown: [],
      error: 'Error calculating fees'
    };
  }
};

/**
 * Get voice commands for a specific language
 * @param {string} language - Language code (en, hi, etc.)
 * @returns {Object} Voice commands for the specified language
 */
ServiceSchema.methods.getVoiceCommands = function(language = 'en') {
  try {
    // Get language-specific commands
    const commands = this.voiceCommands.filter(cmd => cmd.language === language);
    
    // If no commands for specific language, fall back to English
    if (commands.length === 0 && language !== 'en') {
      const englishCommands = this.voiceCommands.filter(cmd => cmd.language === 'en');
      
      if (englishCommands.length === 0) {
        return {
          available: false,
          message: 'No voice commands available for this service'
        };
      }
      
      return {
        available: true,
        language: 'en',
        isFallback: true,
        commands: englishCommands.map(cmd => ({
          triggers: cmd.triggers,
          examples: cmd.examples || [],
          synonyms: cmd.synonyms || [],
          responseTemplate: cmd.responseTemplate
        }))
      };
    }
    
    // Return language-specific commands
    return {
      available: commands.length > 0,
      language: language,
      isFallback: false,
      commands: commands.map(cmd => ({
        triggers: cmd.triggers,
        examples: cmd.examples || [],
        synonyms: cmd.synonyms || [],
        responseTemplate: cmd.responseTemplate
      }))
    };
  } catch (error) {
    console.error('Error getting voice commands:', error);
    return {
      available: false,
      error: 'Error retrieving voice commands'
    };
  }
};

/**
 * Get a quick summary of the service
 * @param {string} language - Language code for the summary
 * @returns {Object} Service summary
 */
ServiceSchema.methods.getServiceSummary = function(language = 'en') {
  try {
    const getFallbackText = (field) => {
      if (!field) return null;
      return field[language] || field.en || null;
    };
    
    return {
      id: this._id,
      name: getFallbackText(this.name),
      shortName: this.shortName,
      category: this.category,
      description: getFallbackText(this.description),
      department: getFallbackText(this.department.name),
      processingTime: {
        averageDays: this.processingTime.averageDays,
        description: getFallbackText(this.processingTime.description)
      },
      status: this.status,
      requirementCount: this.requirements.length,
      mandatoryRequirementCount: this.requirements.filter(r => r.isMandatory).length,
      eligibilityCriteriaCount: this.eligibilityCriteria.length,
      feeEstimate: this.fees.reduce((sum, fee) => sum + fee.amount, 0),
      currency: this.fees.length > 0 ? this.fees[0].currency : 'INR',
      serviceUrl: this.serviceUrl,
      voiceEnabled: this.voiceCommands.some(cmd => cmd.language === language || cmd.language === 'en')
    };
  } catch (error) {
    console.error('Error generating service summary:', error);
    return {
      id: this._id,
      name: this.name.en,
      error: 'Error generating service summary'
    };
  }
};

/**
 * Validate documents against requirements
 * @param {Array} documents - List of user submitted documents 
 * @returns {Object} Validation results
 */
ServiceSchema.methods.validateDocuments = function(documents) {
  if (!documents || !Array.isArray(documents)) {
    return {
      valid: false,
      message: 'No documents provided or invalid format',
      missingMandatory: this.requirements.filter(r => r.isMandatory).map(r => r.documentType)
    };
  }
  
  try {
    const result = {
      valid: true,
      validDocuments: [],
      invalidDocuments: [],
      missingMandatory: []
    };
    
    // Check for missing mandatory documents
    this.requirements.forEach(requirement => {
      if (requirement.isMandatory) {
        const found = documents.some(doc => doc.type === requirement.documentType);
        if (!found) {
          result.missingMandatory.push({
            type: requirement.documentType,
            name: requirement.name.en
          });
          result.valid = false;
        }
      }
    });
    
    // Validate submitted documents
    documents.forEach(document => {
      const requirement = this.requirements.find(r => r.documentType === document.type);
      
      // If this document type is not in requirements
      if (!requirement) {
        result.invalidDocuments.push({
          type: document.type,
          reason: 'Document type not required for this service'
        });
        return;
      }
      
      // Validate file type if specified
      if (requirement.allowedFileTypes && requirement.allowedFileTypes.length > 0) {
        const fileExtension = document.file.split('.').pop().toLowerCase();
        if (!requirement.allowedFileTypes.includes(fileExtension)) {
          result.invalidDocuments.push({
            type: document.type,
            reason: `Invalid file type. Allowed: ${requirement.allowedFileTypes.join(', ')}`
          });
          result.valid = false;
          return;
        }
      }
      
      // Validate file size if specified
      if (requirement.maxFileSizeKB && document.sizeKB > requirement.maxFileSizeKB) {
        result.invalidDocuments.push({
          type: document.type,
          reason: `File too large. Maximum size: ${requirement.maxFileSizeKB}KB`
        });
        result.valid = false;
        return;
      }
      
      // Add to valid documents
      result.validDocuments.push({
        type: document.type,
        name: requirement.name.en
      });
    });
    
    // Set result message
    if (result.valid) {
      result.message = 'All required documents validated successfully';
    } else if (result.missingMandatory.length > 0) {
      result.message = 'Missing mandatory documents';
    } else {
      result.message = 'Some documents failed validation';
    }
    
    return result;
  } catch (error) {
    console.error('Error validating documents:', error);
    return {
      valid: false,
      error: 'Error validating documents',
      message: 'An error occurred during document validation'
    };
  }
};

/**
 * Get service status update template
 * @param {string} status - Current status of the application
 * @param {string} language - Language code
 * @returns {Object} Status update template
 */
ServiceSchema.methods.getStatusUpdateTemplate = function(status, language = 'en') {
  try {
    const getFallbackText = (field) => {
      if (!field) return null;
      return field[language] || field.en || null;
    };
    
    // Define status templates for different application stages
    const statusTemplates = {
      pending: {
        title: 'Application Pending',
        message: `Your application for ${getFallbackText(this.name)} has been received and is pending review. Please check back for updates.`,
        nextSteps: 'Your application will be reviewed by our team. You will be notified when the status changes.',
        estimatedTime: `Estimated processing time: ${this.processingTime.minDays}-${this.processingTime.maxDays} days.`
      },
      reviewing: {
        title: 'Application Under Review',
        message: `Your application for ${getFallbackText(this.name)} is currently being reviewed by our team.`,
        nextSteps: 'Once the review is complete, you may be asked to provide additional documentation or information.',
        estimatedTime: `Estimated completion time for this stage: 2-3 working days.`
      },
      documentRequired: {
        title: 'Additional Documents Required',
        message: `Your application for ${getFallbackText(this.name)} requires additional documentation.`,
        nextSteps: 'Please submit the requested documents as soon as possible to avoid delays in processing.',
        estimatedTime: 'Your application will proceed once the required documents are received and verified.'
      },
      processing: {
        title: 'Application Processing',
        message: `Your application for ${getFallbackText(this.name)} has been approved and is now being processed.`,
        nextSteps: 'No further action is required from you at this time.',
        estimatedTime: `Estimated completion time: ${this.processingTime.averageDays} days.`
      },
      approved: {
        title: 'Application Approved',
        message: `Congratulations! Your application for ${getFallbackText(this.name)} has been approved.`,
        nextSteps: 'Please check your email for further instructions on how to proceed.',
        estimatedTime: 'You should receive all necessary documentation within 3-5 working days.'
      },
      rejected: {
        title: 'Application Rejected',
        message: `We regret to inform you that your application for ${getFallbackText(this.name)} has been rejected.`,
        nextSteps: 'Please check your email for detailed information on the reason for rejection and the appeal process if applicable.',
        estimatedTime: 'You may reapply after addressing the issues mentioned in the rejection notice.'
      },
      completed: {
        title: 'Application Completed',
        message: `Your application for ${getFallbackText(this.name)} has been successfully completed.`,
        nextSteps: 'No further action is required. You may download or view your certificate/document from your profile.',
        estimatedTime: ''
      },
      hold: {
        title: 'Application On Hold',
        message: `Your application for ${getFallbackText(this.name)} has been placed on hold.`,
        nextSteps: 'Please check your email for information about why your application is on hold and what actions you need to take.',
        estimatedTime: 'Your application will remain on hold until the specified issues are resolved.'
      }
    };
    
    // If no status provided or invalid status, return general info
    if (!status || !statusTemplates[status]) {
      return {
        valid: false,
        service: getFallbackText(this.name),
        message: `Status template for '${status}' not available. Please check the application status directly.`,
        availableStatuses: Object.keys(statusTemplates)
      };
    }
    
    // Return the appropriate status template
    return {
      valid: true,
      service: getFallbackText(this.name),
      serviceId: this._id,
      status,
      ...statusTemplates[status],
      department: getFallbackText(this.department.name),
      contactEmail: this.department.contactEmail,
      contactPhone: this.department.contactPhone,
      helpUrl: this.helpUrl
    };
  } catch (error) {
    console.error('Error generating status update template:', error);
    return {
      valid: false,
      service: this.name.en,
      message: 'Error generating status update template',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }
};

/**
 * Generate search keywords for this service
 * @returns {Array} Array of keywords for search optimization
 */
ServiceSchema.methods.generateSearchKeywords = function() {
  try {
    // Collect all text fields that could be relevant for search
    const keywords = new Set();
    
    // Add name variants
    Object.values(this.name).forEach(name => {
      if (name) {
        // Add full name
        keywords.add(name.toLowerCase());
        
        // Add individual words from name
        name.split(/\s+/).forEach(word => {
          if (word.length > 2) { // Skip very short words
            keywords.add(word.toLowerCase());
          }
        });
      }
    });
    
    // Add shortName
    keywords.add(this.shortName.toLowerCase());
    
    // Add category and subcategory
    keywords.add(this.category.toLowerCase());
    if (this.subCategory) {
      keywords.add(this.subCategory.toLowerCase());
    }
    
    // Add department name variants
    Object.values(this.department.name).forEach(name => {
      if (name) {
        keywords.add(name.toLowerCase());
      }
    });
    
    // Add document types
    this.requirements.forEach(req => {
      keywords.add(req.documentType.toLowerCase());
      if (req.name.en) {
        keywords.add(req.name.en.toLowerCase());
      }
    });
    
    // Add voice command triggers
    this.voiceCommands.forEach(cmd => {
      cmd.triggers.forEach(trigger => {
        keywords.add(trigger.toLowerCase());
      });
      if (cmd.synonyms) {
        cmd.synonyms.forEach(synonym => {
          keywords.add(synonym.toLowerCase());
        });
      }
    });
    
    return Array.from(keywords);
  } catch (error) {
    console.error('Error generating search keywords:', error);
    return [];
  }
};

// Virtual for service's full URL
ServiceSchema.virtual('url').get(function() {
  return `/api/services/${this._id}`;
});

// Virtual for user applications count
ServiceSchema.virtual('applicationsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'serviceHistory.serviceId',
  count: true
});

// Virtual for active applications count
ServiceSchema.virtual('activeApplicationsCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'serviceHistory.serviceId',
  count: true,
  match: { 'serviceHistory.status': { $in: ['pending', 'processing', 'reviewing'] } }
});

// Pre-save hook to ensure proper formatting and defaults
ServiceSchema.pre('save', function(next) {
  // Ensure shortName is properly formatted
  this.shortName = this.shortName.trim().replace(/\s+/g, '_').toLowerCase();
  
  // Sort process steps by step number
  if (this.processSteps && this.processSteps.length > 1) {
    this.processSteps.sort((a, b) => a.stepNumber - b.stepNumber);
  }
  
  // Ensure all requirements have proper validationRules
  if (this.requirements) {
    this.requirements.forEach(req => {
      if (!req.validationRules) {
        req.validationRules = 'none';
      }
    });
  }
  
  next();
});

// Create text indexes for search optimization
ServiceSchema.index({ 
  'name.en': 'text', 
  'name.hi': 'text',
  'description.en': 'text', 
  'description.hi': 'text',
  shortName: 'text',
  category: 'text',
  subCategory: 'text',
  'department.name.en': 'text'
}, {
  weights: {
    'name.en': 10,
    'name.hi': 10,
    shortName: 8,
    category: 5,
    'description.en': 3,
    'description.hi': 3,
    subCategory: 2,
    'department.name.en': 1
  },
  name: 'service_text_search'
});

// Other useful indexes for frequent queries
ServiceSchema.index({ category: 1, status: 1 });
ServiceSchema.index({ 'department.name.en': 1 });
ServiceSchema.index({ 'requirements.documentType': 1 });
ServiceSchema.index({ shortName: 1 }, { unique: true });
ServiceSchema.index({ status: 1 });
ServiceSchema.index({ provider: 1, stateSpecific: 1, applicableStates: 1 });
ServiceSchema.index({ createdAt: -1 });
ServiceSchema.index({ priority: -1, category: 1 });

module.exports = mongoose.model('Service', ServiceSchema);
