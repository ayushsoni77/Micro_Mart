import axios from 'axios';
import { Order, OrderItem, OrderStatus } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../models/index.js';

const NOTIFICATION_SERVICE_URL = 'http://localhost:3004';
const INVENTORY_SERVICE_URL = 'http://localhost:3005';
const PRODUCT_SERVICE_URL = 'http://localhost:3002';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod = 'pending' } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Only buyers can create orders
    if (userRole !== 'buyer') {
      return res.status(403).json({ 
        message: 'Only buyers can create orders. Please register as a buyer to place orders.' 
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return res.status(400).json({ message: 'Complete shipping address is required' });
    }

    // Calculate total amount from items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!item.id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: 'Each item must have a valid id and positive quantity' });
      }

      // Get product details to calculate price
      try {
        const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${item.id}`);
        const product = productResponse.data; // MongoDB returns product directly
        
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        
        orderItems.push({
          productId: product._id || product.id, // Use MongoDB ObjectId or fallback to id
          productName: product.name,
          productImage: product.images?.[0] || product.image, // Handle image array
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal
        });
      } catch (error) {
        console.log(`❌ Product not found: ${item.id}`);
        return res.status(400).json({ message: `Product with ID ${item.id} not found` });
      }
    }

    // Create order in database
    const order = await Order.create({
      userId,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      subtotal: parseFloat(totalAmount.toFixed(2)),
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending',
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        orderId: order.id,
        ...item
      });
    }

    // Create initial status record
    await OrderStatus.create({
      orderId: order.id,
      status: 'pending',
      changedByRole: 'system',
      notes: 'Order created'
    });

    // Reserve inventory
    try {
      await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/reserve`, {
        items: orderItems.map(item => ({ id: item.productId, quantity: item.quantity })),
        orderId: order.id
      });
    } catch (inventoryError) {
      console.log(`❌ Inventory reservation failed:`, inventoryError.response?.data?.message || inventoryError.message);
      // Note: In production, you might want to rollback the order creation here
    }

    // Publish OrderCreated event to Kafka (replace notification HTTP call)
    try {
      const producer = req.app.locals.kafkaProducer;
      const topic = req.app.locals.orderEventsTopic;
      if (producer && topic) {
        const event = {
          type: 'order_created',
          data: {
            orderId: order.id,
            userId,
            totalAmount: Number(order.totalAmount),
            itemCount: orderItems.length,
            createdAt: new Date().toISOString()
          },
          occurredAt: new Date().toISOString(),
          source: 'order-service'
        };
        await producer.send({
          topic,
          messages: [
            { key: String(order.id), value: JSON.stringify(event) }
          ]
        });
        console.log(`📤 Published OrderCreated event for order ${order.id}`);
      } else {
        console.warn('⚠️ Kafka producer/topic not available, skipping event publish');
      }
    } catch (notificationError) {
      console.log(`⚠️ Failed to publish order_created event:`, notificationError.message);
    }

    // Get the complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderStatus, as: 'statusHistory' }
      ]
    });

    // Convert DECIMAL fields to numbers for frontend compatibility
    const orderData = completeOrder.toJSON();
    const orderWithNumbers = {
      ...orderData,
      totalAmount: Number(orderData.totalAmount),
      subtotal: Number(orderData.subtotal),
      taxAmount: Number(orderData.taxAmount),
      shippingAmount: Number(orderData.shippingAmount),
      discountAmount: Number(orderData.discountAmount),
      items: orderData.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount),
        refundAmount: Number(item.refundAmount)
      }))
    };

    res.status(201).json({ message: 'Order created successfully', order: orderWithNumbers });
  } catch (error) {
    console.error(`❌ Create order error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const requestingUserId = req.user.userId;
    const requestingUserRole = req.user.role;
    const { userId, status } = req.query;
    
    // Build where clause
    let whereClause = {};
    
    // Buyers can only see their own orders
    if (requestingUserRole === 'buyer') {
      whereClause.userId = requestingUserId;
    }
    // Sellers can see orders containing their products (for now, all orders)
    // In production, you'd filter by products they sell

    // Filter by specific user if requested
    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    // Filter by status if requested
    if (status) {
      whereClause.status = status;
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderStatus, as: 'statusHistory' }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Convert DECIMAL fields to numbers for frontend compatibility
    const ordersWithNumbers = orders.map(order => {
      const orderData = order.toJSON();
      return {
        ...orderData,
        totalAmount: Number(orderData.totalAmount),
        subtotal: Number(orderData.subtotal),
        taxAmount: Number(orderData.taxAmount),
        shippingAmount: Number(orderData.shippingAmount),
        discountAmount: Number(orderData.discountAmount),
        items: orderData.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
          discountAmount: Number(item.discountAmount),
          taxAmount: Number(item.taxAmount),
          refundAmount: Number(item.refundAmount)
        }))
      };
    });

    res.json({ orders: ordersWithNumbers });
  } catch (error) {
    console.error(`❌ Get orders error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.userId;
    const requestingUserRole = req.user.role;
    
    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderStatus, as: 'statusHistory' }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Buyers can only see their own orders
    if (requestingUserRole === 'buyer' && order.userId !== requestingUserId) {
      return res.status(403).json({ message: 'You can only view your own orders' });
    }

    // Convert DECIMAL fields to numbers for frontend compatibility
    const orderData = order.toJSON();
    const orderWithNumbers = {
      ...orderData,
      totalAmount: Number(orderData.totalAmount),
      subtotal: Number(orderData.subtotal),
      taxAmount: Number(orderData.taxAmount),
      shippingAmount: Number(orderData.shippingAmount),
      discountAmount: Number(orderData.discountAmount),
      items: orderData.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount),
        refundAmount: Number(item.refundAmount)
      }))
    };

    res.json({ order: orderWithNumbers });
  } catch (error) {
    console.error(`❌ Get order by ID error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;
    const requestingUserRole = req.user.role;
    
    // Only sellers can update order status (in production, add more granular permissions)
    if (requestingUserRole !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can update order status' });
    }

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;

    if (status) {
      order.status = status;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Save the updated order
    await order.save();

    // Create status history record if status changed
    if (status && status !== previousStatus) {
      await OrderStatus.create({
        orderId: order.id,
        status: status,
        previousStatus: previousStatus,
        changedBy: req.user.userId,
        changedByRole: requestingUserRole,
        notes: `Status changed from ${previousStatus} to ${status}`
      });
    }

    // Handle inventory based on status change
    if (status === 'delivered' || status === 'completed') {
      try {
        await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/release`, {
          items: order.items.map(item => ({ id: item.productId, quantity: item.quantity })),
          orderId: parseInt(id),
          action: 'fulfill'
        });

        // Update sales count for products
        for (const item of order.items) {
          try {
            // This would be better as an API call to product service
          } catch (error) {
            console.log(`⚠️ Could not update sales count for product ${item.productId}`);
          }
        }
      } catch (inventoryError) {
        console.log(`⚠️ Inventory service unavailable for fulfillment:`, inventoryError.message);
      }
    } else if (status === 'cancelled') {
      try {
        await axios.post(`${INVENTORY_SERVICE_URL}/api/inventory/release`, {
          items: order.items.map(item => ({ id: item.productId, quantity: item.quantity })),
          orderId: parseInt(id),
          action: 'cancel'
        });
      } catch (inventoryError) {
        console.log(`⚠️ Inventory service unavailable for release:`, inventoryError.message);
      }
    }

    // Publish OrderStatusUpdated event to Kafka (replace notification HTTP call)
    try {
      const producer = req.app.locals.kafkaProducer;
      const topic = req.app.locals.orderEventsTopic;
      if (producer && topic) {
        const event = {
          type: 'order_status_update',
          data: {
            orderId: order.id,
            userId: order.userId,
            status: status || order.status,
            previousStatus,
            paymentStatus: paymentStatus || previousPaymentStatus,
            changedAt: new Date().toISOString()
          },
          occurredAt: new Date().toISOString(),
          source: 'order-service'
        };
        await producer.send({
          topic,
          messages: [
            { key: String(order.id), value: JSON.stringify(event) }
          ]
        });
        console.log(`📤 Published OrderStatusUpdated event for order ${order.id}`);
      }
    } catch (notificationError) {
      console.log(`⚠️ Failed to publish order_status_update event:`, notificationError.message);
    }

    // Convert DECIMAL fields to numbers for frontend compatibility
    const orderData = order.toJSON();
    const orderWithNumbers = {
      ...orderData,
      totalAmount: Number(orderData.totalAmount),
      subtotal: Number(orderData.subtotal),
      taxAmount: Number(orderData.taxAmount),
      shippingAmount: Number(orderData.shippingAmount),
      discountAmount: Number(orderData.discountAmount),
      items: orderData.items ? orderData.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount),
        refundAmount: Number(item.refundAmount)
      })) : []
    };

    res.json({ message: 'Order updated successfully', order: orderWithNumbers });
  } catch (error) {
    console.error(`❌ Update order status error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const setCOD = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentMethod = 'Cash on Delivery';
    order.paymentStatus = 'pending';
    
    await order.save();
    
    // Convert DECIMAL fields to numbers for frontend compatibility
    const orderData = order.toJSON();
    const orderWithNumbers = {
      ...orderData,
      totalAmount: Number(orderData.totalAmount),
      subtotal: Number(orderData.subtotal),
      taxAmount: Number(orderData.taxAmount),
      shippingAmount: Number(orderData.shippingAmount),
      discountAmount: Number(orderData.discountAmount)
    };

    res.json({ message: 'Order updated to COD', order: orderWithNumbers });
  } catch (error) {
    console.error(`❌ Set COD error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const paymentSuccess = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderStatus, as: 'statusHistory' }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentStatus = 'paid';
    await order.save();
    
    // Create status record
    await OrderStatus.create({
      orderId: order.id,
      status: 'paid',
      changedByRole: 'system',
      notes: 'Payment received'
    });

    // Convert DECIMAL fields to numbers for frontend compatibility
    const orderData = order.toJSON();
    const orderWithNumbers = {
      ...orderData,
      totalAmount: Number(orderData.totalAmount),
      subtotal: Number(orderData.subtotal),
      taxAmount: Number(orderData.taxAmount),
      shippingAmount: Number(orderData.shippingAmount),
      discountAmount: Number(orderData.discountAmount),
      items: orderData.items ? orderData.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        discountAmount: Number(item.discountAmount),
        taxAmount: Number(item.taxAmount),
        refundAmount: Number(item.refundAmount)
      })) : []
    };

    res.json({ message: 'Payment processed successfully', order: orderWithNumbers });
  } catch (error) {
    console.error(`❌ Payment success error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Analytics endpoints for seller dashboard
export const getSellerAnalytics = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y

    console.log(`📊 Analytics request for seller ${sellerId}, period: ${period}`);

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // First, get the seller's products to know which orders to include
    let sellerProductIds = [];
    try {
      const productsResponse = await axios.get(`http://localhost:3002/api/products/seller/products`, {
        headers: { 
          'Authorization': req.headers.authorization 
        }
      });
      const sellerProducts = productsResponse.data || [];
      sellerProductIds = sellerProducts.map(product => product._id || product.id);
      console.log(`📊 Seller ${sellerId} has ${sellerProductIds.length} products:`, sellerProductIds);
    } catch (error) {
      console.error('Error fetching seller products for analytics:', error);
      // If we can't get seller products, return empty analytics
      return res.json({
        analytics: {
          totalRevenue: 0,
          totalOrders: 0,
          totalItems: 0,
          dailyRevenue: [],
          topProducts: [],
          orderStatus: {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
          }
        }
      });
    }

    // Get all orders in the date range
    const orders = await Order.findAll({
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate
        }
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`📊 Found ${orders.length} orders in date range`);

    // Process analytics data
    const analytics = {
      totalRevenue: 0,
      totalOrders: 0,
      totalItems: 0,
      dailyRevenue: [],
      topProducts: [],
      orderStatus: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      }
    };

    // Calculate daily revenue and filter by seller
    const dailyData = {};
    const productSales = {};
    const sellerOrders = [];

    orders.forEach(order => {
      // Check if order contains seller's products
      const sellerItems = order.items.filter(item => {
        const isSellerProduct = sellerProductIds.includes(item.productId);
        if (isSellerProduct) {
          console.log(`✅ Order ${order.id} contains seller's product: ${item.productName} (ID: ${item.productId})`);
        } else {
          console.log(`❌ Order ${order.id} contains non-seller product: ${item.productName} (ID: ${item.productId})`);
        }
        return isSellerProduct;
      });

      if (sellerItems.length > 0) {
        sellerOrders.push(order);
        
        // Calculate order total for seller's items
        const orderTotal = sellerItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
        
        // Update daily data
        const date = order.createdAt.toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, orders: 0 };
        }
        dailyData[date].revenue += orderTotal;
        dailyData[date].orders += 1;
        
        // Update analytics totals
        analytics.totalRevenue += orderTotal;
        analytics.totalOrders += 1;
        analytics.totalItems += sellerItems.length;
        
        // Update order status counts
        const status = order.status?.toLowerCase() || 'pending';
        if (analytics.orderStatus.hasOwnProperty(status)) {
          analytics.orderStatus[status]++;
        }
        
        // Track product sales
        sellerItems.forEach(item => {
          const productKey = item.productId || item.productName;
          if (!productSales[productKey]) {
            productSales[productKey] = {
              productId: item.productId,
              productName: item.productName,
              totalSold: 0,
              totalRevenue: 0,
              orderCount: 0
            };
          }
          productSales[productKey].totalSold += item.quantity;
          productSales[productKey].totalRevenue += Number(item.totalPrice);
          productSales[productKey].orderCount += 1;
        });
      }
    });

    // Convert daily data to array and sort by date
    analytics.dailyRevenue = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Convert product sales to array and sort by revenue
    analytics.topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    console.log(`📊 Analytics calculated:`, {
      totalRevenue: analytics.totalRevenue,
      totalOrders: analytics.totalOrders,
      totalItems: analytics.totalItems,
      dailyRevenuePoints: analytics.dailyRevenue.length,
      topProductsCount: analytics.topProducts.length
    });

    res.json({ analytics });
  } catch (error) {
    console.error(`❌ Get seller analytics error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getSellerProductAnalytics = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { period = '30d' } = req.query;

    console.log(`📊 Product analytics request for seller ${sellerId}, period: ${period}`);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // First, get the seller's products to filter analytics
    let sellerProductIds = [];
    try {
      const productsResponse = await axios.get(`http://localhost:3002/api/products/seller/products`, {
        headers: { 
          'Authorization': req.headers.authorization 
        }
      });
      const sellerProducts = productsResponse.data || [];
      sellerProductIds = sellerProducts.map(product => product._id || product.id);
      console.log(`📊 Seller ${sellerId} has ${sellerProductIds.length} products for analytics:`, sellerProductIds);
    } catch (error) {
      console.error('Error fetching seller products for product analytics:', error);
      // If we can't get seller products, return empty analytics
      return res.json({ productAnalytics: [] });
    }

    // If seller has no products, return empty analytics
    if (sellerProductIds.length === 0) {
      console.log(`📊 Seller ${sellerId} has no products, returning empty analytics`);
      return res.json({ productAnalytics: [] });
    }

    // Get product performance data using raw SQL for better aggregation
    // Filter by seller's products only
    const productAnalytics = await sequelize.query(`
      SELECT 
        oi."productId",
        oi."productName",
        SUM(oi.quantity) as "totalSold",
        SUM(oi."totalPrice") as "totalRevenue",
        COUNT(DISTINCT o.id) as "orderCount",
        AVG(oi."unitPrice") as "averagePrice"
      FROM "OrderItems" oi
      JOIN "Orders" o ON oi."orderId" = o.id
      WHERE o."createdAt" >= :startDate
        AND o."paymentStatus" = 'paid'
        AND oi."productId" IN (:sellerProductIds)
      GROUP BY oi."productId", oi."productName"
      ORDER BY "totalRevenue" DESC
      LIMIT 10
    `, {
      replacements: { 
        startDate,
        sellerProductIds: sellerProductIds
      },
      type: sequelize.QueryTypes.SELECT
    });

    console.log(`📊 Found ${productAnalytics.length} seller products with sales data`);

    res.json({ productAnalytics });
  } catch (error) {
    console.error(`❌ Get seller product analytics error:`, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};