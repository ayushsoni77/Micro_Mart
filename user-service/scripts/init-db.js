import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

const initDatabase = async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'usermart_db']
    );

    if (dbExists.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE "${process.env.DB_NAME || 'usermart_db'}"`);
      console.log(`✅ Database '${process.env.DB_NAME || 'usermart_db'}' created successfully`);
    } else {
      console.log(`✅ Database '${process.env.DB_NAME || 'usermart_db'}' already exists`);
    }

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await client.end();
  }
};

// Run initialization
initDatabase(); 