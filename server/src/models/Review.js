const mongoose = require('mongoose');

/**
 * Review Schema
 * Represents user reviews and feedback for government services
 */
const ReviewSchema = new mongoose.Schema({
  // User who submitted the review
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  // Service being reviewed
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service reference is required']
  },
  
  // Application ID if the review is for a specific service application
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  
  // Star rating (1-5)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  
  // Review comment with multilingual support
  comment: {
    en: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    hi: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    mr: { type: String, trim: true, maxlength: 1000 },
    gu: { type: String, trim: true, maxlength: 1000 },
    pa: { type: String, trim: true, maxlength: 1000 },
    ta: { type: String, trim: true, maxlength: 1000 },
    te: { type: String, trim: true, maxlength: 1000 },
    kn: { type: String, trim: true, maxlength: 1000 },
    bn: { type: String, trim: true, maxlength: 1000 },
    ml: { type: String, trim: true, maxlength: 1000 },
    or: { type: String, trim: true, maxlength: 1000 },
    as: { type: String, trim: true, maxlength: 1000 }
  },
  
  // Primary language of the review
  language: {
    type: String,
    required: [true, 'Review language is required'],
    enum: {
      values: ['en', 'hi', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'bn', 'ml', 'or', 'as'],
      message: 'Please select a supported language'
    },
    default: 'en'
  },
  
  // Title for the review (optional)
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  // Voice feedback data
  voiceFeedback: {
    // Whether this review was submitted via voice interface
    isVoiceSubmitted: {
      type: Boolean,
      default: false
    },
    
    // URL to voice recording if available
    recordingUrl: String,
    
    // Transcript of voice feedback
    transcript: String,
    
    // Confidence score of voice recognition (0-1)
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    
    // Voice characteristics for verification
    voiceCharacteristics: {
      pitch: Number,
      tone: String,
      speed: Number
    }
  },
  
  // Specific aspects of the service being rated
  aspectRatings: {
    ease: {
      type: Number,
      min: 1,
      max: 5
    },
    speed: {
      type: Number,
      min: 1,
      max: 5
    },
    staff: {
      type: Number,
      min: 1,
      max: 5
    },
    clarity: {
      type: Number,
      min: 1,
      max: 5
    },
    outcome: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Automated sentiment analysis (can be updated by background job)
  sentiment: {
    // Overall sentiment score (-1 to 1)
    score: {
      type: Number,
      min: -1,
      max: 1
    },
    
    // Categorized sentiment
    category: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed']
    },
    
    // Detailed sentiment analysis results
    details: {
      // Key aspects mentioned in the review
      aspects: [{
        name: String,
        score: Number
      }],
      
      // Key entities mentioned
      entities: [{
        name: String,
        type: String,
        score: Number
      }],
      
      // Key phrases extracted
      keyPhrases: [String]
    },
    
    // Language used for sentiment analysis
    analysisLanguage: {
      type: String,
      enum: ['en', 'hi', 'mr', 'gu', 'pa', 'ta', 'te', 'kn', 'bn', 'ml', 'or', 'as']
    },
    
    // When sentiment analysis was last updated
    lastUpdated: Date
  },
  
  // Helpfulness votes from other users
  helpfulness: {
    upvotes: {
      type: Number,
      default: 0
    },
    downvotes: {
      type: Number,
      default: 0
    },
    // List of user IDs who have voted
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['up', 'down']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Official response to the review
  response: {
    text: {
      en: { type: String },
      hi: { type: String }
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'responded', 'escalated', 'resolved'],
      default: 'pending'
    }
  },
  
  // Status of the review
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected', 'flagged', 'removed'],
      message: 'Invalid review status'
    },
    default: 'pending'
  },
  
  // Reason if review was rejected or flagged
  moderationNotes: String,
  
  // Whether the review was verified (user actually used the service)
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Location where service was accessed
  location: {
    city: String,
    state: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Device information
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'kiosk', 'other']
    },
    browser: String,
    os: String
  },
  
  // Tags for categorizing feedback
  tags: [String],
  
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
ReviewSchema.index({ service: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ language: 1 });
ReviewSchema.index({ 'sentiment.category': 1 });
ReviewSchema.index({ isVerified: 1 });
ReviewSchema.index({ 'response.status': 1 });
ReviewSchema.index({ service: 1, rating: 1 });

