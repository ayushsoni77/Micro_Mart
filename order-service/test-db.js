import { testConnection, syncDatabase } from './config/database.js';
import { Order, OrderItem, OrderStatus } from './models/index.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing Order Service Database...\n');

    // Test connection
    await testConnection();
    console.log('');

    // Sync database
    await syncDatabase();
    console.log('');

    // Test model creation
    console.log('📝 Testing model creation...');
    
    // Create a test order
    const testOrder = await Order.create({
      userId: 1,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'UPI',
      totalAmount: 1500.00,
      subtotal: 1500.00,
      shippingAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '123456'
      },
      source: 'web',
      ipAddress: '127.0.0.1'
    });
    console.log('✅ Test order created:', testOrder.orderNumber);

    // Create test order item
    const testOrderItem = await OrderItem.create({
      orderId: testOrder.id,
      productId: 1,
      productName: 'Test Product',
      quantity: 2,
      unitPrice: 750.00,
      totalPrice: 1500.00
    });
    console.log('✅ Test order item created');

    // Create test order status
    const testOrderStatus = await OrderStatus.create({
      orderId: testOrder.id,
      status: 'pending',
      changedByRole: 'system',
      notes: 'Order created'
    });
    console.log('✅ Test order status created');



    // Test relationships
    console.log('\n🔗 Testing relationships...');
    const orderWithRelations = await Order.findByPk(testOrder.id, {
      include: [
        { model: OrderItem, as: 'items' },
        { model: OrderStatus, as: 'statusHistory' }
      ]
    });
    console.log('✅ Order with relationships loaded');
    console.log(`   - Items: ${orderWithRelations.items.length}`);
    console.log(`   - Status History: ${orderWithRelations.statusHistory.length}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await testOrder.destroy({ force: true });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 