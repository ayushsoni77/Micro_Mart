# User Service - PostgreSQL Integration

## Overview
The User Service is a microservice responsible for user authentication, registration, profile management, and address management. It now uses PostgreSQL as the primary database with Redis for session storage.

## Features
- ✅ User registration with email verification
- ✅ JWT-based authentication
- ✅ OAuth integration (Google, Facebook)
- ✅ Address management (CRUD operations)
- ✅ Session management with Redis
- ✅ Password reset functionality
- ✅ Role-based access control (buyer/seller)

## Database Schema
The service uses PostgreSQL with the following tables:
- **users**: User accounts and authentication data
- **addresses**: User shipping addresses
- **sessions**: Session management data

See `DATABASE_SCHEMA.md` for detailed schema documentation.

## Prerequisites
1. **PostgreSQL** installed and running
2. **Redis** installed and running
3. **Node.js** (v16 or higher)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the configuration file:
```bash
cp config.env .env
```

Update the `.env` file with your database credentials:
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=usermart_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (Ethereal)
ETHEREAL_USER=your_ethereal_email
ETHEREAL_PASS=your_ethereal_password

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Initialize Database
```bash
npm run init-db
```

### 4. Test Database Connection
```bash
npm run test-db
```

### 5. Start the Service
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `POST /api/users/verify-email` - Email verification
- `POST /api/users/resend-otp` - Resend verification OTP

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users` - Get all users (admin)

### Address Management
- `GET /api/users/addresses` - Get user addresses
- `POST /api/users/addresses` - Add new address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

### OAuth
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/facebook` - Facebook OAuth login
- `GET /auth/facebook/callback` - Facebook OAuth callback

## Database Models

### User Model
```javascript
{
  id: INTEGER (Primary Key),
  email: STRING (Unique),
  password: STRING (Hashed),
  name: STRING,
  role: ENUM('buyer', 'seller'),
  isEmailVerified: BOOLEAN,
  profile: JSONB,
  oauthProviders: JSONB,
  // ... other fields
}
```

### Address Model
```javascript
{
  id: INTEGER (Primary Key),
  userId: INTEGER (Foreign Key),
  type: ENUM('home', 'work', 'other'),
  isDefault: BOOLEAN,
  street: STRING,
  city: STRING,
  state: STRING,
  zipCode: STRING,
  country: STRING,
  // ... other fields
}
```

## Security Features
- Password hashing with bcrypt (12 salt rounds)
- JWT token authentication
- Email verification with OTP
- Session management with Redis
- Input validation and sanitization
- Role-based access control

## Development

### Database Migrations
The service uses Sequelize's `sync()` method for automatic table creation. For production, consider using proper migrations.

### Testing
```bash
# Test database connection
npm run test-db

# Test the service
curl http://localhost:3001/health
```

### Logs
The service provides detailed logging for:
- Database operations
- Authentication attempts
- Email sending
- OAuth flows
- Error handling

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists: `npm run init-db`
4. Test connection: `npm run test-db`

### Redis Connection Issues
1. Ensure Redis is running
2. Check Redis configuration in `.env`
3. Verify Redis connection in logs

### Email Issues
1. Check Ethereal credentials in `.env`
2. Verify email configuration
3. Check logs for email sending errors

## Production Considerations
1. Use strong JWT secrets
2. Configure proper CORS settings
3. Set up SSL/TLS
4. Implement rate limiting
5. Set up monitoring and logging
6. Configure database backups
7. Use environment-specific configurations

## Contributing
1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## License
This project is part of the MicroMart e-commerce platform. 