// Virtual for checking if review has response
ReviewSchema.virtual('hasResponse').get(function() {
  return this.response && (this.response.text.en || this.response.text.hi) && this.response.respondedAt;
});

/**
 * Calculate average rating for a service
 * @param {ObjectId} serviceId - ID of the service to calculate rating for
 * @returns {Promise<Object>} - Object containing average rating and count
 */
ReviewSchema.statics.calculateServiceRating = async function(serviceId) {
  try {
    const result = await this.aggregate([
      { $match: { service: mongoose.Types.ObjectId(serviceId), status: 'approved' } },
      {
        $group: {
          _id: '$service',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          // Group ratings by stars (1-5)
          ratingBreakdown: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (result.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        }
      };
    }

    // Calculate distribution of ratings
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };

    result[0].ratingBreakdown.forEach(rating => {
      ratingDistribution[rating]++;
    });

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal place
      totalRatings: result[0].totalRatings,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error calculating service rating:', error);
    throw new Error('Failed to calculate service rating');
  }
};

/**
 * Perform sentiment analysis on review text
 * This method would typically call an external API or use a library
 * for accurate sentiment analysis, but here we implement a simple placeholder
 * @param {String} language - Language of the text to analyze
 * @returns {Promise<Object>} - Sentiment analysis result
 */
ReviewSchema.methods.analyzeSentiment = async function(language = null) {
  try {
    // Use the review's language if not specified
    const lang = language || this.language || 'en';
    
    // Get the text in the correct language
    const text = this.comment[lang] || this.comment.en;
    
    if (!text) {
      throw new Error('No text available for sentiment analysis');
    }
    
    // In a real implementation, we would call an NLP service here
    // For this example, we'll use a very simple algorithm
    
    // Define some positive and negative words (for demo purposes only)
    const positiveWords = {
      en: ['good', 'great', 'excellent', 'awesome', 'wonderful', 'fantastic', 'helpful', 'easy', 'convenient', 'satisfied'],
      hi: ['अच्छा', 'बहुत अच्छा', 'उत्कृष्ट', 'बढ़िया', 'सहायक', 'आसान', 'संतुष्ट']
    };
    
    const negativeWords = {
      en: ['bad', 'poor', 'terrible', 'awful', 'horrible', 'difficult', 'complicated', 'unhelpful', 'dissatisfied', 'waste'],
      hi: ['बुरा', 'ख़राब', 'भयानक', 'मुश्किल', 'जटिल', 'असंतुष्ट', 'बेकार']
    };
    
    // Get word lists for the requested language, fallback to English
    const posWords = positiveWords[lang] || positiveWords.en;
    const negWords = negativeWords[lang] || negativeWords.en;
    
    // Simple word counting
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (posWords.some(posWord => word.includes(posWord))) {
        positiveCount++;
      }
      if (negWords.some(negWord => word.includes(negWord))) {
        negativeCount++;
      }
    });
    
    // Calculate a simple sentiment score between -1 and 1
    const totalSentimentWords = positiveCount + negativeCount;
    
    let score = 0;
    if (totalSentimentWords > 0) {
      score = (positiveCount - negativeCount) / totalSentimentWords;
    }
    
    // Determine sentiment category
    let category;
    if (score > 0.25) {
      category = 'positive';
    } else if (score < -0.25) {
      category = 'negative';
    } else {
      category = 'neutral';
    }
    
    // Extract some key phrases (very simplistic approach)
    const keyPhrases = [];
    for (let i = 0; i < words.length; i++) {
      if (i + 2 < words.length) {
        if ((posWords.includes(words[i]) || negWords.includes(words[i])) && 
            words[i+1].length > 2 && words[i+2].length > 2) {
          keyPhrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
        }
      }
    }
    
    // Update the sentiment field in the document
    this.sentiment = {
      score,
      category,
      details: {
        aspects: [
          { name: 'service', score: score }
        ],
        entities: [],
        keyPhrases: keyPhrases.slice(0, 5) // Keep only the first 5 phrases
      },
      analysisLanguage: lang,
      lastUpdated: new Date()
    };
    
    // Save the document with updated sentiment analysis
    await this.save();
    
    return this.sentiment;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw new Error('Failed to analyze sentiment');
  }
};

