import Product from '../models/Product.js';
import { connectDatabase } from '../config/database.js';

const createSellerProducts = async () => {
  try {
    await connectDatabase();
    console.log('🔄 Creating products for different sellers...');

    // Products for Seller ID 2
    const seller2Products = [
      {
        name: 'Premium Gaming Mouse',
        description: 'High-precision gaming mouse with RGB lighting and programmable buttons',
        detailedDescription: '• 16,000 DPI optical sensor for precise tracking\n• 7 programmable buttons\n• RGB lighting with 16.8 million colors\n• Ergonomic design for long gaming sessions\n• On-board memory for custom profiles',
        price: 89.99,
        category: 'Electronics',
        images: [
          'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=500',
          'https://images.pexels.com/photos/1037995/pexels-photo-1037995.jpeg?auto=compress&cs=tinysrgb&w=500'
        ],
        sellerId: 2,
        sellerName: 'GamingGear Pro',
        brand: 'GameTech',
        tags: ['gaming', 'mouse', 'rgb', 'programmable'],
        isFeatured: true
      },
      {
        name: 'Wireless Gaming Headset',
        description: 'Premium wireless gaming headset with noise cancellation and 7.1 surround sound',
        detailedDescription: '• 7.1 virtual surround sound\n• Active noise cancellation\n• 20-hour battery life\n• Detachable microphone\n• Compatible with PC, PS4, PS5, Xbox',
        price: 149.99,
        category: 'Electronics',
        images: [
          'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=500',
          'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'
        ],
        sellerId: 2,
        sellerName: 'GamingGear Pro',
        brand: 'AudioTech',
        tags: ['gaming', 'headset', 'wireless', 'surround-sound'],
        isFeatured: false
      }
    ];

    // Products for Seller ID 3
    const seller3Products = [
      {
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable organic cotton t-shirt with sustainable materials',
        detailedDescription: '• 100% organic cotton\n• Sustainable and eco-friendly\n• Soft and breathable fabric\n• Available in multiple colors\n• Fair trade certified',
        price: 24.99,
        category: 'Clothing',
        images: [
          'https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg?auto=compress&cs=tinysrgb&w=500',
          'https://images.pexels.com/photos/428339/pexels-photo-428339.jpeg?auto=compress&cs=tinysrgb&w=500'
        ],
        sellerId: 3,
        sellerName: 'EcoFashion',
        brand: 'EcoWear',
        tags: ['organic', 'cotton', 'sustainable', 'eco-friendly'],
        isFeatured: true
      },
      {
        name: 'Bamboo Water Bottle',
        description: 'Eco-friendly bamboo water bottle with stainless steel interior',
        detailedDescription: '• Bamboo exterior with stainless steel interior\n• BPA-free and eco-friendly\n• Keeps drinks cold for 24 hours\n• 500ml capacity\n• Dishwasher safe',
        price: 19.99,
        category: 'Home & Garden',
        images: [
          'https://images.pexels.com/photos/1037995/pexels-photo-1037995.jpeg?auto=compress&cs=tinysrgb&w=500',
          'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=500'
        ],
        sellerId: 3,
        sellerName: 'EcoFashion',
        brand: 'EcoBottle',
        tags: ['bamboo', 'water-bottle', 'eco-friendly', 'sustainable'],
        isFeatured: false
      }
    ];

    // Products for Seller ID 4
    const seller4Products = [
      {
        name: 'Professional Camera Lens',
        description: 'High-quality professional camera lens for DSLR cameras',
        detailedDescription: '• 50mm f/1.8 prime lens\n• Professional grade optics\n• Compatible with major DSLR brands\n• Includes lens cap and hood\n• 1-year warranty',
        price: 299.99,
        category: 'Electronics',
        images: [
          'https://images.pexels.com/photos/51383/photo-camera-subject-photographer-51383.jpeg?auto=compress&cs=tinysrgb&w=500',
          'https://images.pexels.com/photos/51384/photo-camera-subject-photographer-51384.jpeg?auto=compress&cs=tinysrgb&w=500'
        ],
        sellerId: 4,
        sellerName: 'PhotoPro',
        brand: 'LensMaster',
        tags: ['camera', 'lens', 'professional', 'photography'],
        isFeatured: true
      },
      {
        name: 'Camera Tripod',
        description: 'Sturdy aluminum tripod with ball head for professional photography',
        detailedDescription: '• Aluminum construction for durability\n• Ball head for smooth movement\n• Extends to 60 inches\n• Supports up to 15kg\n• Includes carrying case',
        price: 89.99,
        category: 'Electronics',
        images: [
          'https://images.pexels.com/photos/51385/photo-camera-subject-photographer-51385.jpeg?auto=compress&cs=tinysrgb&w=500',
          'https://images.pexels.com/photos/51386/photo-camera-subject-photographer-51386.jpeg?auto=compress&cs=tinysrgb&w=500'
        ],
        sellerId: 4,
        sellerName: 'PhotoPro',
        brand: 'TripodPro',
        tags: ['tripod', 'camera', 'photography', 'professional'],
        isFeatured: false
      }
    ];

    // Create products for each seller
    const allProducts = [...seller2Products, ...seller3Products, ...seller4Products];
    
    for (const productData of allProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Created product "${product.name}" for seller ${product.sellerId} (${product.sellerName})`);
    }

    console.log('🎉 Products created successfully for different sellers!');
    console.log('📊 Now each seller will see only their own products in the dashboard.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating seller products:', error);
    process.exit(1);
  }
};

createSellerProducts(); 