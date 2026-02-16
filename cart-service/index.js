import express from 'express';
import cors from 'cors';
import cartRoutes from './routes/cart.js';
import { initializeObservability } from './observability.js';

const app = express();
const PORT = process.env.PORT || 3007;
const observability = await initializeObservability({ serviceName: 'cart-service' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(observability.metricsMiddleware);

// Routes
app.use('/api/cart', cartRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Cart Service is running', timestamp: new Date().toISOString() });
});

observability.registerMetricsEndpoint(app);

app.listen(PORT, () => {
  console.log(`🛒 Cart Service running on port ${PORT}`);
}); 
const shutdown = async () => {
  await observability.shutdown();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
