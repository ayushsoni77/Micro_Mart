import express from 'express';
import { 
  createReview, 
  getReviewsByProduct, 
  updateReviewHelpfulness,
  getReviewStats,
  getUserReviews,
  flagReview,
  deleteReview
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/product/:productId', getReviewsByProduct);
router.get('/product/:productId/stats', getReviewStats);

// Protected routes
router.post('/', authenticateToken, createReview);
router.patch('/:id/helpful', authenticateToken, updateReviewHelpfulness);
router.get('/user', authenticateToken, getUserReviews);
router.post('/:id/flag', authenticateToken, flagReview);
router.delete('/:id', authenticateToken, deleteReview);

export default router;