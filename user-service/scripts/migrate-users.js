import sequelize from '../config/database.js';
import User from '../models/User.js';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';

const migrateUsers = async () => {
  try {
    console.log('🔄 Starting user migration...');
    
    // Sync new tables
    await Buyer.sync({ alter: true });
    await Seller.sync({ alter: true });
    
    // Get all existing users
    const users = await User.findAll();
    console.log(`📊 Found ${users.length} users to migrate`);
    
    let buyerCount = 0;
    let sellerCount = 0;
    
    for (const user of users) {
      const userData = user.toJSON();
      
      if (userData.role === 'buyer') {
        // Create buyer
        await Buyer.create({
          id: userData.id,
          email: userData.email,
          password: userData.password,
          name: userData.name,
          isEmailVerified: userData.isEmailVerified,
          emailVerificationToken: userData.emailVerificationToken,
          emailVerificationExpiry: userData.emailVerificationExpiry,
          resetPasswordToken: userData.resetPasswordToken,
          resetPasswordExpiry: userData.resetPasswordExpiry,
          profile: userData.profile,
          oauth_providers: userData.oauth_providers,
          lastLoginAt: userData.lastLoginAt,
          isActive: userData.isActive
        });
        buyerCount++;
        console.log(`✅ Migrated buyer: ${userData.email} (ID: ${userData.id})`);
      } else if (userData.role === 'seller') {
        // Create seller
        await Seller.create({
          id: userData.id,
          email: userData.email,
          password: userData.password,
          name: userData.name,
          isEmailVerified: userData.isEmailVerified,
          emailVerificationToken: userData.emailVerificationToken,
          emailVerificationExpiry: userData.emailVerificationExpiry,
          resetPasswordToken: userData.resetPasswordToken,
          resetPasswordExpiry: userData.resetPasswordExpiry,
          profile: userData.profile,
          oauth_providers: userData.oauth_providers,
          lastLoginAt: userData.lastLoginAt,
          isActive: userData.isActive
        });
        sellerCount++;
        console.log(`✅ Migrated seller: ${userData.email} (ID: ${userData.id})`);
      }
    }
    
    console.log(`\n📊 Migration completed!`);
    console.log(`✅ Buyers migrated: ${buyerCount}`);
    console.log(`✅ Sellers migrated: ${sellerCount}`);
    console.log(`\n⚠️  Note: Original 'users' table still exists. You can drop it after confirming migration.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sequelize.close();
  }
};

// Run migration
migrateUsers(); 