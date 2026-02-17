# Micro Mart

Micro Mart is a microservices-based e-commerce application with a React + Vite frontend and multiple backend services for users, products, orders, payments, inventory, reviews, notifications, and cart operations.

## Architecture

- Frontend: React, TypeScript, Vite, TailwindCSS
- Datastores: PostgreSQL, MongoDB, Redis
- Messaging: Kafka (KRaft)
- Backend: Node.js + Express microservices
- Containerization: Docker + Docker Compose

Service directories:

- `user-service`
- `product-service`
- `order-service`
- `payment-service`
- `inventory-service`
- `reviews-service`
- `notification-service`
- `cart-service`

## Prerequisites

- Node.js 18+
- npm
- Docker + Docker Compose (recommended)
- For local non-Docker backend runs: PostgreSQL, MongoDB, Redis, Kafka

## Quick Start (Docker Compose)

The repository includes a root `docker-compose.yaml` for running the stack with container images.

```bash
docker compose up -d
```

To stop:

```bash
docker compose down
```

Frontend is exposed at:

- `http://localhost`

## Local Development Setup

### 1) Install frontend dependencies

```bash
npm install
```

### 2) Configure frontend environment

Create/update root `.env` (or start from `.env.example`) with service URLs:

```env
VITE_USER_SERVICE_URL=http://localhost:3001
VITE_PRODUCT_SERVICE_URL=http://localhost:3002
VITE_ORDER_SERVICE_URL=http://localhost:3003
VITE_PAYMENT_SERVICE_URL=http://localhost:4004
VITE_INVENTORY_SERVICE_URL=http://localhost:3005
VITE_REVIEWS_SERVICE_URL=http://localhost:3006
VITE_NOTIFICATION_SERVICE_URL=http://localhost:3007
```

### 3) Install backend service dependencies

```bash
npm run install:services
```

### 4) Start backend services

```bash
npm run start:all
```

### 5) Start frontend

```bash
npm run dev
```

Frontend dev server is typically available at:

- `http://localhost:5173`

## Root Scripts

- `npm run dev` - start frontend (Vite)
- `npm run build` - build frontend
- `npm run preview` - preview frontend build
- `npm run lint` - lint frontend source
- `npm run install:services` - install dependencies in all backend services
- `npm run start:all` - start all backend services concurrently

## Services and Default Local Ports

- `user-service`: `3001`
- `product-service`: `3002`
- `order-service`: `3003`
- `notification-service`: `3004`
- `inventory-service`: `3005`
- `reviews-service`: `3006`
- `cart-service`: `3007`
- `payment-service`: `4004`

## Health Checks

Each backend service exposes:

- `GET /health`

Examples:

- `http://localhost:3001/health`
- `http://localhost:3002/health`
- `http://localhost:3003/health`

## Notes

- Most services load configuration from their own `config.env` file.
- User service requires Redis for session storage.
- Order and Notification services use Kafka for order event flow.
- Additional schema/docs are available in service folders (for example, `user-service/README.md`, `order-service/README.md`, and `DATABASE_SCHEMA.md` files).
