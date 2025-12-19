import { connectDatabase } from '../config/database.js';
import Inventory from '../models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

// Product IDs from the logs
const productIds = [
  '6887a5efac6f7812b4492ab4',
  '6887a5efac6f7812b4492ab5',
  '6887a5efac6f7812b4492ab6',
  '6887a5efac6f7812b4492ab7',
  '6887a5efac6f7812b4492ab8',
  '6887a5efac6f7812b4492ab9',
  '6887a5efac6f7812b4492aba',
  '6887a5efac6f7812b4492abb',
  '6887a5efac6f7812b4492abc',
  '6887a5efac6f7812b4492abd',
  '6887a5efac6f7812b4492abe',
  '6887a5efac6f7812b4492abf'
];

const stockLevels = [50, 30, 100, 25, 75, 45, 60, 80, 40, 90, 35, 70];

async function createInventoryManual() {
  try {
    console.log('🔄 Creating Inventory Entries Manually...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('');
    
    // Clear existing inventory
    console.log('🧹 Clearing existing inventory...');
    await Inventory.deleteMany({});
    console.log('✅ Cleared existing inventory');
    
    // Create inventory entries for each product ID
    const inventoryEntries = [];
    
    for (let i = 0; i < productIds.length; i++) {
      const productId = productIds[i];
      const stock = stockLevels[i] + Math.floor(Math.random() * 20);
      
      inventoryEntries.push({
        productId: productId,
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
        notes: `Inventory for product ${i + 1}`
      });
    }
    
    // Insert inventory entries
    console.log('📝 Creating inventory entries...');
    const inventory = await Inventory.insertMany(inventoryEntries);
    console.log(`✅ Created ${inventory.length} inventory entries`);
    
    // Display results
    console.log('\n📊 Results:');
    console.log(`   - Product IDs: ${productIds.length}`);
    console.log(`   - Inventory Entries Created: ${inventory.length}`);
    
    // Show some sample entries
    console.log('\n📦 Sample Inventory Entries:');
    const sampleItems = await Inventory.find().limit(5);
    sampleItems.forEach((item, index) => {
      console.log(`   - Product ${index + 1}: ${item.stock} in stock`);
    });
    
    console.log('\n🎉 Manual inventory creation completed successfully!');
    
  } catch (error) {
    console.error('❌ Manual inventory creation failed:', error.message);
  } finally {
    process.exit(0);
  }
}

createInventoryManual(); 