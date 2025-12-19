import Review from '../models/Review.js';
import axios from 'axios';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003/api/orders';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002/api/products';

export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, title } = req.body;
    const userId = req.user.userId;
    const userName = req.user.name || 'Anonymous User';
    const userEmail = req.user.email;

    console.log(`⭐ Creating review for product ${productId} by user ${userId}`);

    // Validate required fields
    if (!productId || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Product ID, rating, and comment are required' 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: productId,
      userId: userId
    });

    if (existingReview) {
      return res.status(400).json({ 
        message: 'You have already reviewed this product' 
      });
    }

    // Verify product exists
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/${productId}`);
    } catch (err) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased this product (for verified purchase badge)
    let verifiedPurchase = false;
    let orderId = null;
    try {
      const response = await axios.get(`${ORDER_SERVICE_URL}`, {
        headers: { Authorization: req.headers.authorization },
      });
      const userOrders = response.data.orders || [];
      for (const order of userOrders) {
        if (order.items && order.items.some(item => item.productId === productId)) {
          verifiedPurchase = true;
          orderId = order.id;
          break;
        }
      }
    } catch (err) {
      console.log('⚠️ Could not verify purchase:', err.message);
      // Continue without verified purchase check
    }

    // Create review in database
    const review = await Review.create({
      productId,
      userId,
      userName,
      userEmail,
      rating: parseInt(rating),
      title,
      comment,
      verifiedPurchase,
      orderId,
      status: 'approved'
    });

    console.log(`✅ Review created successfully:`, {
      id: review._id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      verifiedPurchase: review.verifiedPurchase
    });

    res.status(201).json({ 
      message: 'Review created successfully', 
      review 
    });
  } catch (error) {
    console.error(`❌ Create review error:`, error.message);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', rating, verified } = req.query;
    
    console.log(`⭐ Getting reviews for product: ${productId}`);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      order,
      rating: rating ? parseInt(rating) : undefined,
      verified: verified === 'true'
    };

    const reviews = await Review.findByProduct(productId, options);
    const totalCount = await Review.countDocuments({ productId, status: 'approved' });

    res.json({ 
      reviews,
      pagination: {
        page: options.page,
        limit: options.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / options.limit)
      }
    });
  } catch (error) {
    console.error(`❌ Get reviews error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getReviewStats = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(`⭐ Getting review stats for product: ${productId}`);

    const stats = await Review.getProductStats(productId);
    const result = stats[0] || {
      totalReviews: 0,
      averageRating: 0,
      verifiedReviews: 0,
      ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    };

    res.json({ stats: result });
  } catch (error) {
    console.error(`❌ Get review stats error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateReviewHelpfulness = async (req, res) => {
  try {
    const { id } = req.params;
    const { helpful } = req.body;
    const userId = req.user.userId;

    console.log(`⭐ Updating review helpfulness: ${id}, helpful: ${helpful}`);

    if (typeof helpful !== 'boolean') {
      return res.status(400).json({ message: 'Helpful must be a boolean value' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.addVote(userId, helpful);

    res.json({ 
      message: 'Review helpfulness updated successfully', 
      review: {
        id: review._id,
        helpful: review.helpful,
        notHelpful: review.notHelpful,
        totalVotes: review.totalVotes,
        helpfulPercentage: review.helpfulPercentage
      }
    });
  } catch (error) {
    console.error(`❌ Update review helpfulness error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    
    console.log(`⭐ Getting reviews for user: ${userId}`);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const reviews = await Review.findByUser(userId, options);
    const totalCount = await Review.countDocuments({ userId, status: 'approved' });

    res.json({ 
      reviews,
      pagination: {
        page: options.page,
        limit: options.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / options.limit)
      }
    });
  } catch (error) {
    console.error(`❌ Get user reviews error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    console.log(`⭐ Flagging review: ${id}, reason: ${reason}`);

    if (!reason || !['inappropriate', 'spam', 'fake', 'offensive', 'other'].includes(reason)) {
      return res.status(400).json({ message: 'Valid reason is required' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await review.flag(userId, reason);

    res.json({ 
      message: 'Review flagged successfully',
      flaggedCount: review.flaggedCount
    });
  } catch (error) {
    console.error(`❌ Flag review error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(`⭐ Deleting review: ${id} by user: ${userId}`);

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only allow users to delete their own reviews
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(id);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(`❌ Delete review error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};