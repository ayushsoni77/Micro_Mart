import { connectDatabase } from '../config/database.js';
import Inventory from '../models/Inventory.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Sample inventory data for the products we created in product-service
const sampleInventory = [
  {
    stock: 50,
    reserved: 0,
    lowStockThreshold: 10,
    reorderPoint: 5,
    supplier: {
      name: 'TechSupplies Inc.',
      contact: 'supplier@techsupplies.com',
      leadTime: 7,
      minimumOrder: 10
    },
    location: {
      warehouse: 'Main Warehouse',
      aisle: 'A1',
      shelf: 'S1',
      bin: 'B1'
    },
    notes: 'High-demand product, monitor closely'
  },
  {
    stock: 30,
    reserved: 0,
    lowStockThreshold: 5,
    reorderPoint: 3,
    supplier: {
      name: 'SmartTech Solutions',
      contact: 'orders@smarttech.com',
      leadTime: 5,
      minimumOrder: 5
    },
    location: {
      warehouse: 'Main Warehouse',
      aisle: 'A2',
      shelf: 'S2',
      bin: 'B2'
    },
    notes: 'Premium product, maintain quality stock'
  },
  {
    stock: 100,
    reserved: 0,
    lowStockThreshold: 20,
    reorderPoint: 10,
    supplier: {
      name: 'TravelGear Pro',
      contact: 'sales@travelgear.com',
      leadTime: 3,
      minimumOrder: 20
    },
    location: {
      warehouse: 'Main Warehouse',
      aisle: 'A3',
      shelf: 'S3',
      bin: 'B3'
    },
    notes: 'Bulk item, good profit margin'
  }
];

async function initializeDatabase() {
  try {
    console.log('🧪 Initializing Inventory Service Database...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('');
    
    // Clear existing inventory
    await Inventory.deleteMany({});
    console.log('🧹 Cleared existing inventory');
    
    // Fetch actual product IDs from product service
    let products = [];
    try {
      console.log('📦 Fetching products from product service...');
      const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`);
      products = response.data || [];
      console.log(`✅ Fetched ${products.length} products from product service`);
    } catch (error) {
      console.log(`⚠️ Product service unavailable: ${error.message}`);
      console.log('📝 Using placeholder product IDs for testing...');
      // Create placeholder products for testing
      for (let i = 0; i < 12; i++) {
        products.push({ _id: `product_${i + 1}` });
      }
    }
    
    // Create inventory entries for each product
    const inventoryEntries = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const sampleData = sampleInventory[i % sampleInventory.length];
      
      inventoryEntries.push({
        productId: product._id || product.id, // Use actual MongoDB ObjectId
        stock: sampleData.stock + Math.floor(Math.random() * 20),
        reserved: 0,
        lowStockThreshold: sampleData.lowStockThreshold,
        reorderPoint: sampleData.reorderPoint,
        supplier: sampleData.supplier,
        location: sampleData.location,
        notes: sampleData.notes
      });
    }
    
    // Insert sample inventory
    const inventory = await Inventory.insertMany(inventoryEntries);
    console.log(`✅ Inserted ${inventory.length} inventory entries`);
    
    // Display some stats
    const totalInventory = await Inventory.countDocuments();
    const lowStockItems = await Inventory.findLowStock();
    const reorderItems = await Inventory.findReorderNeeded();
    
    console.log('\n📊 Database Statistics:');
    console.log(`   - Total Inventory Items: ${totalInventory}`);
    console.log(`   - Low Stock Items: ${lowStockItems.length}`);
    console.log(`   - Items Needing Reorder: ${reorderItems.length}`);
    
    // Show some sample inventory
    const sampleItems = await Inventory.find().limit(3);
    console.log('\n📦 Sample Inventory Items:');
    sampleItems.forEach(item => {
      console.log(`   - Product ${item.productId}: ${item.stock} in stock, ${item.reserved} reserved`);
    });
    
    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    process.exit(0);
  }
}

initializeDatabase(); 