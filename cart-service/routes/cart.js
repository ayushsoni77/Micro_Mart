import express from 'express';
import { getCart, addItemToCart, updateCartItem, removeCartItem, clearCart } from '../controllers/cartController.js';
import { authenticateToken, requireBuyer } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication and buyer role
router.use(authenticateToken);
router.use(requireBuyer);

// Get user's cart
router.get('/:userId', getCart);

// Add item to cart
router.post('/:userId/items', addItemToCart);

// Update cart item quantity
router.put('/:userId/items/:itemId', updateCartItem);

// Remove item from cart
router.delete('/:userId/items/:itemId', removeCartItem);

// Clear entire cart
router.delete('/:userId', clearCart);

export default router;