import { testConnection, syncDatabase } from './config/database.js';
import { PaymentTransaction } from './models/index.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing Payment Service Database...\n');

    // Test connection
    await testConnection();
    console.log('');

    // Sync database
    await syncDatabase();
    console.log('');

    // Test model creation
    console.log('📝 Testing model creation...');
    
    // Create a test payment transaction
    const testTransaction = await PaymentTransaction.create({
      orderId: 1,
      userId: 1,
      transactionId: 'TXN_TEST_001',
      paymentMethod: 'UPI',
      amount: 1500.00,
      status: 'completed',
      gateway: 'Razorpay',
      gatewayOrderId: 'order_test_001',
      gatewayResponse: {
        order_id: 'order_test_001',
        payment_id: 'pay_test_001'
      },
      ipAddress: '127.0.0.1'
    });
    console.log('✅ Test payment transaction created:', testTransaction.transactionId);

    // Test querying
    const transactions = await PaymentTransaction.findAll({
      where: { orderId: 1 }
    });
    console.log('✅ Found transactions:', transactions.length);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await testTransaction.destroy({ force: true });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 