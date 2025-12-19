import Inventory from '../models/Inventory.js';
import axios from 'axios';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Get inventory for a specific product
export const getInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(`📦 Inventory request for product: ${productId}`);

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      console.log(`❌ Inventory not found for product: ${productId}`);
      return res.status(404).json({ message: 'Inventory not found' });
    }

    console.log(`✅ Inventory found for product ${productId}:`, {
      stock: inventory.stock,
      reserved: inventory.reserved,
      available: inventory.available,
      status: inventory.status
    });

    res.json({
      productId: inventory.productId,
      stock: inventory.stock,
      reserved: inventory.reserved,
      available: inventory.available,
      total: inventory.total,
      status: inventory.status,
      lowStockThreshold: inventory.lowStockThreshold,
      reorderPoint: inventory.reorderPoint,
      lastUpdated: inventory.lastUpdated,
      lastRestocked: inventory.lastRestocked
    });
  } catch (error) {
    console.error('❌ Get inventory error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create or update inventory for a product
export const createOrUpdateInventory = async (req, res) => {
  try {
    const { productId, stock, lowStockThreshold, reorderPoint, supplier, location, notes } = req.body;
    console.log(`📦 Creating/updating inventory for product: ${productId}`);

    // Verify product exists
    try {
      const productResponse = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`);
      if (!productResponse.data) {
        return res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.log(`⚠️ Product service unavailable:`, error.message);
      // Continue without product verification in case product service is down
    }

    // Find existing inventory or create new one
    let inventory = await Inventory.findOne({ productId });

    if (inventory) {
      // Update existing inventory
      if (stock !== undefined) inventory.stock = stock;
      if (lowStockThreshold !== undefined) inventory.lowStockThreshold = lowStockThreshold;
      if (reorderPoint !== undefined) inventory.reorderPoint = reorderPoint;
      if (supplier) inventory.supplier = supplier;
      if (location) inventory.location = location;
      if (notes) inventory.notes = notes;

      await inventory.save();
      console.log(`✅ Inventory updated for product ${productId}`);
    } else {
      // Create new inventory
      inventory = new Inventory({
        productId,
        stock: stock || 0,
        lowStockThreshold: lowStockThreshold || 10,
        reorderPoint: reorderPoint || 5,
        supplier,
        location,
        notes
      });

      await inventory.save();
      console.log(`✅ Inventory created for product ${productId}`);
    }

    res.json({
      message: 'Inventory updated successfully',
      inventory: {
        productId: inventory.productId,
        stock: inventory.stock,
        reserved: inventory.reserved,
        available: inventory.available,
        total: inventory.total,
        status: inventory.status,
        lowStockThreshold: inventory.lowStockThreshold,
        reorderPoint: inventory.reorderPoint,
        lastUpdated: inventory.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Create/update inventory error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reserve stock for an order
export const reserveStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log(`📦 Reserving ${quantity} units for product: ${productId}`);

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      console.log(`❌ Inventory not found for product: ${productId}`);
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.stock < quantity) {
      console.log(`❌ Insufficient stock for product ${productId}: requested ${quantity}, available ${inventory.stock}`);
      return res.status(400).json({ 
        message: 'Insufficient stock available',
        available: inventory.stock,
        requested: quantity
      });
    }

    await inventory.reserveStock(quantity);

    console.log(`✅ Stock reserved for product ${productId}:`, {
      reserved: quantity,
      remaining: inventory.stock,
      totalReserved: inventory.reserved
    });

    res.json({
      message: 'Stock reserved successfully',
      reserved: quantity,
      remaining: inventory.stock,
      totalReserved: inventory.reserved
    });
  } catch (error) {
    console.error('❌ Reserve stock error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Release reserved stock
export const releaseStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log(`📦 Releasing ${quantity} reserved units for product: ${productId}`);

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      console.log(`❌ Inventory not found for product: ${productId}`);
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.reserved < quantity) {
      console.log(`❌ Insufficient reserved stock for product ${productId}: requested ${quantity}, reserved ${inventory.reserved}`);
      return res.status(400).json({ 
        message: 'Insufficient reserved stock to release',
        reserved: inventory.reserved,
        requested: quantity
      });
    }

    await inventory.releaseReserved(quantity);

    console.log(`✅ Reserved stock released for product ${productId}:`, {
      released: quantity,
      remaining: inventory.stock,
      totalReserved: inventory.reserved
    });

    res.json({
      message: 'Reserved stock released successfully',
      released: quantity,
      remaining: inventory.stock,
      totalReserved: inventory.reserved
    });
  } catch (error) {
    console.error('❌ Release stock error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm reserved stock (for completed orders)
export const confirmReservedStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log(`📦 Confirming ${quantity} reserved units for product: ${productId}`);

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      console.log(`❌ Inventory not found for product: ${productId}`);
      return res.status(404).json({ message: 'Inventory not found' });
    }

    if (inventory.reserved < quantity) {
      console.log(`❌ Insufficient reserved stock for product ${productId}: requested ${quantity}, reserved ${inventory.reserved}`);
      return res.status(400).json({ 
        message: 'Insufficient reserved stock to confirm',
        reserved: inventory.reserved,
        requested: quantity
      });
    }

    await inventory.confirmReserved(quantity);

    console.log(`✅ Reserved stock confirmed for product ${productId}:`, {
      confirmed: quantity,
      remaining: inventory.stock,
      totalReserved: inventory.reserved
    });

    res.json({
      message: 'Reserved stock confirmed successfully',
      confirmed: quantity,
      remaining: inventory.stock,
      totalReserved: inventory.reserved
    });
  } catch (error) {
    console.error('❌ Confirm reserved stock error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add stock (restock)
export const addStock = async (req, res) => {
  try {
    const { productId, quantity, notes } = req.body;
    console.log(`📦 Adding ${quantity} units to product: ${productId}`);

    const inventory = await Inventory.findOne({ productId });

    if (!inventory) {
      console.log(`❌ Inventory not found for product: ${productId}`);
      return res.status(404).json({ message: 'Inventory not found' });
    }

    await inventory.addStock(quantity, notes);

    console.log(`✅ Stock added for product ${productId}:`, {
      added: quantity,
      newTotal: inventory.stock,
      lastRestocked: inventory.lastRestocked
    });

    res.json({
      message: 'Stock added successfully',
      added: quantity,
      newTotal: inventory.stock,
      lastRestocked: inventory.lastRestocked
    });
  } catch (error) {
    console.error('❌ Add stock error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    console.log(`📦 Getting low stock items`);

    const lowStockItems = await Inventory.findLowStock();

    console.log(`✅ Found ${lowStockItems.length} low stock items`);

    res.json({
      lowStockItems: lowStockItems.map(item => ({
        productId: item.productId,
        stock: item.stock,
        lowStockThreshold: item.lowStockThreshold,
        status: item.status,
        lastUpdated: item.lastUpdated
      }))
    });
  } catch (error) {
    console.error('❌ Get low stock items error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get items needing reorder
export const getReorderItems = async (req, res) => {
  try {
    console.log(`📦 Getting items needing reorder`);

    const reorderItems = await Inventory.findReorderNeeded();

    console.log(`✅ Found ${reorderItems.length} items needing reorder`);

    res.json({
      reorderItems: reorderItems.map(item => ({
        productId: item.productId,
        stock: item.stock,
        reorderPoint: item.reorderPoint,
        status: item.status,
        lastUpdated: item.lastUpdated
      }))
    });
  } catch (error) {
    console.error('❌ Get reorder items error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all inventory
export const getAllInventory = async (req, res) => {
  try {
    console.log(`📦 Getting all inventory`);

    const allInventory = await Inventory.find().sort({ lastUpdated: -1 });

    console.log(`✅ Found ${allInventory.length} inventory items`);

    res.json({
      inventory: allInventory.map(item => ({
        productId: item.productId,
        stock: item.stock,
        reserved: item.reserved,
        available: item.available,
        total: item.total,
        status: item.status,
        lowStockThreshold: item.lowStockThreshold,
        reorderPoint: item.reorderPoint,
        lastUpdated: item.lastUpdated,
        lastRestocked: item.lastRestocked
      }))
    });
  } catch (error) {
    console.error('❌ Get all inventory error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};