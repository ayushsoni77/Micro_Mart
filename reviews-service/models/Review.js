import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    index: true,
    comment: 'Reference to the product in product-service (MongoDB ObjectId)'
  },
  userId: {
    type: Number,
    required: true,
    index: true,
    comment: 'User ID who wrote the review'
  },
  userName: {
    type: String,
    required: true,
    maxlength: 100,
    comment: 'Name of the user who wrote the review'
  },
  userEmail: {
    type: String,
    required: false,
    maxlength: 255,
    comment: 'Email of the user (optional)'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    comment: 'Rating from 1 to 5 stars'
  },
  title: {
    type: String,
    required: false,
    maxlength: 200,
    comment: 'Review title/headline'
  },
  comment: {
    type: String,
    required: true,
    maxlength: 2000,
    comment: 'Review comment/content'
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Number of helpful votes'
  },
  notHelpful: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Number of not helpful votes'
  },
  votes: [{
    userId: {
      type: Number,
      required: true,
      comment: 'User ID who voted'
    },
    helpful: {
      type: Boolean,
      required: true,
      comment: 'Whether the vote was helpful (true) or not helpful (false)'
    },
    votedAt: {
      type: Date,
      default: Date.now,
      comment: 'When the vote was cast'
    }
  }],
  verifiedPurchase: {
    type: Boolean,
    default: false,
    comment: 'Whether the review is from a verified purchase'
  },
  orderId: {
    type: Number,
    required: false,
    comment: 'Order ID if this is a verified purchase review'
  },
  images: [{
    type: String,
    maxlength: 500,
    comment: 'URLs to review images'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'approved',
    comment: 'Review moderation status'
  },
  flaggedCount: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Number of times this review has been flagged'
  },
  flaggedBy: [{
    userId: {
      type: Number,
      required: true,
      comment: 'User ID who flagged the review'
    },
    reason: {
      type: String,
      required: true,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other'],
      comment: 'Reason for flagging'
    },
    flaggedAt: {
      type: Date,
      default: Date.now,
      comment: 'When the review was flagged'
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    comment: 'Additional metadata for the review'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ verifiedPurchase: 1 });
reviewSchema.index({ helpful: -1 });

// Virtual for total votes
reviewSchema.virtual('totalVotes').get(function() {
  return this.helpful + this.notHelpful;
});

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (this.totalVotes === 0) return 0;
  return Math.round((this.helpful / this.totalVotes) * 100);
});

// Virtual for time since creation
reviewSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
});

// Pre-save middleware to ensure unique user review per product
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingReview = await this.constructor.findOne({
      userId: this.userId,
      productId: this.productId
    });
    
    if (existingReview) {
      const error = new Error('User has already reviewed this product');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

// Static methods
reviewSchema.statics.findByProduct = function(productId, options = {}) {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', rating, verified } = options;
  const skip = (page - 1) * limit;
  
  let query = { productId, status: 'approved' };
  if (rating) query.rating = rating;
  if (verified !== undefined) query.verifiedPurchase = verified;
  
  const sortOrder = order === 'desc' ? -1 : 1;
  const sortField = sort === 'helpful' ? 'helpful' : 'createdAt';
  
  return this.find(query)
    .sort({ [sortField]: sortOrder })
    .limit(limit)
    .skip(skip)
    .lean();
};

reviewSchema.statics.getProductStats = function(productId) {
  return this.aggregate([
    { $match: { productId, status: 'approved' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        verifiedReviews: { $sum: { $cond: ['$verifiedPurchase', 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        verifiedReviews: 1,
        ratingDistribution: {
          '1': '$rating1',
          '2': '$rating2',
          '3': '$rating3',
          '4': '$rating4',
          '5': '$rating5'
        }
      }
    }
  ]);
};

reviewSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ userId, status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Instance methods
reviewSchema.methods.addVote = async function(userId, helpful) {
  // Check if user already voted
  const existingVoteIndex = this.votes.findIndex(vote => vote.userId === userId);
  
  if (existingVoteIndex !== -1) {
    // Update existing vote
    const existingVote = this.votes[existingVoteIndex];
    if (existingVote.helpful === helpful) {
      // Remove vote if same type
      this.votes.splice(existingVoteIndex, 1);
      if (helpful) {
        this.helpful = Math.max(0, this.helpful - 1);
      } else {
        this.notHelpful = Math.max(0, this.notHelpful - 1);
      }
    } else {
      // Change vote type
      existingVote.helpful = helpful;
      existingVote.votedAt = new Date();
      if (helpful) {
        this.helpful += 1;
        this.notHelpful = Math.max(0, this.notHelpful - 1);
      } else {
        this.notHelpful += 1;
        this.helpful = Math.max(0, this.helpful - 1);
      }
    }
  } else {
    // Add new vote
    this.votes.push({ userId, helpful, votedAt: new Date() });
    if (helpful) {
      this.helpful += 1;
    } else {
      this.notHelpful += 1;
    }
  }
  
  return this.save();
};

reviewSchema.methods.flag = async function(userId, reason) {
  // Check if user already flagged
  const existingFlag = this.flaggedBy.find(flag => flag.userId === userId);
  
  if (!existingFlag) {
    this.flaggedBy.push({ userId, reason, flaggedAt: new Date() });
    this.flaggedCount += 1;
    
    // Auto-flag if too many flags
    if (this.flaggedCount >= 3) {
      this.status = 'flagged';
    }
    
    return this.save();
  }
  
  return this;
};

const Review = mongoose.model('Review', reviewSchema);
export default Review; 