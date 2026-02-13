import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from config.env in parent directory (order-service root)
dotenv.config({ path: path.join(__dirname, '../config.env') });

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres' // Connect to default postgres database first
});

async function createDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    const dbName = process.env.DB_NAME || 'ordermart_db';
    
    // Check if database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const dbExists = await client.query(checkDbQuery, [dbName]);
    
    if (dbExists.rows.length === 0) {
      // Create database
      const createDbQuery = `CREATE DATABASE "${dbName}"`;
      await client.query(createDbQuery);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }

  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    await client.end();
  }
}

createDatabase(); 