import express from 'express';
import { 
  register, 
  login, 
  logout,
  refreshToken,
  getProfile, 
  getAllUsers,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  verifyEmail,
  resendOtp
} from '../controllers/authController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { 
  rateLimit, 
  securityHeaders, 
  tokenSecurityCheck,
  logoutAllDevices,
  getActiveSessions 
} from '../middleware/security.js';

const router = express.Router();

const logRequest = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} Authorization:`, req.headers['authorization']);
  next();
};

router.use(logRequest);
router.use(securityHeaders);
router.use(tokenSecurityCheck);

// Authentication routes with rate limiting
router.post('/register', rateLimit(15 * 60 * 1000, 5), register); // 5 attempts per 15 minutes
router.post('/login', rateLimit(15 * 60 * 1000, 10), login); // 10 attempts per 15 minutes
router.post('/logout', authenticateToken, logout);
router.post('/refresh-token', rateLimit(15 * 60 * 1000, 20), refreshToken);
router.post('/verify-email', rateLimit(15 * 60 * 1000, 10), verifyEmail);
router.post('/resend-otp', rateLimit(15 * 60 * 1000, 5), resendOtp);

// Security endpoints
router.post('/logout-all-devices', authenticateToken, logoutAllDevices);
router.get('/active-sessions', authenticateToken, getActiveSessions);

// User profile routes
router.get('/profile', authenticateToken, getProfile);
router.get('/', authenticateToken, getAllUsers);

// Address management routes (no userId in URL - uses authenticated user)
router.get('/addresses', authenticateToken, getAddresses);
router.post('/addresses', authenticateToken, addAddress);
router.put('/addresses/:id', authenticateToken, updateAddress);
router.delete('/addresses/:id', authenticateToken, deleteAddress);

export default router;