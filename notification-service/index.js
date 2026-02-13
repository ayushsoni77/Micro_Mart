import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import notificationRoutes from './routes/notifications.js';
import { connectDatabase } from './config/database.js';
import { Kafka } from 'kafkajs';
import { Notification } from './models/index.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from config.env
dotenv.config({ path: path.join(__dirname, './config.env') });

const app = express();
const PORT = process.env.PORT || 3004;

// Kafka (KRaft) setup
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'notification-service';
const kafkaBrokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const kafkaGroupId = process.env.KAFKA_GROUP_ID || 'notification-service-group';
const orderEventsTopic = process.env.KAFKA_TOPIC_ORDER_EVENTS || 'order-events';

// Debug logging
console.log(`🔍 Loaded environment variables:`);
console.log(`   KAFKA_BROKERS: ${process.env.KAFKA_BROKERS}`);
console.log(`   Parsed kafkaBrokers: ${kafkaBrokers.join(',')}`);
console.log(`   KAFKA_CLIENT_ID: ${kafkaClientId}`);

let kafkaConsumer;

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
            replicationFactor: 1
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

async function initializeKafkaConsumer() {
  console.log(`\n🔍 Kafka initialization debug:`);
  console.log(`   kafkaClientId: ${kafkaClientId}`);
  console.log(`   kafkaBrokers array: ${JSON.stringify(kafkaBrokers)}`);
  console.log(`   kafkaGroupId: ${kafkaGroupId}`);
  
  const kafka = new Kafka({ clientId: kafkaClientId, brokers: kafkaBrokers });
  console.log(`   ✅ Kafka instance created`);
  
  await ensureTopicExists(kafka);
  kafkaConsumer = kafka.consumer({ groupId: kafkaGroupId, allowAutoTopicCreation: false });
  await kafkaConsumer.connect();
  await kafkaConsumer.subscribe({ topic: orderEventsTopic, fromBeginning: false });
  console.log(`✅ Kafka consumer connected (clientId=${kafkaClientId}, groupId=${kafkaGroupId})`);

  await kafkaConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString();
        if (!value) return;
        const evt = JSON.parse(value);
        const type = evt.type;
        const data = evt.data || {};

        if (type === 'order_created') {
          await Notification.create({
            type: 'order_created',
            userId: data.userId,
            orderId: data.orderId,
            title: 'Order Created Successfully',
            message: `Your order #${data.orderId} has been created for ₹${Number(data.totalAmount).toFixed(2)}. We'll notify you when it ships.`,
            priority: 'medium',
            category: 'order',
            actionUrl: `/orders/${data.orderId}`,
            actionText: 'View Order',
            metadata: { itemCount: data.itemCount, totalAmount: data.totalAmount }
          });
          console.log(`📥 Notification saved for order_created: ${data.orderId}`);
        } else if (type === 'order_status_update') {
          const status = data.status;
          await Notification.create({
            type: 'order_status_update',
            userId: data.userId,
            orderId: data.orderId,
            title: 'Order Status Updated',
            message: `Order #${data.orderId} status updated to ${status}.`,
            priority: 'medium',
            category: 'order',
            actionUrl: `/orders/${data.orderId}`,
            actionText: 'View Order',
            metadata: { previousStatus: data.previousStatus, paymentStatus: data.paymentStatus }
          });
          console.log(`📥 Notification saved for order_status_update: ${data.orderId}`);
        }
      } catch (err) {
        console.error('❌ Error processing Kafka message:', err);
      }
    }
  });
}

// Initialize database
const initializeDatabase = async () => {
  try {
    await connectDatabase();
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
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running', timestamp: new Date().toISOString() });
});

// Initialize database, Kafka and start server
(async () => {
  await initializeDatabase();
  await initializeKafkaConsumer();
  const server = app.listen(PORT, () => {
    console.log(`📧 Notification Service running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('🔻 Shutting down Notification Service...');
    try {
      if (kafkaConsumer) await kafkaConsumer.disconnect();
    } catch (e) {
      console.error('Error disconnecting Kafka consumer:', e);
    }
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();