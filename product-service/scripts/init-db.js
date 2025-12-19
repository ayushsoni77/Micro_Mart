import { connectDatabase } from '../config/database.js';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

const sampleProducts = [
  {
    name: 'Wireless Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life',
    detailedDescription: '• Advanced technology with cutting-edge features\n• Compatible with all major devices and platforms\n• Energy efficient design for extended battery life\n• Premium build quality with durable materials',
    price: 199.99,
    category: 'Electronics',
    images: [
      'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'AudioTech',
    tags: ['wireless', 'noise-cancellation', 'bluetooth'],
    isFeatured: true
  },
  {
    name: 'Smart Watch',
    description: 'Advanced smartwatch with health monitoring, GPS, and water resistance',
    detailedDescription: '• Advanced technology with cutting-edge features\n• Compatible with all major devices and platforms\n• Energy efficient design for extended battery life\n• Premium build quality with durable materials',
    price: 299.99,
    category: 'Electronics',
    images: [
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'SmartTech',
    tags: ['smartwatch', 'health', 'fitness'],
    isFeatured: true
  },
  {
    name: 'Laptop Backpack',
    description: 'Durable laptop backpack with multiple compartments and USB charging port',
    detailedDescription: '• Stylish design that complements any outfit\n• Durable construction for everyday use\n• Multiple compartments for organization\n• Water-resistant and easy to clean',
    price: 79.99,
    category: 'Home & Garden',
    images: [
      'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'TravelPro',
    tags: ['backpack', 'laptop', 'travel'],
    isFeatured: false
  },
  {
    name: 'Coffee Maker',
    description: 'Premium coffee maker with programmable settings and thermal carafe',
    price: 149.99,
    category: 'Home & Garden',
    images: [
      'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'BrewMaster',
    tags: ['coffee', 'kitchen', 'appliance'],
    isFeatured: false
  },
  {
    name: 'Gaming Keyboard',
    description: 'Mechanical gaming keyboard with RGB backlighting and programmable keys',
    price: 129.99,
    category: 'Electronics',
    images: [
      'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'GameTech',
    tags: ['gaming', 'keyboard', 'rgb'],
    isFeatured: false
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking and long battery life',
    price: 49.99,
    category: 'Electronics',
    images: [
      'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1037995/pexels-photo-1037995.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'MouseTech',
    tags: ['wireless', 'mouse', 'ergonomic'],
    isFeatured: false
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 360-degree sound and waterproof design',
    price: 89.99,
    category: 'Electronics',
    images: [
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1037995/pexels-photo-1037995.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'SoundWave',
    tags: ['bluetooth', 'speaker', 'portable'],
    isFeatured: false
  },
  {
    name: 'Fitness Tracker',
    description: 'Advanced fitness tracker with heart rate monitoring and sleep tracking',
    price: 159.99,
    category: 'Sports',
    images: [
      'https://images.pexels.com/photos/1697214/pexels-photo-1697214.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'FitTech',
    tags: ['fitness', 'tracker', 'health'],
    isFeatured: true
  },
  {
    name: 'Desk Lamp',
    description: 'LED desk lamp with adjustable brightness and USB charging port',
    price: 39.99,
    category: 'Home & Garden',
    images: [
      'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'LightTech',
    tags: ['lamp', 'led', 'desk'],
    isFeatured: false
  },
  {
    name: 'Phone Case',
    description: 'Protective phone case with shock absorption and wireless charging support',
    price: 24.99,
    category: 'Electronics',
    images: [
      'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'CaseTech',
    tags: ['phone', 'case', 'protection'],
    isFeatured: false
  },
  {
    name: 'Yoga Mat',
    description: 'Premium yoga mat with non-slip surface and eco-friendly materials',
    price: 34.99,
    category: 'Sports',
    images: [
      'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'YogaTech',
    tags: ['yoga', 'mat', 'fitness'],
    isFeatured: false
  },
  {
    name: 'Water Bottle',
    description: 'Insulated water bottle that keeps drinks cold for 24 hours or hot for 12 hours',
    price: 29.99,
    category: 'Sports',
    images: [
      'https://images.pexels.com/photos/1037995/pexels-photo-1037995.jpeg?auto=compress&cs=tinysrgb&w=500',
      'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'
    ],
    sellerId: 1,
    sellerName: 'TechStore',
    brand: 'HydrateTech',
    tags: ['water', 'bottle', 'insulated'],
    isFeatured: false
  }
];

async function initializeDatabase() {
  try {
    console.log('🧪 Initializing Product Service Database...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('🧹 Cleared existing products');
    
    // Insert sample products
    const products = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${products.length} sample products`);
    
    // Display some stats
    const totalProducts = await Product.countDocuments();
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    const categories = await Product.distinct('category');
    
    console.log('\n📊 Database Statistics:');
    console.log(`   - Total Products: ${totalProducts}`);
    console.log(`   - Featured Products: ${featuredProducts}`);
    console.log(`   - Categories: ${categories.join(', ')}`);
    
    console.log('\n🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    process.exit(0);
  }
}

initializeDatabase(); 