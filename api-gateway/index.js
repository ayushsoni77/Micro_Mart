import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Service URLs
const services = {
  users: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  products: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4004',
  inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3005',
  reviews: process.env.REVIEWS_SERVICE_URL || 'http://localhost:3006',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
  cart: process.env.CART_SERVICE_URL || 'http://localhost:3008'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    services: services,
    timestamp: new Date().toISOString()
  });
});

// API Gateway Routes - Routes all requests to appropriate service
// /api/users/* -> User Service
app.use(
  '/api/users',
  createProxyMiddleware({
    target: services.users,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/api/users' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('User Service Error:', err);
      res.status(503).json({ message: 'User Service unavailable' });
    }
  })
);

// /api/products/* -> Product Service
app.use(
  '/api/products',
  createProxyMiddleware({
    target: services.products,
    changeOrigin: true,
    pathRewrite: { '^/api/products': '/api/products' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Product Service Error:', err);
      res.status(503).json({ message: 'Product Service unavailable' });
    }
  })
);

// /api/orders/* -> Order Service
app.use(
  '/api/orders',
  createProxyMiddleware({
    target: services.orders,
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '/api/orders' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Order Service Error:', err);
      res.status(503).json({ message: 'Order Service unavailable' });
    }
  })
);

// /api/payment/* -> Payment Service
app.use(
  '/api/payment',
  createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: { '^/api/payment': '/api/payment' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Payment Service Error:', err);
      res.status(503).json({ message: 'Payment Service unavailable' });
    }
  })
);

// /api/inventory/* -> Inventory Service
app.use(
  '/api/inventory',
  createProxyMiddleware({
    target: services.inventory,
    changeOrigin: true,
    pathRewrite: { '^/api/inventory': '/api/inventory' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Inventory Service Error:', err);
      res.status(503).json({ message: 'Inventory Service unavailable' });
    }
  })
);

// /api/reviews/* -> Reviews Service
app.use(
  '/api/reviews',
  createProxyMiddleware({
    target: services.reviews,
    changeOrigin: true,
    pathRewrite: { '^/api/reviews': '/api/reviews' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Reviews Service Error:', err);
      res.status(503).json({ message: 'Reviews Service unavailable' });
    }
  })
);

// /api/notifications/* -> Notification Service
app.use(
  '/api/notifications',
  createProxyMiddleware({
    target: services.notifications,
    changeOrigin: true,
    pathRewrite: { '^/api/notifications': '/api/notifications' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Notification Service Error:', err);
      res.status(503).json({ message: 'Notification Service unavailable' });
    }
  })
);

// /api/cart/* -> Cart Service
app.use(
  '/api/cart',
  createProxyMiddleware({
    target: services.cart,
    changeOrigin: true,
    pathRewrite: { '^/api/cart': '/api/cart' },
    logLevel: 'info',
    onError: (err, req, res) => {
      console.error('Cart Service Error:', err);
      res.status(503).json({ message: 'Cart Service unavailable' });
    }
  })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log('📍 Service Routes:');
  console.log(`   /api/users       → ${services.users}`);
  console.log(`   /api/products    → ${services.products}`);
  console.log(`   /api/orders      → ${services.orders}`);
  console.log(`   /api/payment     → ${services.payment}`);
  console.log(`   /api/inventory   → ${services.inventory}`);
  console.log(`   /api/reviews     → ${services.reviews}`);
  console.log(`   /api/notifications → ${services.notifications}`);
  console.log(`   /api/cart        → ${services.cart}`);
});
