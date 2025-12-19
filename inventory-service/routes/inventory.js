import express from 'express';
import { 
  getInventory, 
  createOrUpdateInventory, 
  reserveStock, 
  releaseStock, 
  confirmReservedStock, 
  addStock, 
  getLowStockItems, 
  getReorderItems, 
  getAllInventory 
} from '../controllers/inventoryController.js';

const router = express.Router();

// Get inventory for a specific product
router.get('/:productId', getInventory);

// Get all inventory
router.get('/', getAllInventory);

// Create or update inventory
router.post('/', createOrUpdateInventory);

// Reserve stock for an order
router.post('/reserve', reserveStock);

// Release reserved stock
router.post('/release', releaseStock);

// Confirm reserved stock (for completed orders)
router.post('/confirm', confirmReservedStock);

// Add stock (restock)
router.post('/add-stock', addStock);

// Get low stock items
router.get('/alerts/low-stock', getLowStockItems);

// Get items needing reorder
router.get('/alerts/reorder', getReorderItems);

export default router;