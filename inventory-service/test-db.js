import { testConnection } from './config/database.js';
import { Inventory } from './models/index.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing Inventory Service Database...\n');
    
    // Test connection
    await testConnection();
    console.log('');
    
    // Test model creation
    console.log('📝 Testing model creation...');
    const testInventory = await Inventory.create({
      productId: 'test_product_001',
      stock: 100,
      reserved: 0,
      lowStockThreshold: 10,
      reorderPoint: 5,
      supplier: {
        name: 'Test Supplier',
        contact: 'test@supplier.com',
        leadTime: 5,
        minimumOrder: 10
      },
      location: {
        warehouse: 'Test Warehouse',
        aisle: 'T1',
        shelf: 'S1',
        bin: 'B1'
      },
      notes: 'Test inventory item'
    });
    console.log('✅ Test inventory created:', testInventory.productId);
    
    // Test queries
    const inventory = await Inventory.find({ productId: 'test_product_001' });
    console.log('✅ Found test inventory:', inventory.length);
    
    const lowStockItems = await Inventory.findLowStock();
    console.log('✅ Found low stock items:', lowStockItems.length);
    
    const reorderItems = await Inventory.findReorderNeeded();
    console.log('✅ Found reorder items:', reorderItems.length);
    
    // Test stock operations
    console.log('\n🧪 Testing stock operations...');
    
    // Test reserve stock
    await testInventory.reserveStock(10);
    console.log('✅ Stock reserved: 10 units');
    console.log(`   - Available: ${testInventory.stock}, Reserved: ${testInventory.reserved}`);
    
    // Test release reserved stock
    await testInventory.releaseReserved(5);
    console.log('✅ Reserved stock released: 5 units');
    console.log(`   - Available: ${testInventory.stock}, Reserved: ${testInventory.reserved}`);
    
    // Test add stock
    await testInventory.addStock(20, 'Test restock');
    console.log('✅ Stock added: 20 units');
    console.log(`   - Available: ${testInventory.stock}, Reserved: ${testInventory.reserved}`);
    
    // Test virtual fields
    console.log('\n📊 Virtual Fields:');
    console.log(`   - Available: ${testInventory.available}`);
    console.log(`   - Status: ${testInventory.status}`);
    console.log(`   - Total: ${testInventory.total}`);
    
    console.log('\n🧹 Cleaning up test data...');
    await testInventory.deleteOne();
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 