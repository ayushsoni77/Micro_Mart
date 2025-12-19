import { connectDatabase } from '../config/database.js';
import Review from '../models/Review.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../config.env' });

const sampleReviews = [
  {
    productId: '6887a5efac6f7812b4492ab4',
    userId: 1,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    rating: 5,
    title: 'Excellent Wireless Headphones',
    comment: 'These headphones are absolutely amazing! The sound quality is crystal clear and the battery life is impressive. I can use them for hours without any discomfort. The noise cancellation feature works perfectly for my daily commute. Highly recommended!',
    helpful: 12,
    notHelpful: 1,
    verifiedPurchase: true,
    orderId: 1,
    status: 'approved',
    votes: [
      { userId: 2, helpful: true, votedAt: new Date('2025-07-28T10:00:00Z') },
      { userId: 3, helpful: true, votedAt: new Date('2025-07-28T11:30:00Z') },
      { userId: 4, helpful: false, votedAt: new Date('2025-07-28T12:15:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492ab4',
    userId: 2,
    userName: 'Sarah Wilson',
    userEmail: 'sarah.wilson@example.com',
    rating: 4,
    title: 'Great Sound Quality',
    comment: 'Really good headphones for the price. The sound is clear and the build quality feels solid. The only minor issue is that the ear cushions could be a bit softer for extended use. Overall, very satisfied with my purchase.',
    helpful: 8,
    notHelpful: 2,
    verifiedPurchase: true,
    orderId: 2,
    status: 'approved',
    votes: [
      { userId: 1, helpful: true, votedAt: new Date('2025-07-28T14:20:00Z') },
      { userId: 3, helpful: true, votedAt: new Date('2025-07-28T15:45:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492ab5',
    userId: 1,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    rating: 5,
    title: 'Perfect Smart Watch',
    comment: 'This smartwatch exceeded my expectations! The fitness tracking is accurate, the battery lasts for days, and the notifications work seamlessly. The design is sleek and it goes well with any outfit. Worth every penny!',
    helpful: 15,
    notHelpful: 0,
    verifiedPurchase: true,
    orderId: 3,
    status: 'approved',
    votes: [
      { userId: 2, helpful: true, votedAt: new Date('2025-07-28T09:15:00Z') },
      { userId: 3, helpful: true, votedAt: new Date('2025-07-28T10:30:00Z') },
      { userId: 4, helpful: true, votedAt: new Date('2025-07-28T11:45:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492ab6',
    userId: 3,
    userName: 'Mike Johnson',
    userEmail: 'mike.johnson@example.com',
    rating: 4,
    title: 'Durable and Comfortable',
    comment: 'This laptop backpack is well-made and comfortable to carry. It has plenty of compartments for organizing my stuff. The material feels durable and it has good padding for my laptop. The only reason I gave it 4 stars instead of 5 is that the water bottle pocket could be a bit larger.',
    helpful: 6,
    notHelpful: 1,
    verifiedPurchase: true,
    orderId: 4,
    status: 'approved',
    votes: [
      { userId: 1, helpful: true, votedAt: new Date('2025-07-28T13:10:00Z') },
      { userId: 2, helpful: true, votedAt: new Date('2025-07-28T14:25:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492ab7',
    userId: 2,
    userName: 'Sarah Wilson',
    userEmail: 'sarah.wilson@example.com',
    rating: 3,
    title: 'Decent Coffee Maker',
    comment: 'The coffee maker works fine and makes decent coffee. It\'s easy to use and clean. However, I find that the coffee could be a bit stronger, and the machine is a bit noisy when brewing. For the price, it\'s okay but not exceptional.',
    helpful: 4,
    notHelpful: 3,
    verifiedPurchase: true,
    orderId: 5,
    status: 'approved',
    votes: [
      { userId: 1, helpful: true, votedAt: new Date('2025-07-28T16:00:00Z') },
      { userId: 3, helpful: false, votedAt: new Date('2025-07-28T17:15:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492ab8',
    userId: 4,
    userName: 'Emily Davis',
    userEmail: 'emily.davis@example.com',
    rating: 5,
    title: 'Gaming Keyboard Excellence',
    comment: 'As a gamer, I\'m extremely impressed with this keyboard! The mechanical switches feel amazing, the RGB lighting is customizable, and the build quality is top-notch. It has improved my gaming performance significantly. Highly recommend for any serious gamer!',
    helpful: 18,
    notHelpful: 1,
    verifiedPurchase: true,
    orderId: 6,
    status: 'approved',
    votes: [
      { userId: 1, helpful: true, votedAt: new Date('2025-07-28T08:30:00Z') },
      { userId: 2, helpful: true, votedAt: new Date('2025-07-28T09:45:00Z') },
      { userId: 3, helpful: true, votedAt: new Date('2025-07-28T10:20:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492ab9',
    userId: 1,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    rating: 4,
    title: 'Good Fitness Tracker',
    comment: 'This fitness tracker is great for monitoring my daily activity. It accurately tracks steps, heart rate, and sleep. The app is user-friendly and the battery life is good. The only downside is that the screen could be a bit brighter in sunlight.',
    helpful: 7,
    notHelpful: 2,
    verifiedPurchase: true,
    orderId: 7,
    status: 'approved',
    votes: [
      { userId: 2, helpful: true, votedAt: new Date('2025-07-28T12:00:00Z') },
      { userId: 3, helpful: true, votedAt: new Date('2025-07-28T13:30:00Z') }
    ]
  },
  {
    productId: '6887a5efac6f7812b4492aba',
    userId: 3,
    userName: 'Mike Johnson',
    userEmail: 'mike.johnson@example.com',
    rating: 2,
    title: 'Disappointing Quality',
    comment: 'I was really disappointed with this product. The quality is much lower than expected for the price. It broke after just a few weeks of use. The customer service was helpful with the return, but I wouldn\'t recommend this product.',
    helpful: 5,
    notHelpful: 8,
    verifiedPurchase: true,
    orderId: 8,
    status: 'approved',
    votes: [
      { userId: 1, helpful: true, votedAt: new Date('2025-07-28T15:00:00Z') },
      { userId: 2, helpful: false, votedAt: new Date('2025-07-28T16:15:00Z') },
      { userId: 4, helpful: false, votedAt: new Date('2025-07-28T17:30:00Z') }
    ]
  }
];

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Review Service Database...\n');
    
    // Connect to database
    await connectDatabase();
    console.log('');
    
    // Clear existing reviews
    console.log('🧹 Clearing existing reviews...');
    await Review.deleteMany({});
    console.log('✅ Cleared existing reviews');
    
    // Insert sample reviews
    console.log('📝 Creating sample reviews...');
    const reviews = await Review.insertMany(sampleReviews);
    console.log(`✅ Created ${reviews.length} sample reviews`);
    
    // Display statistics
    console.log('\n📊 Database Statistics:');
    const totalCount = await Review.countDocuments();
    const verifiedCount = await Review.countDocuments({ verifiedPurchase: true });
    const averageRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    console.log(`   - Total Reviews: ${totalCount}`);
    console.log(`   - Verified Purchases: ${verifiedCount}`);
    console.log(`   - Average Rating: ${averageRating[0]?.avgRating?.toFixed(1) || 'N/A'}`);
    
    // Show rating distribution
    const ratingStats = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);
    
    console.log('\n⭐ Rating Distribution:');
    ratingStats.forEach(stat => {
      const stars = '⭐'.repeat(stat._id);
      console.log(`   - ${stars} (${stat._id} stars): ${stat.count} reviews`);
    });
    
    // Show product reviews count
    const productStats = await Review.aggregate([
      { $group: { _id: '$productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📦 Reviews per Product:');
    productStats.forEach(stat => {
      console.log(`   - Product ${stat._id}: ${stat.count} reviews`);
    });
    
    // Show helpful reviews
    const helpfulReviews = await Review.find().sort({ helpful: -1 }).limit(3);
    console.log('\n👍 Most Helpful Reviews:');
    helpfulReviews.forEach((review, index) => {
      console.log(`   ${index + 1}. ${review.title} (${review.helpful} helpful votes)`);
    });
    
    console.log('\n🎉 Review Service database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    process.exit(0);
  }
}

initializeDatabase(); 