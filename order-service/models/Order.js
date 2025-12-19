import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to user who placed the order'
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Human-readable order number (e.g., ORD-2024-001)'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Current status of the order'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded', 'partially_refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Payment status of the order'
  },
  paymentMethod: {
    type: DataTypes.ENUM('pending', 'UPI', 'Debit Card', 'Credit Card', 'Cash on Delivery', 'Net Banking'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Payment method used'
  },
  paymentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'External payment gateway transaction ID'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Total order amount including tax and shipping'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Subtotal before tax and shipping'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Tax amount'
  },
  shippingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Shipping cost'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Discount amount applied'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
    comment: 'Currency code'
  },
  shippingAddress: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Shipping address details'
  },
  billingAddress: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Billing address details (if different from shipping)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Order notes from customer or admin'
  },
  estimatedDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Estimated delivery date'
  },
  actualDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Actual delivery date'
  },
  trackingNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Shipping tracking number'
  },
  trackingUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Shipping tracking URL'
  },
  isGift: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether this is a gift order'
  },
  giftMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Gift message for gift orders'
  },
  source: {
    type: DataTypes.ENUM('web', 'mobile', 'api'),
    allowNull: false,
    defaultValue: 'web',
    comment: 'Source of the order'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the customer'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent of the customer'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata for the order'
  }
}, {
  tableName: 'orders',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['order_number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'status']
    }
  ],
  hooks: {
    beforeCreate: async (order) => {
      // Generate order number if not provided
      if (!order.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Get count of orders for today
        const todayOrders = await Order.count({
          where: {
            createdAt: {
              [sequelize.Sequelize.Op.gte]: new Date(date.getFullYear(), date.getMonth(), date.getDate())
            }
          }
        });
        
        order.orderNumber = `ORD-${year}${month}${day}-${String(todayOrders + 1).padStart(3, '0')}`;
      }
    },
    beforeValidate: async (order) => {
      // Ensure order number is generated before validation
      if (!order.orderNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        // Get count of orders for today
        const todayOrders = await Order.count({
          where: {
            createdAt: {
              [sequelize.Sequelize.Op.gte]: new Date(date.getFullYear(), date.getMonth(), date.getDate())
            }
          }
        });
        
        order.orderNumber = `ORD-${year}${month}${day}-${String(todayOrders + 1).padStart(3, '0')}`;
      }
    }
  }
});

export default Order; 