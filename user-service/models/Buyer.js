import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Buyer = sequelize.define('Buyer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Identity fields (email/password) are stored in `users` table. Buyer stores profile/extension data.
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  emailVerificationExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  resetPasswordExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profile: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  oauth_providers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  // Buyer-specific fields
  defaultShippingAddress: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'buyers'
});

// Instance method to compare password
Buyer.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
Buyer.prototype.getPublicProfile = function() {
  const { password, emailVerificationToken, resetPasswordToken, ...publicProfile } = this.toJSON();
  return publicProfile;
};

export default Buyer; 