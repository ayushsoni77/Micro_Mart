import { connectDatabase } from '../config/database.js';
import Notification from '../models/Notification.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

const sampleNotifications = [
  {
    type: 'order_created',
    userId: 1,
    orderId: 1,
    title: 'Order Confirmed',
    message: 'Your order #ORD-20250728-001 has been successfully placed and confirmed.',
    priority: 'medium',
    category: 'order',
    actionUrl: '/orders/1',
    actionText: 'View Order',
    metadata: {
      orderNumber: 'ORD-20250728-001',
      totalAmount: 579.97
    }
  },
  {
    type: 'payment_success',
    userId: 1,
    orderId: 2,
    title: 'Payment Successful',
    message: 'Payment for order #ORD-20250728-002 has been processed successfully.',
    priority: 'high',
    category: 'payment',
    actionUrl: '/orders/2',
    actionText: 'View Order',
    metadata: {
      orderNumber: 'ORD-20250728-002',
      paymentMethod: 'UPI',
      amount: 579.97
    }
  },
  {
    type: 'shipment_update',
    userId: 1,
    orderId: 1,
    title: 'Order Shipped',
    message: 'Your order #ORD-20250728-001 has been shipped and is on its way to you.',
    priority: 'medium',
    category: 'shipment',
    actionUrl: '/orders/1',
    actionText: 'Track Order',
    metadata: {
      orderNumber: 'ORD-20250728-001',
      trackingNumber: 'TRK123456789',
      estimatedDelivery: '2025-07-30'
    }
  },
  {
    type: 'delivery_update',
    userId: 1,
    orderId: 1,
    title: 'Order Delivered',
    message: 'Your order #ORD-20250728-001 has been delivered successfully.',
    priority: 'medium',
    category: 'shipment',
    actionUrl: '/orders/1',
    actionText: 'View Order',
    metadata: {
      orderNumber: 'ORD-20250728-001',
      deliveredAt: '2025-07-29T10:30:00Z'
    }
  },
  {
    type: 'system_alert',
    userId: 1,
    title: 'System Maintenance',
    message: 'We will be performing scheduled maintenance on July 30th from 2:00 AM to 4:00 AM. Some services may be temporarily unavailable.',
    priority: 'low',
    category: 'system',
    metadata: {
      maintenanceWindow: '2025-07-30T02:00:00Z to 2025-07-30T04:00:00Z'
    }
  },
  {
    type: 'promotional',
    userId: 1,
    title: 'Special Offer - 20% Off',
    message: 'Get 20% off on all electronics! Use code ELECTRONICS20 at checkout. Offer valid until July 31st.',
    priority: 'medium',
    category: 'promotional',
    actionUrl: '/products?category=Electronics',
    actionText: 'Shop Now',
    expiresAt: new Date('2025-07-31T23:59:59Z'),
    metadata: {
      discountCode: 'ELECTRONICS20',
      discountPercentage: 20,
      validUntil: '2025-07-31T23:59:59Z'
    }
  },
  {
    type: 'order_status_update',
    userId: 1,
    orderId: 2,
    title: 'Order Processing',
    message: 'Your order #ORD-20250728-002 is now being processed and will be shipped soon.',
    priority: 'medium',
    category: 'order',
    actionUrl: '/orders/2',
    actionText: 'View Order',
    metadata: {
      orderNumber: 'ORD-20250728-002',
      status: 'processing'
    }
  },
  {
    type: 'payment_failed',
    userId: 1,
    orderId: 3,
    title: 'Payment Failed',
    message: 'Payment for order #ORD-20250728-003 failed. Please try again or use a different payment method.',
    priority: 'urgent',
    category: 'payment',
    actionUrl: '/orders/3',
    actionText: 'Retry Payment',
    metadata: {
      orderNumber: 'ORD-20250728-003',
      failureReason: 'Insufficient funds',
      retryCount: 1
    }
  }
];

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Notification Service Database...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('');
    
    // Clear existing notifications
    console.log('🧹 Clearing existing notifications...');
    await Notification.deleteMany({});
    console.log('✅ Cleared existing notifications');
    
    // Insert sample notifications
    console.log('📝 Creating sample notifications...');
    const notifications = await Notification.insertMany(sampleNotifications);
    console.log(`✅ Created ${notifications.length} sample notifications`);
    
    // Display statistics
    console.log('\n📊 Database Statistics:');
    const totalCount = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ read: false });
    const readCount = await Notification.countDocuments({ read: true });
    
    console.log(`   - Total Notifications: ${totalCount}`);
    console.log(`   - Unread Notifications: ${unreadCount}`);
    console.log(`   - Read Notifications: ${readCount}`);
    
    // Show notification types
    const typeStats = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📋 Notification Types:');
    typeStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count}`);
    });
    
    // Show categories
    const categoryStats = await Notification.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📂 Categories:');
    categoryStats.forEach(stat => {
      console.log(`   - ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n🎉 Notification Service database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    process.exit(0);
  }
}

initializeDatabase(); 