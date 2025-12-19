# Order Service Database Schema

## Overview
The Order Service uses PostgreSQL with Sequelize ORM to manage orders, order items, status tracking, and payment transactions.

## Database Configuration
- **Database Name**: `ordermart_db`
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres`

## Tables

**Note:** Payment transactions are now stored in the **Payment Service** database for better separation of concerns.

### 1. `orders` Table
Main table for storing order information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique order identifier |
| `user_id` | INTEGER | NOT NULL | Reference to user who placed the order |
| `order_number` | VARCHAR(50) | NOT NULL, UNIQUE | Human-readable order number (e.g., ORD-2024-001) |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | Order status: pending, confirmed, processing, shipped, delivered, cancelled, refunded |
| `payment_status` | ENUM | NOT NULL, DEFAULT 'pending' | Payment status: pending, paid, failed, refunded, partially_refunded |
| `payment_method` | ENUM | NOT NULL, DEFAULT 'pending' | Payment method: UPI, Debit Card, Credit Card, Cash on Delivery, Net Banking |
| `payment_id` | VARCHAR(255) | NULL | External payment gateway transaction ID |
| `total_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Total order amount including tax and shipping |
| `subtotal` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Subtotal before tax and shipping |
| `tax_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Tax amount |
| `shipping_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Shipping cost |
| `discount_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Discount amount applied |
| `currency` | VARCHAR(3) | NOT NULL, DEFAULT 'INR' | Currency code |
| `shipping_address` | JSONB | NOT NULL | Shipping address details |
| `billing_address` | JSONB | NULL | Billing address details (if different from shipping) |
| `notes` | TEXT | NULL | Order notes from customer or admin |
| `estimated_delivery_date` | TIMESTAMP | NULL | Estimated delivery date |
| `actual_delivery_date` | TIMESTAMP | NULL | Actual delivery date |
| `tracking_number` | VARCHAR(100) | NULL | Shipping tracking number |
| `tracking_url` | VARCHAR(500) | NULL | Shipping tracking URL |
| `is_gift` | BOOLEAN | NOT NULL, DEFAULT false | Whether this is a gift order |
| `gift_message` | TEXT | NULL | Gift message for gift orders |
| `source` | ENUM | NOT NULL, DEFAULT 'web' | Source of the order: web, mobile, api |
| `ip_address` | VARCHAR(45) | NULL | IP address of the customer |
| `user_agent` | TEXT | NULL | User agent of the customer |
| `metadata` | JSONB | NULL, DEFAULT '{}' | Additional metadata for the order |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Order creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Order last update timestamp |

**Indexes:**
- `idx_orders_user_id` on `user_id`
- `idx_orders_order_number` on `order_number`
- `idx_orders_status` on `status`
- `idx_orders_payment_status` on `payment_status`
- `idx_orders_created_at` on `created_at`
- `idx_orders_user_id_status` on `user_id, status`

### 2. `order_items` Table
Stores individual items within each order.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique order item identifier |
| `order_id` | INTEGER | NOT NULL, FOREIGN KEY | Reference to the order |
| `product_id` | INTEGER | NOT NULL | Reference to the product |
| `product_name` | VARCHAR(255) | NOT NULL | Product name at the time of order (snapshot) |
| `product_sku` | VARCHAR(100) | NULL | Product SKU at the time of order |
| `product_image` | VARCHAR(500) | NULL | Product image URL at the time of order |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | Quantity ordered |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Unit price at the time of order |
| `total_price` | DECIMAL(10,2) | NOT NULL | Total price for this item (unitPrice * quantity) |
| `discount_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Discount amount applied to this item |
| `tax_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Tax amount for this item |
| `currency` | VARCHAR(3) | NOT NULL, DEFAULT 'INR' | Currency code |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | Status of this specific item |
| `return_reason` | TEXT | NULL | Reason for return if item is returned |
| `return_date` | TIMESTAMP | NULL | Date when item was returned |
| `refund_amount` | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Amount refunded for this item |
| `metadata` | JSONB | NULL, DEFAULT '{}' | Additional metadata for this item |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Item creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Item last update timestamp |

**Indexes:**
- `idx_order_items_order_id` on `order_id`
- `idx_order_items_product_id` on `product_id`
- `idx_order_items_status` on `status`
- `idx_order_items_order_id_product_id` on `order_id, product_id`

### 3. `order_statuses` Table
Tracks the history of order status changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique status change identifier |
| `order_id` | INTEGER | NOT NULL, FOREIGN KEY | Reference to the order |
| `status` | ENUM | NOT NULL | Status value |
| `previous_status` | ENUM | NULL | Previous status before this change |
| `changed_by` | INTEGER | NULL | User ID who made this status change |
| `changed_by_role` | ENUM | NOT NULL, DEFAULT 'system' | Role of the user who made the change |
| `notes` | TEXT | NULL | Additional notes about this status change |
| `metadata` | JSONB | NULL, DEFAULT '{}' | Additional metadata for this status change |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Status change timestamp |

**Indexes:**
- `idx_order_statuses_order_id` on `order_id`
- `idx_order_statuses_status` on `status`
- `idx_order_statuses_changed_by` on `changed_by`
- `idx_order_statuses_created_at` on `created_at`
- `idx_order_statuses_order_id_created_at` on `order_id, created_at`



## Relationships

### One-to-Many Relationships
1. **Order → OrderItem**: One order can have multiple items
2. **Order → OrderStatus**: One order can have multiple status changes

### Foreign Key Constraints
- `order_items.order_id` → `orders.id` (CASCADE DELETE)
- `order_statuses.order_id` → `orders.id` (CASCADE DELETE)

## Data Types

### ENUM Values

**Order Status:**
- `pending` - Order is created but not yet confirmed
- `confirmed` - Order is confirmed by seller
- `processing` - Order is being processed
- `shipped` - Order has been shipped
- `delivered` - Order has been delivered
- `cancelled` - Order has been cancelled
- `refunded` - Order has been refunded

**Payment Status:**
- `pending` - Payment is pending
- `paid` - Payment is completed
- `failed` - Payment failed
- `refunded` - Payment has been refunded
- `partially_refunded` - Partial refund has been processed

**Payment Method:**
- `pending` - Payment method not yet selected
- `UPI` - Unified Payment Interface
- `Debit Card` - Debit card payment
- `Credit Card` - Credit card payment
- `Cash on Delivery` - Cash on delivery
- `Net Banking` - Net banking



**Source:**
- `web` - Web application
- `mobile` - Mobile application
- `api` - API call

**Changed By Role:**
- `buyer` - Buyer made the change
- `seller` - Seller made the change
- `admin` - Admin made the change
- `system` - System made the change

## Features

### Automatic Order Number Generation
Orders automatically get a unique order number in the format: `ORD-YYYYMMDD-XXX`
- Example: `ORD-20241201-001`

### Price Calculations
- `total_price` in order_items is automatically calculated as `unit_price * quantity`
- `total_amount` in orders includes tax, shipping, and discounts

### Status Tracking
- Every status change is recorded in the `order_statuses` table
- Maintains complete audit trail of order lifecycle

### Payment Integration
- Payment status is tracked via `payment_status` field
- Payment transaction details are stored in the Payment Service
- Order service only stores payment reference (`payment_id`)

### Data Integrity
- Foreign key constraints ensure referential integrity
- CASCADE DELETE ensures cleanup when orders are deleted
- JSONB fields for flexible metadata storage

## Usage Examples

### Creating an Order
```javascript
const order = await Order.create({
  userId: 1,
  totalAmount: 1500.00,
  subtotal: 1500.00,
  shippingAddress: {
    street: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001'
  }
});
```

### Adding Order Items
```javascript
const orderItem = await OrderItem.create({
  orderId: order.id,
  productId: 1,
  productName: 'iPhone 15',
  quantity: 1,
  unitPrice: 1500.00
});
```

### Tracking Status Changes
```javascript
const statusChange = await OrderStatus.create({
  orderId: order.id,
  status: 'confirmed',
  previousStatus: 'pending',
  changedByRole: 'seller',
  notes: 'Order confirmed by seller'
});
```

### Recording Payment
```javascript
const payment = await PaymentTransaction.create({
  orderId: order.id,
  transactionId: 'TXN_123456',
  paymentMethod: 'UPI',
  amount: 1500.00,
  status: 'completed',
  gateway: 'Razorpay'
});
``` 