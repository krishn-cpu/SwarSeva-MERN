const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * User Schema
 * Defines the structure for user documents in MongoDB
 */
const UserSchema = new mongoose.Schema({
  // Basic user information
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in query results by default
  },
  
  // Authentication fields
  role: {
    type: String,
    enum: {
      values: ['user', 'serviceProvider', 'admin', 'superAdmin'],
      message: 'Role must be one of: user, serviceProvider, admin, superAdmin'
    },
    default: 'user'
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending', 'suspended', 'deleted'],
      message: 'Status must be one of: active, inactive, pending, suspended, deleted'
    },
    default: 'pending'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Security and password reset fields
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  tokenVersion: {
    type: Number,
    default: 0 // Incremented when tokens need to be invalidated
  },
  
  // Profile information
  phone: {
    type: String,
    match: [
      /^(\+\d{1,3}[- ]?)?\d{10}$/,
      'Please provide a valid phone number'
    ]
  },
  language: {
    type: String,
    enum: {
      values: ['en', 'hi', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'bn', 'ml', 'or', 'as'],
      message: 'Please select a supported language'
    },
    default: 'en'
  },
  voicePreferences: {
    speechRate: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    pitch: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    voiceGender: {
      type: String,
      enum: ['male', 'female', 'neutral'],
      default: 'neutral'
    },
    enableVoiceAuth: {
      type: Boolean,
      default: false
    },
    voicePrint: {
      type: String,
      select: false // Don't return voice print in queries for security
    }
  },
  voiceInteractions: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    query: String,
    intent: String,
    service: String,
    successful: Boolean,
    language: {
      type: String,
      enum: {
        values: ['en', 'hi', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'bn', 'ml', 'or', 'as'],
        message: 'Please select a supported language'
      },
      default: 'en'
    },
    city: String,
    state: String,
    zipCode: String,
    district: String,
    village: String,
    country: {
      type: String,
      default: 'India'
    }
  }],
  
  // Additional information for service providers
  serviceProvider: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationDocuments: [String],
    services: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    reviews: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    }]
  },
  
  // User preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      enum: {
        values: ['en', 'hi', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'bn', 'ml', 'or', 'as'],
        message: 'Please select a supported language'
      },
      default: 'en'
    }
  },
  
  // Audit information
  lastLogin: Date,
  lastActive: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
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
  timestamps: true, // Automatically add createdAt and updatedAt fields
  toJSON: { virtuals: true }, // Include virtual properties when converted to JSON
  toObject: { virtuals: true } // Include virtual properties when converted to object
});

// Virtual property for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual property to get user age if birthdate is present
UserSchema.virtual('age').get(function() {
  if (!this.birthdate) return null;
  const today = new Date();
  const birthdate = new Date(this.birthdate);
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
});

// Index for email search
UserSchema.index({ email: 1 });

// Index for combined queries
UserSchema.index({ role: 1, status: 1 });

// Compound index for search optimization
UserSchema.index({ 'address.city': 1, 'address.state': 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate a salt with cost factor of 12
    const salt = await bcrypt.genSalt(12);
    // Hash the password using the salt
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt if not a new document
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to ensure token works
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and return a JWT
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role,
      tokenVersion: this.tokenVersion
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRE || '30d'
    }
  );
};

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set token expiry (10 minutes)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  // Return unhashed token to be sent via email
  return resetToken;
};

// Generate email verification token
UserSchema.methods.generateEmailVerificationToken = function() {
  // Generate random token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set token expiry (24 hours)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // Return unhashed token to be sent via email
  return verificationToken;
};

// Check if token was issued after password change
UserSchema.methods.changedPasswordAfterToken = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  
  // Token issued before password change
  return false;
};

// Increment token version to invalidate existing tokens
UserSchema.methods.invalidateTokens = async function() {
  this.tokenVersion += 1;
  return this.save({ validateBeforeSave: false });
};

// Track login attempts and handle account locking
UserSchema.methods.incrementLoginAttempts = async function() {
  // If account is already locked, no need to increment
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return;
  }
  
  // Increment login attempts
  this.loginAttempts += 1;
  
  // Lock account if attempts exceed 5
  if (this.loginAttempts >= 5) {
    // Lock for 1 hour
    this.lockUntil = Date.now() + 60 * 60 * 1000; 
  }
  
  return this.save({ validateBeforeSave: false });
};

// Reset login attempts on successful login
UserSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = Date.now();
  
  return this.save({ validateBeforeSave: false });
};

// Update last active timestamp
UserSchema.methods.updateLastActive = async function() {
  this.lastActive = Date.now();
  return this.save({ validateBeforeSave: false });
};

// Set user to active status
UserSchema.methods.activateAccount = async function() {
  this.status = 'active';
  return this.save();
};

// Set user to inactive status
UserSchema.methods.deactivateAccount = async function() {
  this.status = 'inactive';
  return this.save();
};

// Check if account is locked
UserSchema.methods.isLocked = function() {
  // Check if account is locked and lock time hasn't expired
  return this.lockUntil && this.lockUntil > Date.now();
};

// Convenient method to check if user has admin privileges
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'superAdmin';
};

/**
 * Method to add voice interaction to history
 * Tracks user voice interactions for analysis and improvement
 * 
 * @param {Object} interaction - Voice interaction details
 * @param {String} interaction.query - The voice query text
 * @param {String} interaction.intent - Identified intent of the query
 * @param {String} interaction.service - Service requested or used
 * @param {Boolean} interaction.successful - Whether interaction was successful
 * @param {String} interaction.language - Language used in the interaction
 * @returns {Promise} - Promise resolving to the saved user document
 */
UserSchema.methods.addVoiceInteraction = async function(interaction) {
  this.voiceInteractions.push({
    query: interaction.query,
    intent: interaction.intent,
    service: interaction.service,
    successful: interaction.successful,
    language: interaction.language || this.language
  });
  
  // Keep only the last 50 interactions to prevent document growth
  if (this.voiceInteractions.length > 50) {
    this.voiceInteractions = this.voiceInteractions.slice(-50);
  }
  
  return this.save({ validateBeforeSave: false });
};

/**
 * Method to verify voice print for voice authentication
 * 
 * @param {String} submittedVoicePrint - Voice print to verify against stored voice print
 * @returns {Boolean} True if voice print matches, false otherwise
 */
UserSchema.methods.verifyVoicePrint = function(submittedVoicePrint) {
  // This would integrate with a voice authentication service
  // For now, we'll just return a placeholder implementation
  if (!this.voicePreferences || !this.voicePreferences.voicePrint) {
    return false;
  }
  
  // In a real implementation, we would compare voice prints using 
  // specialized voice biometric algorithms or services
  return submittedVoicePrint === this.voicePreferences.voicePrint;
};

/**
 * Get sanitized user profile for sending to client
 * Removes sensitive data like password, tokens, etc.
 * 
 * @returns {Object} - Sanitized user object
 */
UserSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Remove sensitive information
  delete userObject.password;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  
  // Remove other sensitive fields
  if (userObject.voicePreferences) {
    delete userObject.voicePreferences.voicePrint;
  }
  
  return userObject;
};

// Create User model from schema
const User = mongoose.model('User', UserSchema);

module.exports = User;
