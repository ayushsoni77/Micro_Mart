import express from 'express';
import cors from 'cors';
import cartRoutes from './routes/cart.js';

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cart', cartRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Cart Service is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🛒 Cart Service running on port ${PORT}`);
}); 