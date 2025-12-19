import { connectDatabase } from '../config/database.js';
import Inventory from '../models/Inventory.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

async function syncInventory() {
  try {
    console.log('🔄 Syncing Inventory with Product Service...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('');
    
    // Fetch actual products from product service
    console.log('📦 Fetching products from product service...');
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`);
    const products = response.data || [];
    console.log(`✅ Fetched ${products.length} products from product service`);
    
    if (products.length === 0) {
      console.log('❌ No products found in product service');
      return;
    }
    
    // Clear existing inventory
    console.log('🧹 Clearing existing inventory...');
    await Inventory.deleteMany({});
    console.log('✅ Cleared existing inventory');
    
    // Create inventory entries for each product
    const inventoryEntries = [];
    const stockLevels = [50, 30, 100, 25, 75, 45, 60, 80, 40, 90, 35, 70];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const stock = stockLevels[i % stockLevels.length] + Math.floor(Math.random() * 20);
      
      inventoryEntries.push({
        productId: product._id, // Use actual MongoDB ObjectId
        stock: stock,
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
          aisle: `A${Math.floor(i / 3) + 1}`,
          shelf: `S${(i % 3) + 1}`,
          bin: `B${i + 1}`
        },
        notes: `Inventory for ${product.name}`
      });
    }
    
    // Insert inventory entries
    console.log('📝 Creating inventory entries...');
    const inventory = await Inventory.insertMany(inventoryEntries);
    console.log(`✅ Created ${inventory.length} inventory entries`);
    
    // Display results
    console.log('\n📊 Sync Results:');
    console.log(`   - Products in Product Service: ${products.length}`);
    console.log(`   - Inventory Entries Created: ${inventory.length}`);
    
    // Show some sample entries
    console.log('\n📦 Sample Inventory Entries:');
    const sampleItems = await Inventory.find().limit(5);
    sampleItems.forEach(item => {
      const product = products.find(p => p._id === item.productId);
      console.log(`   - ${product?.name || 'Unknown Product'}: ${item.stock} in stock`);
    });
    
    console.log('\n🎉 Inventory sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Inventory sync failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  } finally {
    process.exit(0);
  }
}

syncInventory(); 