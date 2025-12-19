# User Service Database Schema

## Overview
This document describes the PostgreSQL database schema for the User Service in the MicroMart e-commerce platform.

## Database Configuration
- **Database Name**: `usermart_db`
- **Host**: `localhost`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `postgres`

## Tables

### 1. Users Table
Stores user account information and authentication data.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('buyer', 'seller') NOT NULL DEFAULT 'buyer',
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verification_token VARCHAR(255),
  email_verification_expiry TIMESTAMP,
  reset_password_token VARCHAR(255),
  reset_password_expiry TIMESTAMP,
  profile JSONB DEFAULT '{}',
  oauth_providers JSONB DEFAULT '[]',
  last_login_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Unique user identifier
- `email`: User's email address (unique)
- `password`: Hashed password using bcrypt
- `name`: User's full name
- `role`: User role (buyer/seller)
- `is_email_verified`: Email verification status
- `email_verification_token`: Token for email verification
- `email_verification_expiry`: Expiry time for verification token
- `reset_password_token`: Token for password reset
- `reset_password_expiry`: Expiry time for reset token
- `profile`: JSON object for additional user data
- `oauth_providers`: Array of OAuth provider information
- `last_login_at`: Timestamp of last login
- `is_active`: Account status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### 2. Addresses Table
Stores user shipping addresses.

```sql
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type ENUM('home', 'work', 'other') NOT NULL DEFAULT 'home',
  is_default BOOLEAN NOT NULL DEFAULT false,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  phone VARCHAR(20),
  label VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Unique address identifier
- `user_id`: Foreign key to users table
- `type`: Address type (home/work/other)
- `is_default`: Whether this is the default address
- `street`: Street address
- `city`: City name
- `state`: State/province
- `zip_code`: Postal code
- `country`: Country name
- `phone`: Contact phone number
- `label`: Custom label for the address
- `created_at`: Address creation timestamp
- `updated_at`: Last update timestamp

### 3. Sessions Table
Stores user session information for Redis integration.

```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Session identifier
- `user_id`: Foreign key to users table (nullable for guest sessions)
- `data`: JSON object containing session data
- `expires_at`: Session expiry timestamp
- `user_agent`: Browser user agent string
- `ip_address`: Client IP address (IPv6 compatible)
- `is_active`: Session status
- `created_at`: Session creation timestamp
- `updated_at`: Last update timestamp

## Indexes

### Users Table
- Primary key on `id`
- Unique index on `email`
- Index on `role` for role-based queries
- Index on `is_active` for active user queries

### Addresses Table
- Primary key on `id`
- Foreign key index on `user_id`
- Index on `is_default` for default address queries
- Composite index on `(user_id, is_default)`

### Sessions Table
- Primary key on `id`
- Foreign key index on `user_id`
- Index on `expires_at` for cleanup queries
- Index on `is_active` for active session queries

## Relationships

1. **User → Addresses**: One-to-Many
   - A user can have multiple addresses
   - Addresses are deleted when user is deleted (CASCADE)

2. **User → Sessions**: One-to-Many
   - A user can have multiple active sessions
   - Sessions are deleted when user is deleted (CASCADE)

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with salt rounds of 12
2. **Token Expiry**: Email verification and password reset tokens have expiry times
3. **Session Management**: Sessions are stored with expiry times and can be invalidated
4. **Input Validation**: Email format validation and password strength requirements

## Data Integrity

1. **Foreign Key Constraints**: Ensures referential integrity
2. **Unique Constraints**: Prevents duplicate emails
3. **Check Constraints**: Validates role values and email format
4. **Cascade Deletes**: Maintains data consistency when users are deleted

## Performance Considerations

1. **Indexes**: Strategic indexing for common query patterns
2. **JSONB**: Efficient storage and querying of flexible data (profile, oauth_providers)
3. **Connection Pooling**: Configured for optimal database connection management
4. **Query Optimization**: Use of Sequelize for efficient query generation

## Backup and Recovery

1. **Regular Backups**: Implement automated database backups
2. **Point-in-Time Recovery**: PostgreSQL supports point-in-time recovery
3. **Data Export**: Use pg_dump for data export and migration

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usermart_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Database**:
   ```bash
   npm run init-db
   ```

3. **Start Service**:
   ```bash
   npm run dev
   ```

The database will be automatically created and tables will be synchronized when the service starts. 