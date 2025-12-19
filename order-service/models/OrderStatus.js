import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderStatus = sequelize.define('OrderStatus', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to the order'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    allowNull: false,
    comment: 'Status value'
  },
  previousStatus: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    allowNull: true,
    comment: 'Previous status before this change'
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID who made this status change'
  },
  changedByRole: {
    type: DataTypes.ENUM('buyer', 'seller', 'admin', 'system'),
    allowNull: false,
    defaultValue: 'system',
    comment: 'Role of the user who made the change'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about this status change'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata for this status change'
  }
}, {
  tableName: 'order_statuses',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['changed_by']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['order_id', 'created_at']
    }
  ]
});

export default OrderStatus; 