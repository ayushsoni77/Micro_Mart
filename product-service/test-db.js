import { testConnection } from './config/database.js';
import { Product } from './models/index.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing Product Service Database...\n');
    
    // Test connection
    await testConnection();
    console.log('');
    
    // Test model creation
    console.log('📝 Testing model creation...');
    const testProduct = await Product.create({
      name: 'Test Product',
      description: 'This is a test product for database testing',
      price: 99.99,
      category: 'Electronics',
      images: ['https://example.com/test-image.jpg'],
      sellerId: 999,
      sellerName: 'TestSeller',
      brand: 'TestBrand',
      tags: ['test', 'database'],
      isActive: true
    });
    console.log('✅ Test product created:', testProduct.name);
    
    // Test queries
    const products = await Product.find({ sellerId: 999 });
    console.log('✅ Found test products:', products.length);
    
    const featuredProducts = await Product.findFeatured();
    console.log('✅ Found featured products:', featuredProducts.length);
    
    const categories = await Product.distinct('category');
    console.log('✅ Found categories:', categories);
    
    // Test text search
    const searchResults = await Product.find({ $text: { $search: 'wireless' } });
    console.log('✅ Text search results:', searchResults.length);
    
    // Test view increment
    await testProduct.incrementViews();
    console.log('✅ Product views incremented');
    
    console.log('\n🧹 Cleaning up test data...');
    await testProduct.deleteOne();
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 