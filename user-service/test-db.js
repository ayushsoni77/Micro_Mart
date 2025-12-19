import { testConnection, syncDatabase } from './config/database.js';
import models from './models/index.js';

const testDatabase = async () => {
  try {
    console.log('🔍 Testing PostgreSQL connection...');
    
    // Test connection
    await testConnection();
    
    // Sync database
    await syncDatabase();
    
    console.log('✅ Database connection and sync successful!');
    
    // Test basic model operations
    console.log('🔍 Testing User model...');
    const userCount = await models.User.count();
    console.log(`📊 Current users in database: ${userCount}`);
    
    console.log('🔍 Testing Address model...');
    const addressCount = await models.Address.count();
    console.log(`📊 Current addresses in database: ${addressCount}`);
    
    console.log('🔍 Testing Session model...');
    const sessionCount = await models.Session.count();
    console.log(`📊 Current sessions in database: ${sessionCount}`);
    
    console.log('✅ All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    process.exit(0);
  }
};

testDatabase(); 