import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Seller = sequelize.define('Seller', {
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
  // Seller-specific fields only
  // Identity/authentication fields (email, password, isEmailVerified, etc.) are stored in canonical `users` table
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
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true
  },
  totalProducts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'sellers'
});

export default Seller; 