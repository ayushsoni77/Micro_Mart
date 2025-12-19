import TokenService from '../services/tokenService.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Validate token using TokenService (checks both JWT and database)
    const validation = await TokenService.validateToken(token);

    if (!validation.valid) {
      return res.status(403).json({ 
        message: 'Invalid or expired token',
        reason: validation.reason 
      });
    }

    // Set user info from validated token
    req.user = {
      userId: validation.user.id,
      email: validation.user.email,
      role: validation.user.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
};

export const requireSeller = requireRole(['seller']);
export const requireBuyer = requireRole(['buyer']);
export const requireAnyRole = requireRole(['buyer', 'seller']);