import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import inventoryRoutes from './routes/inventory.js';
import { connectDatabase } from './config/database.js';
import { initializeObservability } from './observability.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3005;
const observability = await initializeObservability({ serviceName: 'inventory-service' });

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
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Inventory Service is running', timestamp: new Date().toISOString() });
});

observability.registerMetricsEndpoint(app);

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`📦 Inventory Service running on port ${PORT}`);
  });
});
const shutdown = async () => {
  await observability.shutdown();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
