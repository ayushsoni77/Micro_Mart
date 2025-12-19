# Order Service

A microservice for managing e-commerce orders with PostgreSQL database integration.

## Features

- **Order Management**: Create, read, update, and track orders
- **Order Items**: Manage individual items within orders
- **Status Tracking**: Complete audit trail of order status changes
- **Payment Integration**: Track payment transactions and status
- **Database Persistence**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based authentication
- **Role-based Access**: Different permissions for buyers and sellers

## Database Schema

The service uses PostgreSQL with the following tables:

1. **orders** - Main order information
2. **order_items** - Individual items in orders
3. **order_statuses** - Status change history
4. **payment_transactions** - Payment transaction tracking

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for detailed schema documentation.

## Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your database credentials
   ```

3. **Initialize database:**
   ```bash
   npm run init-db
   ```

4. **Test database connection:**
   ```bash
   npm run test-db
   ```

5. **Start the service:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Orders

- `POST /api/orders` - Create a new order (Buyer only)
- `GET /api/orders` - Get orders (filtered by user role)
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status (Seller only)
- `POST /api/orders/:id/set-cod` - Set order to Cash on Delivery
- `POST /api/orders/payment-success` - Mark payment as successful

### Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Role-based Access

- **Buyers**: Can create orders and view their own orders
- **Sellers**: Can view orders and update order status
- **Admins**: Full access to all operations

## Environment Variables

```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ordermart_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=3003
NODE_ENV=development

# External Service URLs
NOTIFICATION_SERVICE_URL=http://localhost:3004
INVENTORY_SERVICE_URL=http://localhost:3005
PRODUCT_SERVICE_URL=http://localhost:3002
```

## Database Models

### Order Model
```javascript
{
  id: 1,
  userId: 1,
  orderNumber: 'ORD-20241201-001',
  status: 'pending',
  paymentStatus: 'pending',
  paymentMethod: 'UPI',
  totalAmount: 1500.00,
  subtotal: 1500.00,
  shippingAddress: { /* JSON object */ },
  // ... other fields
}
```

### OrderItem Model
```javascript
{
  id: 1,
  orderId: 1,
  productId: 1,
  productName: 'iPhone 15',
  quantity: 1,
  unitPrice: 1500.00,
  totalPrice: 1500.00,
  // ... other fields
}
```

## External Service Integration

The order service integrates with:

- **Product Service** (Port 3002): Fetch product details
- **Inventory Service** (Port 3005): Reserve/release inventory
- **Notification Service** (Port 3004): Send order notifications

## Development

### Running Tests
```bash
npm run test-db
```

### Database Migrations
The service uses Sequelize's `sync()` method for schema management. In production, consider using proper migrations.

### Logging
The service includes comprehensive logging for debugging and monitoring.

## Production Considerations

1. **Security**: Change default JWT secret and database credentials
2. **Performance**: Add database connection pooling and query optimization
3. **Monitoring**: Implement proper logging and monitoring
4. **Backup**: Set up regular database backups
5. **Scaling**: Consider horizontal scaling for high traffic

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure database schema changes are backward compatible

## License

This project is part of the e-commerce microservices architecture. 