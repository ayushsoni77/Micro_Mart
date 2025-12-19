import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const Seller = sequelize.define('Seller', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
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
  // Seller-specific fields
  businessName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  businessDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  businessAddress: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  businessPhone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  businessWebsite: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bankAccountInfo: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: 10.00
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verificationDocuments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  storeSettings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'sellers',
  hooks: {
    beforeCreate: async (seller) => {
      if (seller.password) {
        seller.password = await bcrypt.hash(seller.password, 12);
      }
    },
    beforeUpdate: async (seller) => {
      if (seller.changed('password')) {
        seller.password = await bcrypt.hash(seller.password, 12);
      }
    }
  }
});

// Instance method to compare password
Seller.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile
Seller.prototype.getPublicProfile = function() {
  const { password, emailVerificationToken, resetPasswordToken, bankAccountInfo, ...publicProfile } = this.toJSON();
  return publicProfile;
};

export default Seller; 