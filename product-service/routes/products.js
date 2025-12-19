import express from 'express';
import { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getProductsBySeller,
  getFeaturedProducts
} from '../controllers/productController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

// Protected routes (seller only)
router.post('/', authenticateToken, requireRole('seller'), createProduct);
router.put('/:id', authenticateToken, requireRole('seller'), updateProduct);
router.delete('/:id', authenticateToken, requireRole('seller'), deleteProduct);
router.get('/seller/products', authenticateToken, requireRole('seller'), getProductsBySeller);

export default router;