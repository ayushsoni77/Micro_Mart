import { testConnection } from './config/database.js';
import { Notification } from './models/index.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing Notification Service Database...\n');
    
    await testConnection();
    
    // Test creating a notification
    console.log('📝 Testing notification creation...');
    const testNotification = await Notification.create({
      type: 'system_alert',
      userId: 999,
      title: 'Test Notification',
      message: 'This is a test notification to verify the database connection.',
      priority: 'medium',
      category: 'system',
      metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
    console.log('✅ Test notification created:', testNotification.title);
    
    // Test finding notifications
    console.log('\n🔍 Testing notification queries...');
    const notifications = await Notification.find({ userId: 999 });
    console.log(`✅ Found ${notifications.length} test notifications`);
    
    // Test marking as read
    console.log('\n📖 Testing mark as read...');
    await testNotification.markAsRead();
    console.log('✅ Notification marked as read');
    
    // Test unread count
    console.log('\n📊 Testing unread count...');
    const unreadCount = await Notification.getUnreadCount(999);
    console.log(`✅ Unread count for user 999: ${unreadCount}`);
    
    // Test static methods
    console.log('\n📋 Testing static methods...');
    const unreadNotifications = await Notification.findUnreadByUser(999);
    console.log(`✅ Unread notifications for user 999: ${unreadNotifications.length}`);
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Notification.deleteMany({ userId: 999 });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 