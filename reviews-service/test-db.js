import { testConnection } from './config/database.js';
import { Review } from './models/index.js';

async function testDatabase() {
  try {
    console.log('🧪 Testing Review Service Database...\n');
    
    await testConnection();
    
    // Test creating a review
    console.log('📝 Testing review creation...');
    const testReview = await Review.create({
      productId: 'test_product_123',
      userId: 999,
      userName: 'Test User',
      userEmail: 'test@example.com',
      rating: 4,
      title: 'Test Review',
      comment: 'This is a test review to verify the database connection.',
      verifiedPurchase: false,
      status: 'approved'
    });
    console.log('✅ Test review created:', testReview.title);
    
    // Test finding reviews
    console.log('\n🔍 Testing review queries...');
    const reviews = await Review.find({ userId: 999 });
    console.log(`✅ Found ${reviews.length} test reviews`);
    
    // Test helpful voting
    console.log('\n👍 Testing helpful voting...');
    await testReview.addVote(888, true);
    console.log('✅ Vote added successfully');
    console.log(`   - Helpful votes: ${testReview.helpful}`);
    console.log(`   - Not helpful votes: ${testReview.notHelpful}`);
    
    // Test static methods
    console.log('\n📋 Testing static methods...');
    const productReviews = await Review.findByProduct('test_product_123');
    console.log(`✅ Product reviews: ${productReviews.length}`);
    
    const userReviews = await Review.findByUser(999);
    console.log(`✅ User reviews: ${userReviews.length}`);
    
    // Test aggregation
    console.log('\n📊 Testing aggregation...');
    const stats = await Review.getProductStats('test_product_123');
    console.log('✅ Product stats:', stats[0] || 'No stats available');
    
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Review.deleteMany({ userId: 999 });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All database tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase(); 