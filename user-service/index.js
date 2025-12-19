import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/users.js';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import { createClient } from 'redis';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import { testConnection, syncDatabase } from './config/database.js';
import models from './models/index.js'; // Ensure models are loaded for sync
import TokenService from './services/tokenService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables)
    await syncDatabase();

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Create Redis client
const redisClient = createClient({
  legacyMode: true, // required for connect-redis v6+
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
// Avoid network connections during tests
if (process.env.NODE_ENV !== 'test') {
  redisClient.connect().catch(console.error);
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true if using HTTPS
  }));
}
app.use(passport.initialize());
if (process.env.NODE_ENV !== 'test') {
  app.use(passport.session());
}

// Routes - Use correct routes for each endpoint
app.use('/api/users', userRoutes); // Authentication endpoints
app.use('/auth', authRoutes); // OAuth endpoints

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'User Service is running', timestamp: new Date().toISOString() });
});

// Periodic cleanup of expired tokens (every hour)
const cleanupExpiredTokens = async () => {
  try {
    const cleanedCount = await TokenService.cleanExpiredTokens();
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired tokens`);
    }
  } catch (error) {
    console.error('Error cleaning expired tokens:', error);
  }
};

// Start cleanup job (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupExpiredTokens, 60 * 60 * 1000); // Every hour
  console.log('🕐 Token cleanup job scheduled (every hour)');
}

// Initialize database and start server
// Only start the HTTP server when not running tests
if (process.env.NODE_ENV !== 'test') {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`🔐 User Service running on port ${PORT}`);
    });
  });
}

// Export the app for testing
export default app;