/**
 * Add or update response to a review
 * @param {Object} responseData - The response data
 * @param {Object} responseData.text - Response text in different languages
 * @param {ObjectId} responseData.respondedBy - User ID who responded
 * @param {String} responseData.status - Response status
 * @returns {Promise<Review>} - Updated review document
 */
ReviewSchema.methods.addResponse = async function(responseData) {
  this.response = {
    text: {
      en: responseData.text.en || this.response?.text?.en,
      hi: responseData.text.hi || this.response?.text?.hi
    },
    respondedBy: responseData.respondedBy,
    respondedAt: new Date(),
    status: responseData.status || 'responded'
  };
  
  return this.save();
};

/**
 * Add a helpfulness vote to the review
 * @param {ObjectId} userId - ID of the user voting
 * @param {String} voteType - Type of vote ('up' or 'down')
 * @returns {Promise<Review>} - Updated review document
 */
ReviewSchema.methods.addVote = async function(userId, voteType) {
  if (!['up', 'down'].includes(voteType)) {
    throw new Error("Vote type must be 'up' or 'down'");
  }
  
  // Check if user has already voted
  const existingVoteIndex = this.helpfulness.voters.findIndex(
    voter => voter.user.toString() === userId.toString()
  );
  
  if (existingVoteIndex !== -1) {
    // User has already voted, update their vote if different
    const existingVote = this.helpfulness.voters[existingVoteIndex];
    
    if (existingVote.vote === voteType) {
      // Same vote, no change needed
      return this;
    }
    
    // Remove the old vote count
    if (existingVote.vote === 'up') {
      this.helpfulness.upvotes = Math.max(0, this.helpfulness.upvotes - 1);
    } else {
      this.helpfulness.downvotes = Math.max(0, this.helpfulness.downvotes - 1);
    }
    
    // Update to new vote
    this.helpfulness.voters[existingVoteIndex] = {
      user: userId,
      vote: voteType,
      timestamp: new Date()
    };
  } else {
    // New vote
    this.helpfulness.voters.push({
      user: userId,
      vote: voteType,
      timestamp: new Date()
    });
  }
  
  // Update vote counts
  this.helpfulness.upvotes = this.helpfulness.voters.filter(v => v.vote === 'up').length;
  this.helpfulness.downvotes = this.helpfulness.voters.filter(v => v.vote === 'down').length;
  
  return this.save();
};

/**
 * Remove a user's vote from the review
 * @param {ObjectId} userId - ID of the user whose vote to remove
 * @returns {Promise<Review>} - Updated review document
 */
ReviewSchema.methods.removeVote = async function(userId) {
  // Find the user's vote
  const voterIndex = this.helpfulness.voters.findIndex(
    voter => voter.user.toString() === userId.toString()
  );
  
  if (voterIndex === -1) {
    // User hasn't voted, no action needed
    return this;
  }
  
  // Get the vote type to update count
  const voteType = this.helpfulness.voters[voterIndex].vote;
  
  // Remove the vote
  this.helpfulness.voters.splice(voterIndex, 1);
  
  // Update vote counts
  this.helpfulness.upvotes = this.helpfulness.voters.filter(v => v.vote === 'up').length;
  this.helpfulness.downvotes = this.helpfulness.voters.filter(v => v.vote === 'down').length;
  
  return this.save();
};

/**
 * Update the status of a review
 * @param {String} newStatus - New status for the review
 * @param {String} [notes] - Optional moderation notes for status change
 * @param {ObjectId} [moderator] - User ID of the moderator making the change
 * @returns {Promise<Review>} - Updated review document
 */
ReviewSchema.methods.updateStatus = async function(newStatus, notes, moderator) {
  // Validate the status
  if (!['pending', 'approved', 'rejected', 'flagged', 'removed'].includes(newStatus)) {
    throw new Error("Invalid status value");
  }
  
  this.status = newStatus;
  
  if (notes) {
    this.moderationNotes = notes;
  }
  
  // Add metadata about the status change
  if (!this.metadata) {
    this.metadata = new Map();
  }
  
  this.metadata.set('statusHistory', [
    ...(this.metadata.get('statusHistory') || []),
    {
      from: this.status,
      to: newStatus,
      timestamp: new Date(),
      moderator: moderator || null,
      notes: notes || null
    }
  ]);
  
  // If the review is being approved, trigger sentiment analysis if not already done
  if (newStatus === 'approved' && (!this.sentiment || !this.sentiment.score)) {
    await this.analyzeSentiment();
  }
  
  return this.save();
};

