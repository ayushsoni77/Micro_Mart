import { Order, OrderItem } from '../models/index.js';
import sequelize from '../models/index.js';

const createTestOrders = async () => {
  try {
    console.log('🔄 Creating test orders for analytics...');

    // Clear existing test orders (optional)
    // await Order.destroy({ where: {} });
    // await OrderItem.destroy({ where: {} });

    const testOrders = [
      {
        orderNumber: `ORD-${Date.now()}-001`,
        userId: 1,
        userName: 'John Doe',
        userEmail: 'john@example.com',
        totalAmount: 299.98,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        items: [
          {
            productId: '6887a5efac6f7812b4492ab4', // Wireless Headphones
            productName: 'Wireless Headphones',
            quantity: 1,
            unitPrice: 199.99,
            totalPrice: 199.99
          },
          {
            productId: '6887a5efac6f7812b4492ab5', // Smart Watch
            productName: 'Smart Watch',
            quantity: 1,
            unitPrice: 299.99,
            totalPrice: 299.99
          }
        ],
        createdAt: new Date('2025-01-25T10:00:00Z')
      },
      {
        orderNumber: `ORD-${Date.now()}-002`,
        userId: 2,
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        totalAmount: 159.98,
        status: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        items: [
          {
            productId: '6887a5efac6f7812b4492ab6', // Laptop Backpack
            productName: 'Laptop Backpack',
            quantity: 2,
            unitPrice: 79.99,
            totalPrice: 159.98
          }
        ],
        createdAt: new Date('2025-01-26T14:30:00Z')
      },
      {
        orderNumber: `ORD-${Date.now()}-003`,
        userId: 3,
        userName: 'Mike Johnson',
        userEmail: 'mike@example.com',
        totalAmount: 449.97,
        status: 'processing',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        shippingAddress: {
          street: '789 Pine St',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        items: [
          {
            productId: '6887a5efac6f7812b4492ab4', // Wireless Headphones
            productName: 'Wireless Headphones',
            quantity: 1,
            unitPrice: 199.99,
            totalPrice: 199.99
          },
          {
            productId: '6887a5efac6f7812b4492ab7', // Coffee Maker
            productName: 'Coffee Maker',
            quantity: 1,
            unitPrice: 149.99,
            totalPrice: 149.99
          },
          {
            productId: '6887a5efac6f7812b4492ab8', // Gaming Keyboard
            productName: 'Gaming Keyboard',
            quantity: 1,
            unitPrice: 129.99,
            totalPrice: 129.99
          }
        ],
        createdAt: new Date('2025-01-27T09:15:00Z')
      },
      {
        orderNumber: `ORD-${Date.now()}-004`,
        userId: 4,
        userName: 'Sarah Wilson',
        userEmail: 'sarah@example.com',
        totalAmount: 89.98,
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod: 'Debit Card',
        shippingAddress: {
          street: '321 Elm St',
          city: 'Miami',
          state: 'FL',
          zipCode: '33101',
          country: 'USA'
        },
        items: [
          {
            productId: '6887a5efac6f7812b4492ab9', // Wireless Mouse
            productName: 'Wireless Mouse',
            quantity: 1,
            unitPrice: 49.99,
            totalPrice: 49.99
          },
          {
            productId: '6887a5efac6f7812b4492aba', // Bluetooth Speaker
            productName: 'Bluetooth Speaker',
            quantity: 1,
            unitPrice: 89.99,
            totalPrice: 89.99
          }
        ],
        createdAt: new Date('2025-01-28T16:45:00Z')
      },
      {
        orderNumber: `ORD-${Date.now()}-005`,
        userId: 5,
        userName: 'David Brown',
        userEmail: 'david@example.com',
        totalAmount: 194.97,
        status: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'Credit Card',
        shippingAddress: {
          street: '654 Maple Dr',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'USA'
        },
        items: [
          {
            productId: '6887a5efac6f7812b4492abb', // Fitness Tracker
            productName: 'Fitness Tracker',
            quantity: 1,
            unitPrice: 159.99,
            totalPrice: 159.99
          },
          {
            productId: '6887a5efac6f7812b4492abc', // Desk Lamp
            productName: 'Desk Lamp',
            quantity: 1,
            unitPrice: 39.99,
            totalPrice: 39.99
          }
        ],
        createdAt: new Date('2025-01-29T11:20:00Z')
      }
    ];

    for (const orderData of testOrders) {
      const { items, ...orderFields } = orderData;
      
      // Create order
      const order = await Order.create(orderFields);
      
      // Create order items
      for (const itemData of items) {
        await OrderItem.create({
          orderId: order.id,
          ...itemData
        });
      }
      
      console.log(`✅ Created order ${order.orderNumber} with ${items.length} items`);
    }

    console.log('🎉 Test orders created successfully!');
    console.log('📊 You can now test the analytics dashboard with real data.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test orders:', error);
    process.exit(1);
  }
};

createTestOrders(); 