import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventorymart_db';

// Connect to MongoDB
export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MongoDB:', error);
  }
};

export default mongoose; 