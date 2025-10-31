# Backend - Auto Shopify Store Builder

Express.js API server with TypeScript, MongoDB, and Shopify OAuth integration.

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

Create a `.env` file with:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopify-store-builder
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
SHOPIFY_API_KEY=your-shopify-api-key
SHOPIFY_API_SECRET=your-shopify-api-secret
SHOPIFY_REDIRECT_URI=http://localhost:5000/api/shopify/callback
SHOPIFY_SCOPES=write_products,read_products,write_themes,read_themes
```

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
- `axios` - HTTP client for Shopify API
- `zod` - Schema validation

### Development
- `typescript` - Type safety
- `ts-node` - TypeScript execution
- `nodemon` - Auto-restart on changes
- `@types/*` - TypeScript definitions

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

### Shopify (`/shopify`)
- `GET /auth` - Start OAuth flow
- `GET /callback` - OAuth callback
- `GET /status` - Check connection status (protected)

### Stores (`/stores`)
- `POST /create` - Create new Shopify store (protected)

### Dashboard (`/dashboard`)
- `GET /stats` - User statistics (protected)

## 🔐 Authentication

JWT tokens are issued on login and must be included in protected routes:

```
Authorization: Bearer <token>
```

Tokens expire after 1 day (configurable via `JWT_EXPIRES_IN`).

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
- Shopify credentials are required for OAuth functionality
- First user must be manually set as admin in MongoDB
- Use morgan logger to track all HTTP requests
- Zod validation ensures type-safe API inputs

