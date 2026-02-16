import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import productRoutes from './routes/products.js';
import { connectDatabase } from './config/database.js';
import { initializeObservability } from './observability.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config.env') });

const app = express();
const PORT = process.env.PORT || 3002;
const observability = await initializeObservability({ serviceName: 'product-service' });

// Initialize database
const initializeDatabase = async () => {
  try {
    await connectDatabase();
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(observability.metricsMiddleware);

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Product Service is running', timestamp: new Date().toISOString() });
});

observability.registerMetricsEndpoint(app);

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`📦 Product Service running on port ${PORT}`);
  });
});
const shutdown = async () => {
  await observability.shutdown();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
