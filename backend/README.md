# Backend - EAZY DROPSHIPPING

Express.js API server with TypeScript, MongoDB, and internal store management.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your actual values

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # MongoDB connection
│   └── env.ts        # Environment variables
├── models/           # Mongoose schemas
├── routes/           # API routes
├── controllers/      # Business logic
├── middleware/       # Express middleware
│   ├── auth.ts       # JWT authentication
│   ├── admin.ts      # Admin role check
│   └── errorHandler.ts  # Error handling
├── validators/       # Zod validation schemas
└── server.ts         # Main application entry
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

### Required Variables
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eazy-dropshipping
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
ENCRYPTION_KEY=your-base64-encoded-32-byte-encryption-key-here-44-chars
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
```

### Optional Variables
```env
# Email Configuration (if not set, emails will be logged only)
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=EAZY DROPSHIPPING
SMTP_IGNORE_TLS=false
CONTACT_EMAIL=

# OpenAI Configuration (optional - fallback will be used if not set)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
AI_CACHE_TTL=3600
```

**Note:** Create a `.env.example` file in the backend directory with these placeholders. The OpenAI API key is optional - if not provided, the system will use fallback responses.

## 📚 Dependencies

### Production
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- `morgan` - HTTP request logger
- `cookie-parser` - Cookie parsing
- `axios` - HTTP client
- `zod` - Schema validation

### Development
- `typescript` - Type safety
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on changes
- `@types/*` - TypeScript definitions
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest
- `supertest` - HTTP assertion library

## 🛣️ API Routes

All routes are prefixed with `/api`

### Health Check
- `GET /health` - Server status

### Authentication (`/auth`)
- `POST /register` - Create new account
- `POST /login` - Login and get JWT
- `GET /me` - Get current user (protected)

### Products (`/products`)
- `GET /` - List all active products
- `GET /:id` - Get product details
- `POST /` - Create product (admin only)
- `PUT /:id` - Update product (admin only)
- `DELETE /:id` - Delete product (admin only)

### Stores (`/stores`)
- `POST /create` - Create new internal store (protected)

### Dashboard (`/dashboard`)
- `GET /stats` - User statistics (protected)

### AI Features (`/ai`)
- `POST /find-winning-product` - Get AI-powered product recommendations (protected, rate limited)
- `POST /write-product-description` - Generate AI product descriptions (protected, rate limited)

### Analytics (`/analytics`)
- `GET /` - Get user analytics (protected)
- `POST /product-view` - Track product view (protected)
- `POST /product-import` - Track product import (protected)

## 🔐 Authentication

JWT tokens are issued on login and must be included in protected routes:

```
Authorization: Bearer <token>
```

Tokens expire after 1 day (configurable via `JWT_EXPIRES_IN`).

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests: `src/__tests__/services/` - Test individual services
- Integration tests: `src/__tests__/integration/` - Test API endpoints
- Test setup: `src/__tests__/setup.ts` - Test environment configuration

## 🧪 Testing Endpoints

Use tools like Postman or curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## 📝 Notes

- MongoDB must be running before starting the server
- First user must be manually set as admin in MongoDB
- Use morgan logger to track all HTTP requests
- Zod validation ensures type-safe API inputs

