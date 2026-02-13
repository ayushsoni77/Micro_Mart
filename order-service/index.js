import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import orderRoutes from './routes/orders.js';
import { testConnection, syncDatabase } from './config/database.js';
import models from './models/index.js'; // Ensure models are loaded for sync
import { Kafka } from 'kafkajs';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, './config.env') });

const app = express();
const PORT = process.env.PORT || 3003;

// Kafka setup
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'order-service';
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const orderEventsTopic = process.env.KAFKA_TOPIC_ORDER_EVENTS || 'order-events';
let kafkaProducer;

async function ensureTopicExists(kafka) {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const topics = await admin.listTopics();
    if (!topics.includes(orderEventsTopic)) {
      await admin.createTopics({
        waitForLeaders: true,
        topics: [
          {
            topic: orderEventsTopic,
            numPartitions: 3,
            replicationFactor: 1,
            configEntries: [
              // Optional retention tuning
              // { name: 'retention.ms', value: String(7 * 24 * 60 * 60 * 1000) },
              // { name: 'segment.bytes', value: String(256 * 1024 * 1024) }
            ]
          }
        ]
      });
      console.log(`✅ Kafka topic created: ${orderEventsTopic} (partitions=3, RF=1)`);
    } else {
      console.log(`ℹ️ Kafka topic exists: ${orderEventsTopic}`);
    }
  } finally {
    await admin.disconnect();
  }
}

async function initializeKafka() {
  const kafka = new Kafka({ clientId: kafkaClientId, brokers: kafkaBrokers });
  await ensureTopicExists(kafka);
  kafkaProducer = kafka.producer({ allowAutoTopicCreation: false });
  await kafkaProducer.connect();
  console.log(`✅ Kafka producer connected (clientId=${kafkaClientId}, brokers=${kafkaBrokers.join(',')})`);
  // Expose to routes/controllers via app.locals
  app.locals.kafkaProducer = kafkaProducer;
  app.locals.orderEventsTopic = orderEventsTopic;
}

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables)
    await syncDatabase();

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Order Service is running', timestamp: new Date().toISOString() });
});

// Initialize database, Kafka and start server
(async () => {
  await initializeDatabase();
  await initializeKafka();
  const server = app.listen(PORT, () => {
    console.log(`🛒 Order Service running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('🔻 Shutting down Order Service...');
    try {
      if (kafkaProducer) await kafkaProducer.disconnect();
    } catch (e) {
      console.error('Error disconnecting Kafka producer:', e);
    }
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();