import TokenService from '../services/tokenService.js';

// Rate limiting for authentication endpoints
export const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (requests.has(ip)) {
      requests.set(ip, requests.get(ip).filter(time => time > windowStart));
    } else {
      requests.set(ip, []);
    }
    
    const requestTimes = requests.get(ip);
    
    if (requestTimes.length >= max) {
      return res.status(429).json({ 
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requestTimes.push(now);
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Strict transport security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content security policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  
  next();
};

// Token security validation
export const tokenSecurityCheck = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    // Check for suspicious patterns
    const validation = await TokenService.validateToken(token);
    
    if (validation.valid && validation.tokenRecord) {
      // Log suspicious activity
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.connection.remoteAddress;
      
      // Check for unusual patterns
      if (validation.tokenRecord.userAgent && validation.tokenRecord.userAgent !== userAgent) {
        console.warn(`⚠️ Suspicious token usage: User agent mismatch for user ${validation.user.id}`);
        // Could trigger additional verification here
      }
      
      if (validation.tokenRecord.ipAddress && validation.tokenRecord.ipAddress !== ipAddress) {
        console.warn(`⚠️ Suspicious token usage: IP address mismatch for user ${validation.user.id}`);
        // Could trigger additional verification here
      }
    }
    
    next();
  } catch (error) {
    console.error('Token security check error:', error);
    next();
  }
};

// Session security middleware
export const sessionSecurity = (req, res, next) => {
  // Regenerate session ID on login to prevent session fixation
  if (req.session && req.session.userId) {
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }
      next();
    });
  } else {
    next();
  }
};

// Logout from all devices (security feature)
export const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user.userId;
    const revokedCount = await TokenService.revokeAllUserTokens(userId);
    
    console.log(`🔐 User ${userId} logged out from all devices (${revokedCount} tokens revoked)`);
    
    res.json({ 
      message: 'Logged out from all devices successfully',
      revokedTokens: revokedCount
    });
  } catch (error) {
    console.error('Logout all devices error:', error);
    res.status(500).json({ message: 'Error logging out from all devices' });
  }
};

// Get active sessions for user
export const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await TokenService.getUserSessions(userId);
    
    res.json({ 
      sessions: sessions.map(session => ({
        id: session.id,
        type: session.type,
        device: session.userAgent,
        ipAddress: session.ipAddress,
        lastUsed: session.lastUsedAt,
        expiresAt: session.expiresAt
      }))
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({ message: 'Error fetching active sessions' });
  }
}; 