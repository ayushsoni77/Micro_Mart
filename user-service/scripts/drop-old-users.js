import sequelize from '../config/database.js';
import Buyer from '../models/Buyer.js';
import Seller from '../models/Seller.js';
import User from '../models/User.js';

const dropOldUsersTable = async () => {
  try {
    console.log('🗑️  Dropping Old Users Table...');
    console.log('================================');
    
    // Verify migration is complete
    const buyers = await Buyer.findAll();
    const sellers = await Seller.findAll();
    const oldUsers = await User.findAll();
    
    console.log(`📊 Current Status:`);
    console.log(`✅ Buyers: ${buyers.length}`);
    console.log(`✅ Sellers: ${sellers.length}`);
    console.log(`⚠️  Old Users: ${oldUsers.length}`);
    
    if (oldUsers.length > 0) {
      console.log('\n⚠️  WARNING: Old users table still contains data!');
      console.log('   This script will drop the old users table.');
      console.log('   Make sure you have confirmed the migration is complete.');
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('\nDo you want to proceed with dropping the old users table? (yes/no): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled.');
        return;
      }
    }
    
    // Drop the old users table
    console.log('\n🗑️  Dropping old users table...');
    await User.drop();
    console.log('✅ Old users table dropped successfully!');
    
    // Verify the drop
    try {
      await User.findAll();
      console.log('❌ Error: Old users table still exists!');
    } catch (error) {
      console.log('✅ Confirmed: Old users table has been dropped.');
    }
    
    console.log('\n🎉 Database cleanup completed!');
    console.log('✅ Separate Buyer and Seller tables are now active.');
    console.log('✅ Old users table has been removed.');
    
  } catch (error) {
    console.error('❌ Error dropping old users table:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the script
dropOldUsersTable(); 