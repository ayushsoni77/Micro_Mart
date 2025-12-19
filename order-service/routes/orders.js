import express from 'express';
import { 
  createOrder, 
  getOrders, 
  getOrderById, 
  updateOrderStatus, 
  setCOD, 
  paymentSuccess,
  getSellerAnalytics,
  getSellerProductAnalytics
} from '../controllers/orderController.js';
import { authenticateToken, requireBuyer, requireSeller, requireAnyRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, requireBuyer, createOrder);
router.get('/', authenticateToken, requireAnyRole, getOrders);
router.get('/:id', authenticateToken, requireAnyRole, getOrderById);
router.patch('/:id/status', authenticateToken, requireSeller, updateOrderStatus);
router.post('/:id/set-cod', authenticateToken, requireBuyer, setCOD);
router.post('/payment-success', paymentSuccess);

// Analytics routes for seller dashboard
router.get('/analytics/seller/:sellerId', authenticateToken, requireSeller, getSellerAnalytics);
router.get('/analytics/seller/:sellerId/products', authenticateToken, requireSeller, getSellerProductAnalytics);

export default router;