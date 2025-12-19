import axios from 'axios';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Joi from 'joi';
import logger from '../utils/logger.js';
import PaymentTransaction from '../models/PaymentTransaction.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;
const NOTIFICATION_SERVICE_URL = 'http://localhost:3004';

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Validation schemas
const initiatePaymentSchema = Joi.object({
  orderId: Joi.number().required(),
  paymentMethod: Joi.string().valid('UPI', 'Debit Card', 'Credit Card', 'Cash on Delivery').required(),
});

const paymentCallbackSchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  orderId: Joi.number().required(),
  userId: Joi.number().required(),
});

export const initiatePayment = async (req, res) => {
  try {
    const { error, value } = initiatePaymentSchema.validate(req.body);
    if (error) {
      logger.warn('Validation error in initiatePayment: %o', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { orderId, paymentMethod } = value;
    logger.info('Initiating payment for order %s with method %s', orderId, paymentMethod);

    // Fetch order details from order service
    let orderRes;
    try {
      orderRes = await axios.get(`${ORDER_SERVICE_URL}/${orderId}`, {
        headers: {
          Authorization: req.headers.authorization,
        },
      });
    } catch (err) {
      logger.error('Order fetch failed: %o', err.response?.data || err.message);
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRes.data.order;
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const paymentAmount = Math.round(order.totalAmount * 100); // Convert to paise

    if (["UPI", "Debit Card", "Credit Card"].includes(paymentMethod)) {
      // Create real Razorpay order
      const options = {
        amount: paymentAmount,
        currency: 'INR',
        receipt: `order_rcptid_${orderId}`,
        payment_capture: 1,
      };
      
      const razorpayOrder = await razorpay.orders.create(options);
      logger.info(`Razorpay order created: ${razorpayOrder.id} for order ${orderId}`);

      // Store payment transaction in payment service database
      await PaymentTransaction.create({
        orderId: orderId,
        userId: order.userId,
        transactionId: `TXN_${Date.now()}_${orderId}`, // Temporary transaction ID
        paymentMethod: paymentMethod,
        amount: order.totalAmount,
        status: 'pending',
        gateway: 'Razorpay',
        gatewayOrderId: razorpayOrder.id,
        gatewayResponse: razorpayOrder,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.json({
        paymentStatus: 'created',
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId,
        paymentMethod,
      });
    } else if (paymentMethod === "Cash on Delivery") {
      // Store COD transaction
      await PaymentTransaction.create({
        orderId: orderId,
        userId: order.userId,
        transactionId: `COD_${Date.now()}_${orderId}`,
        paymentMethod: paymentMethod,
        amount: order.totalAmount,
        status: 'pending',
        gateway: 'COD',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Update order payment mode to COD
      try {
        await axios.post(`${ORDER_SERVICE_URL}/${orderId}/set-cod`);
      } catch (err) {
        logger.error('Failed to set COD for order: %o', err.response?.data || err.message);
      }
      
      return res.json({
        paymentStatus: 'pending',
        paymentMethod,
        orderId,
      });
    } else {
      return res.status(400).json({ error: 'Unsupported payment method.' });
    }
  } catch (err) {
    logger.error('Error in initiatePayment: %o', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
  hmac.update(orderId + '|' + paymentId);
  const digest = hmac.digest('hex');
  return digest === signature;
}

export const paymentCallback = async (req, res) => {
  try {
    const { error, value } = paymentCallbackSchema.validate(req.body);
    if (error) {
      logger.warn('Validation error in paymentCallback: %o', error.details);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, userId } = value;
    
    // Verify signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      logger.warn('Invalid Razorpay signature for order %s', orderId);
      return res.status(400).json({ error: 'Invalid payment signature.' });
    }

    // Update payment transaction in payment service database
    const paymentTransaction = await PaymentTransaction.findOne({
      where: { 
        orderId: orderId,
        gatewayOrderId: razorpay_order_id
      }
    });

    if (!paymentTransaction) {
      logger.error('Payment transaction not found for order %s', orderId);
      return res.status(404).json({ error: 'Payment transaction not found.' });
    }

    // Update transaction status
    paymentTransaction.transactionId = razorpay_payment_id;
    paymentTransaction.status = 'completed';
    paymentTransaction.gatewayResponse = req.body;
    await paymentTransaction.save();

    // Update order status in order service
    try {
      await axios.post(`${ORDER_SERVICE_URL}/payment-success`, {
        orderId,
        paymentId: razorpay_payment_id,
        status: 'paid',
      });
    } catch (err) {
      logger.error('Failed to update order status: %o', err.response?.data || err.message);
    }

    // Notify user
    try {
      logger.info('Sending notification to: %s', NOTIFICATION_SERVICE_URL);
      const notificationData = {
        type: 'payment_success',
        userId,
        orderId,
        title: 'Payment Successful',
        message: `Payment of ₹${paymentTransaction.amount} for order #${orderId} has been processed successfully.`,
        priority: 'high',
        category: 'payment',
        actionUrl: `/orders/${orderId}`,
        actionText: 'View Order',
        metadata: {
          orderId,
          paymentId: razorpay_payment_id,
          amount: paymentTransaction.amount,
          paymentMethod: paymentTransaction.paymentMethod
        }
      };
      logger.info('Notification data: %o', notificationData);
      
      await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, notificationData);
      logger.info('Notification sent successfully for order %s', orderId);
    } catch (err) {
      logger.error('Failed to notify user: %o', err.response?.data || err.message);
      logger.error('Full error: %o', err);
    }

    logger.info('Payment successful for order %s', orderId);
    res.json({ message: 'Payment status updated successfully.' });
  } catch (err) {
    logger.error('Error in paymentCallback: %o', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// Get payment transactions for an order
export const getPaymentTransactions = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const transactions = await PaymentTransaction.findAll({
      where: { orderId: orderId },
      order: [['createdAt', 'DESC']]
    });

    // Convert DECIMAL fields to numbers for frontend compatibility
    const transactionsWithNumbers = transactions.map(transaction => {
      const transactionData = transaction.toJSON();
      return {
        ...transactionData,
        amount: Number(transactionData.amount),
        refundAmount: Number(transactionData.refundAmount)
      };
    });

    res.json({ transactions: transactionsWithNumbers });
  } catch (error) {
    logger.error('Error getting payment transactions: %o', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};