/**
 * Check if a user is eligible to review a service
 * @param {ObjectId} userId - User ID
 * @param {ObjectId} serviceId - Service ID
 * @returns {Promise<Object>} - Eligibility result
 */
ReviewSchema.statics.checkReviewEligibility = async function(userId, serviceId) {
  try {
    // Check if the user has already reviewed this service
    const existingReview = await this.findOne({
      user: userId,
      service: serviceId,
      status: { $nin: ['rejected', 'removed'] }
    });
    
    if (existingReview) {
      return {
        eligible: false,
        reason: 'already_reviewed',
        message: 'You have already reviewed this service',
        existingReview: existingReview._id
      };
    }
    
    // In a real app, you would also check if the user has actually used the service
    // This would usually involve checking an applications or transactions collection
    
    // For this example, we'll assume the user has used the service if there's a matching
    // application entry (in a real app, you would also check application status)
    const Application = mongoose.model('Application', {}); // Just for reference, not actually defined
    
    // Check if the Application model exists before trying to use it
    if (mongoose.modelNames().includes('Application')) {
      const userApplication = await Application.findOne({
        user: userId,
        service: serviceId,
        status: 'completed'
      });
      
      if (!userApplication) {
        return {
          eligible: false,
          reason: 'service_not_used',
          message: 'You need to use this service before reviewing it'
        };
      }
    }
    
    // All checks passed
    return {
      eligible: true,
      message: 'You can review this service'
    };
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return {
      eligible: false,
      reason: 'error',
      message: 'Error checking eligibility'
    };
  }
};

/**
 * Get a summary of the review
 * @param {String} [language='en'] - Language for the summary
 * @returns {Object} - Review summary
 */
ReviewSchema.methods.getSummary = function(language = 'en') {
  const preferredLanguage = language || this.language || 'en';
  const fallbackLanguage = 'en';
  
  // Function to get text in preferred language with fallback
  const getText = (field) => {
    if (!field) return null;
    return field[preferredLanguage] || field[fallbackLanguage] || null;
  };
  
  return {
    id: this._id,
    rating: this.rating,
    title: this.title,
    comment: getText(this.comment),
    user: this.user,
    service: this.service,
    createdAt: this.createdAt,
    status: this.status,
    isVerified: this.isVerified,
    helpfulness: {
      upvotes: this.helpfulness.upvotes,
      downvotes: this.helpfulness.downvotes,
      score: this.helpfulness.upvotes - this.helpfulness.downvotes
    },
    hasResponse: this.hasResponse,
    responseText: this.hasResponse ? getText(this.response.text) : null,
    sentiment: this.sentiment ? this.sentiment.category : null,
    aspectRatings: this.aspectRatings || {}
  };
};

/**
 * Find helpful reviews for a service
 * @param {ObjectId} serviceId - Service ID
 * @param {Number} limit - Maximum number of reviews to return
 * @returns {Promise<Array>} - Array of helpful reviews
 */
ReviewSchema.statics.findHelpfulReviews = async function(serviceId, limit = 5) {
  return this.find({
    service: serviceId,
    status: 'approved'
  })
  .sort({ 'helpfulness.upvotes': -1 })
  .limit(limit)
  .populate('user', 'name avatar')
  .exec();
};

/**
 * Find recent reviews for a service
 * @param {ObjectId} serviceId - Service ID
 * @param {Number} limit - Maximum number of reviews to return
 * @returns {Promise<Array>} - Array of recent reviews
 */
ReviewSchema.statics.findRecentReviews = async function(serviceId, limit = 10) {
  return this.find({
    service: serviceId,
    status: 'approved'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('user', 'name avatar')
  .exec();
};

/**
 * Find critical reviews for a service
 * @param {ObjectId} serviceId - Service ID
 * @param {Number} limit - Maximum number of reviews to return
 * @returns {Promise<Array>} - Array of critical reviews
 */
ReviewSchema.statics.findCriticalReviews = async function(serviceId, limit = 5) {
  return this.find({
    service: serviceId,
    status: 'approved',
    rating: { $lte: 2 }
  })
  .sort({ rating: 1, 'helpfulness.upvotes': -1 })
  .limit(limit)
  .populate('user', 'name avatar')
  .exec();
};

// Create the Review model
const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;

