import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderItem = sequelize.define('OrderItem', {
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
  productId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Reference to the product (MongoDB ObjectId)'
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Product name at the time of order (snapshot)'
  },
  productSku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Product SKU at the time of order'
  },
  productImage: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Product image URL at the time of order'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Quantity ordered'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Unit price at the time of order'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Total price for this item (unitPrice * quantity)'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Discount amount applied to this item'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Tax amount for this item'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
    comment: 'Currency code'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Status of this specific item'
  },
  returnReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for return if item is returned'
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when item was returned'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Amount refunded for this item'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata for this item'
  }
}, {
  tableName: 'order_items',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['order_id', 'product_id']
    }
  ],
  hooks: {
    beforeCreate: async (orderItem) => {
      // Calculate total price if not provided
      if (!orderItem.totalPrice) {
        orderItem.totalPrice = parseFloat((orderItem.unitPrice * orderItem.quantity).toFixed(2));
      }
    },
    beforeUpdate: async (orderItem) => {
      // Recalculate total price if unit price or quantity changes
      if (orderItem.changed('unitPrice') || orderItem.changed('quantity')) {
        orderItem.totalPrice = parseFloat((orderItem.unitPrice * orderItem.quantity).toFixed(2));
      }
    }
  }
});

export default OrderItem; 