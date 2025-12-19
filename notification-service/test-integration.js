import axios from 'axios';

const NOTIFICATION_SERVICE_URL = 'http://localhost:3004';
const ORDER_SERVICE_URL = 'http://localhost:3003';
const PAYMENT_SERVICE_URL = 'http://localhost:4004';

async function testNotificationIntegration() {
  console.log('🧪 Testing Notification Service Integration...\n');

  try {
    // Test 1: Check if notification service is running
    console.log('1️⃣ Testing notification service health...');
    const healthResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/health`);
    console.log('✅ Notification service is running:', healthResponse.data.status);

    // Test 2: Create a test notification
    console.log('\n2️⃣ Creating test notification...');
    const testNotification = {
      type: 'order_created',
      userId: 1,
      orderId: 999,
      title: 'Integration Test',
      message: 'This is a test notification to verify integration.',
      priority: 'medium',
      category: 'order',
      actionUrl: '/orders/999',
      actionText: 'View Order'
    };

    const createResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications`, testNotification);
    console.log('✅ Test notification created:', createResponse.data.notification.title);

    // Test 3: Get notifications
    console.log('\n3️⃣ Getting notifications...');
    const getResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications?userId=1`);
    console.log(`✅ Found ${getResponse.data.notifications.length} notifications`);

    // Test 4: Get unread count
    console.log('\n4️⃣ Getting unread count...');
    const unreadResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/user/1/unread-count`);
    console.log(`✅ Unread count: ${unreadResponse.data.unreadCount}`);

    // Test 5: Mark notification as read
    console.log('\n5️⃣ Marking notification as read...');
    const notificationId = createResponse.data.notification._id;
    await axios.patch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${notificationId}/read`);
    console.log('✅ Notification marked as read');

    // Test 6: Check updated unread count
    console.log('\n6️⃣ Checking updated unread count...');
    const updatedUnreadResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/user/1/unread-count`);
    console.log(`✅ Updated unread count: ${updatedUnreadResponse.data.unreadCount}`);

    // Test 7: Check order service health
    console.log('\n7️⃣ Testing order service health...');
    try {
      const orderHealthResponse = await axios.get(`${ORDER_SERVICE_URL}/health`);
      console.log('✅ Order service is running:', orderHealthResponse.data.status);
    } catch (error) {
      console.log('❌ Order service is not running or not accessible');
    }

    // Test 8: Check payment service health
    console.log('\n8️⃣ Testing payment service health...');
    try {
      const paymentHealthResponse = await axios.get(`${PAYMENT_SERVICE_URL}/health`);
      console.log('✅ Payment service is running:', paymentHealthResponse.data.status);
    } catch (error) {
      console.log('❌ Payment service is not running or not accessible');
    }

    console.log('\n🎉 All integration tests completed successfully!');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testNotificationIntegration(); 