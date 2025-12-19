import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
// Removed User import - using separate Buyer/Seller tables

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
    // Removed foreign key constraint to allow flexibility with buyers/sellers tables
  },
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('access', 'refresh', 'reset'),
    allowNull: false,
    defaultValue: 'access'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isRevoked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'tokens',
  indexes: [
    {
      fields: ['token']
    },
    {
      fields: ['user_id'] // Use the actual column name in database
    },
    {
      fields: ['expires_at'] // Use the actual column name in database
    },
    {
      fields: ['is_revoked'] // Use the actual column name in database
    }
  ]
});

// Note: No direct relationship defined since we use separate Buyer/Seller tables
// Token.userId can reference either buyers.id or sellers.id

// Instance method to check if token is valid
Token.prototype.isValid = function() {
  return !this.isRevoked && new Date() < this.expiresAt;
};

// Instance method to revoke token
Token.prototype.revoke = async function() {
  this.isRevoked = true;
  await this.save();
};

// Static method to clean expired tokens
Token.cleanExpired = async function() {
  try {
    const result = await Token.destroy({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });
    console.log(`🧹 Cleaned ${result} expired tokens`);
    return result;
  } catch (error) {
    console.error('Error cleaning expired tokens:', error);
    return 0;
  }
};

export default Token; 