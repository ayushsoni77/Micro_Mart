import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import paymentRoutes from './routes/paymentRoutes.js';
import { testConnection, syncDatabase } from './config/database.js';
import models from './models/index.js'; // Ensure models are loaded for sync

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config.env') });

const app = express();
const PORT = process.env.PORT || 4004;

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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Payment Service is running', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`💳 Payment Service running on port ${PORT}`);
  });
});
