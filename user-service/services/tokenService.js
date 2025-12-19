import jwt from 'jsonwebtoken';
import Token from '../models/Token.js';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

class TokenService {
  // Generate and store JWT token
  static async generateToken(user, type = 'access', userAgent = null, ipAddress = null) {
    try {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        type
      };

      const expiresIn = type === 'refresh' ? REFRESH_TOKEN_EXPIRY : ACCESS_TOKEN_EXPIRY;
      const tokenString = jwt.sign(payload, JWT_SECRET, { expiresIn });

      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (type === 'refresh' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

      // Store token in database (only for refresh tokens)
      if (type === 'refresh') {
        const tokenRecord = await Token.create({
          userId: user.id,
          token: tokenString,
          type,
          expiresAt,
          userAgent,
          ipAddress,
          lastUsedAt: new Date()
        });

        console.log(`🔐 Refresh token generated and stored for user ${user.id}`);
      } else {
        console.log(`🔐 Access token generated for user ${user.id}`);
      }

      return {
        token: tokenString,
        expiresAt,
        tokenId: type === 'refresh' ? tokenRecord?.id : null
      };

    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  }

  // Validate JWT token and check database
  static async validateToken(tokenString) {
    try {
      // First, verify JWT signature
      const decoded = jwt.verify(tokenString, JWT_SECRET);

      // For access tokens, we only need to verify JWT and check user exists
      if (decoded.type === 'access') {
        // Find user in appropriate table
        let user = await Buyer.findByPk(decoded.userId);
        let userRole = 'buyer';
        
        if (!user) {
          user = await Seller.findByPk(decoded.userId);
          userRole = 'seller';
        }

        if (!user) {
          console.log('❌ User not found');
          return { valid: false, reason: 'User not found' };
        }

        // Check if user is active (only if field exists)
        if (user.isActive !== undefined && !user.isActive) {
          console.log('❌ User is inactive');
          return { valid: false, reason: 'User inactive' };
        }

        console.log(`✅ Access token validated for user ${user.id}`);
        return {
          valid: true,
          user: { ...user.toJSON(), role: userRole },
          tokenRecord: null
        };
      }

      // For refresh tokens, check database
      if (decoded.type === 'refresh') {
        const tokenRecord = await Token.findOne({
          where: { token: tokenString }
        });

        if (!tokenRecord) {
          console.log('❌ Refresh token not found in database');
          return { valid: false, reason: 'Token not found' };
        }

        if (!tokenRecord.isValid()) {
          console.log('❌ Refresh token is revoked or expired');
          return { valid: false, reason: 'Token invalid' };
        }

        // Find user in appropriate table
        let user = await Buyer.findByPk(tokenRecord.userId);
        let userRole = 'buyer';
        
        if (!user) {
          user = await Seller.findByPk(tokenRecord.userId);
          userRole = 'seller';
        }

        if (!user) {
          console.log('❌ User not found');
          return { valid: false, reason: 'User not found' };
        }

        // Check if user is active (only if field exists)
        if (user.isActive !== undefined && !user.isActive) {
          console.log('❌ User is inactive');
          return { valid: false, reason: 'User inactive' };
        }

        // Update last used timestamp
        await tokenRecord.update({ lastUsedAt: new Date() });

        console.log(`✅ Refresh token validated for user ${user.id}`);
        return {
          valid: true,
          user: { ...user.toJSON(), role: userRole },
          tokenRecord
        };
      }

      return { valid: false, reason: 'Invalid token type' };

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        console.log('❌ Invalid JWT signature');
        return { valid: false, reason: 'Invalid signature' };
      }
      if (error.name === 'TokenExpiredError') {
        console.log('❌ Token expired');
        return { valid: false, reason: 'Token expired' };
      }
      console.error('Token validation error:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Store refresh token
  static async storeToken(userId, tokenString, type = 'refresh') {
    try {
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (type === 'refresh' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

      await Token.create({
        userId,
        token: tokenString,
        type,
        expiresAt,
        lastUsedAt: new Date()
      });

      console.log(`🔐 ${type} token stored for user ${userId}`);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  // Verify token exists
  static async verifyToken(userId, tokenString, type = 'refresh') {
    try {
      const token = await Token.findOne({
        where: { userId, token: tokenString, type }
      });
      return !!token;
    } catch (error) {
      console.error('Error verifying token:', error);
      return false;
    }
  }

  // Remove token
  static async removeToken(userId, tokenString, type = 'refresh') {
    try {
      await Token.destroy({
        where: { userId, token: tokenString, type }
      });
      console.log(`🔐 ${type} token removed for user ${userId}`);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  }

  // Revoke token
  static async revokeToken(tokenString) {
    try {
      const token = await Token.findOne({ where: { token: tokenString } });
      if (token) {
        token.isRevoked = true;
        await token.save();
        console.log(`🔐 Token revoked: ${tokenString.substring(0, 20)}...`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }

  // Revoke all tokens for a user
  static async revokeAllUserTokens(userId) {
    try {
      await Token.update(
        { isRevoked: true },
        { where: { userId } }
      );
      console.log(`🔐 All tokens revoked for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error revoking user tokens:', error);
      return false;
    }
  }

  // Get user sessions
  static async getUserSessions(userId) {
    try {
      const tokens = await Token.findAll({
        where: { userId, type: 'refresh' },
        order: [['lastUsedAt', 'DESC']]
      });

      return tokens.map(token => ({
        id: token.id,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
        lastUsedAt: token.lastUsedAt,
        expiresAt: token.expiresAt,
        isRevoked: token.isRevoked
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Clean expired tokens
  static async cleanExpiredTokens() {
    try {
      const result = await Token.destroy({
        where: {
          expiresAt: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      });
      return result;
    } catch (error) {
      console.error('Error cleaning expired tokens:', error);
      return 0;
    }
  }

  // Generate refresh token
  static async generateRefreshToken(user, userAgent = null, ipAddress = null) {
    return this.generateToken(user, 'refresh', userAgent, ipAddress);
  }

  // Refresh access token
  static async refreshAccessToken(refreshTokenString) {
    const validation = await this.validateToken(refreshTokenString);
    if (!validation.valid) {
      throw new Error('Invalid refresh token');
    }

    return this.generateToken(validation.user, 'access');
  }
}

export default TokenService; 