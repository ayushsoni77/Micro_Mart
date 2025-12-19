import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PaymentTransaction = sequelize.define('PaymentTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to the order in order-service'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to the user who made the payment'
  },
  transactionId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'External payment gateway transaction ID'
  },
  paymentMethod: {
    type: DataTypes.ENUM('pending', 'UPI', 'Debit Card', 'Credit Card', 'Cash on Delivery', 'Net Banking'),
    allowNull: false,
    comment: 'Payment method used'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Transaction amount'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR',
    comment: 'Currency code'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Transaction status'
  },
  gateway: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Payment gateway used (e.g., Razorpay, Stripe)'
  },
  gatewayOrderId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Payment gateway order ID'
  },
  gatewayResponse: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Raw response from payment gateway'
  },
  errorCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Error code if transaction failed'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if transaction failed'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Amount refunded from this transaction'
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for refund'
  },
  refundDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date when refund was processed'
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
    comment: 'Additional metadata for this transaction'
  }
}, {
  tableName: 'payment_transactions',
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['transaction_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['gateway']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['order_id', 'status']
    },
    {
      fields: ['user_id', 'status']
    }
  ]
});

export default PaymentTransaction; 