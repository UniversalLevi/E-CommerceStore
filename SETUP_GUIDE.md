# 🚀 Auto Shopify Store Builder - Complete Setup Guide

This guide will walk you through setting up and running the Auto Shopify Store Builder MVP.

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed ([Download](https://nodejs.org/))
- ✅ **MongoDB** installed and running ([Download](https://www.mongodb.com/try/download/community))
- ✅ **Shopify Partner Account** ([Sign up](https://partners.shopify.com/signup))
- ✅ **Git** installed
- ✅ A code editor (VS Code recommended)

## 🛠️ Step 1: Clone and Install

```bash
# Navigate to project directory
cd Shopify_E-CommerceStore

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 🔑 Step 2: Create Shopify App

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Click **Apps** → **Create App** → **Create app manually**
3. Name your app (e.g., "Store Builder Dev")
4. Click on **Configuration** in the left sidebar
5. Under **App URL**, enter: `http://localhost:3000`
6. Under **Allowed redirection URL(s)**, add: `http://localhost:5000/api/shopify/callback`
7. Under **App scopes**, add these scopes:
   - `write_products`
   - `read_products`
   - `write_themes`
   - `read_themes`
8. Save and note down your:
   - **API key** (Client ID)
   - **API secret key** (Client Secret)

## ⚙️ Step 3: Configure Environment Variables

### Backend Configuration

Create `backend/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopify-store-builder
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
SHOPIFY_API_KEY=your-shopify-api-key-from-step-2
SHOPIFY_API_SECRET=your-shopify-api-secret-from-step-2
SHOPIFY_REDIRECT_URI=http://localhost:5000/api/shopify/callback
SHOPIFY_SCOPES=write_products,read_products,write_themes,read_themes
```

**Important:** 
- Replace `JWT_SECRET` with a random, secure string
- Replace `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` with your actual values from Step 2

### Frontend Configuration

Create `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🗄️ Step 4: Start MongoDB

Make sure MongoDB is running:

**Windows:**
```bash
# MongoDB should start automatically after installation
# Or run:
net start MongoDB
```

**Mac (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Verify MongoDB is running:**
```bash
mongosh
# If you see a MongoDB shell, it's working!
# Type 'exit' to quit
```

## 🚀 Step 5: Run the Application

Open **two terminal windows/tabs**:

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
📊 Environment: development
🔗 CORS enabled for: http://localhost:3000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
✓ Ready in XXXms
```

## ✅ Step 6: Verify Installation

1. Open your browser and go to `http://localhost:3000`
2. You should see the landing page
3. Test the health endpoint: `http://localhost:5000/api/health`
   - Should return: `{"success":true,"message":"Server is running",...}`

## 👤 Step 7: Create Your First Admin User

Since you need admin access to add products, you'll need to create an admin user manually:

### Option 1: Via Registration + MongoDB

1. Register a new user at `http://localhost:3000/register`
2. Open MongoDB Compass or mongosh
3. Connect to `mongodb://localhost:27017`
4. Navigate to: `shopify-store-builder` → `users` collection
5. Find your user and change `role` from `"user"` to `"admin"`

### Option 2: Direct MongoDB Insert (mongosh)

```bash
mongosh

use shopify-store-builder

# Replace with your email and password
db.users.insertOne({
  email: "admin@example.com",
  password: "$2b$10$vS0Qdevelopment.hash.here", # You'll need to hash this
  role: "admin",
  stores: [],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**Note:** For the password, register normally first, then change the role to admin.

## 📦 Step 8: Add Your First Product (As Admin)

1. Log in with your admin account
2. Go to **Admin Panel** from the navbar
3. Click **+ Add Product**
4. Fill in the form:
   - **Title:** e.g., "Wireless Bluetooth Headphones"
   - **Description:** Product details
   - **Price:** e.g., 49.99
   - **Category:** e.g., "electronics"
   - **Image URLs:** Paste direct image URLs (e.g., from Unsplash, your CDN, etc.)
5. Click **Create Product**

## 🔗 Step 9: Connect Shopify (As User)

1. Log in as a regular user (or admin)
2. Go to **Dashboard**
3. In the Shopify Connection section:
   - Enter your Shopify store name (without .myshopify.com)
   - Click **Connect Shopify Account**
4. You'll be redirected to Shopify to authorize
5. After authorization, you'll be redirected back to the dashboard

**Note:** You need a Shopify development store or partner account for this to work.

## 🏪 Step 10: Create Your First Store

1. Go to **Products** from the navbar
2. Click on any product
3. Click **🚀 Create My Store with This Product**
4. Wait for the store creation (takes 5-10 seconds)
5. Success! You'll see:
   - Store URL
   - Product URL  
   - Admin panel link

## 🎉 You're All Set!

Your MVP is now running! Here's what you can do:

### As Admin:
- ✅ Add, edit, delete products
- ✅ Manage product catalog
- ✅ View all products and categories

### As User:
- ✅ Register and log in
- ✅ Browse product catalog
- ✅ Connect Shopify account
- ✅ Create stores with one click
- ✅ View created stores in dashboard

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running. Restart the MongoDB service.

### Shopify OAuth Error
```
Error: invalid_request
```
**Solutions:**
- Check that your redirect URI in Shopify app settings matches exactly: `http://localhost:5000/api/shopify/callback`
- Verify API key and secret in `.env` are correct
- Make sure you've added all required OAuth scopes

### CORS Error in Browser
```
Access to XMLHttpRequest has been blocked by CORS policy
```
**Solution:** Verify `CORS_ORIGIN` in backend `.env` is set to `http://localhost:3000`

### JWT Token Expired
```
Error: Token expired
```
**Solution:** Log out and log back in. Tokens expire after 1 day by default.

### Product Creation Fails
```
Shopify API error: Unprocessable Entity
```
**Solution:** 
- Ensure all image URLs are valid and accessible
- Check that you're connected to Shopify
- Verify your Shopify access token hasn't expired

## 📚 API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Shopify
- `GET /api/shopify/auth` - Initiate OAuth
- `GET /api/shopify/callback` - OAuth callback
- `GET /api/shopify/status` - Connection status
- `POST /api/shopify/disconnect` - Disconnect

### Stores
- `POST /api/stores/create` - Create store
- `GET /api/stores` - Get user's stores

### Dashboard
- `GET /api/dashboard/stats` - Get user stats

## 🔐 Security Notes

For production deployment:

1. ✅ Change `JWT_SECRET` to a strong random string
2. ✅ Use environment-specific MongoDB URI (MongoDB Atlas for production)
3. ✅ Enable HTTPS
4. ✅ Update `CORS_ORIGIN` to your production domain
5. ✅ Update Shopify app URLs to production URLs
6. ✅ Add rate limiting
7. ✅ Enable MongoDB authentication
8. ✅ Use proper SSL certificates

## 🚀 Next Steps

After MVP is working, you can add:

- 🤖 AI Marketing Generator (OpenAI integration)
- 📧 Email Notifications (Nodemailer)
- 💳 Payment System (Razorpay)
- 📊 Analytics Dashboard
- 🎨 Custom Themes
- 📱 Mobile App (React Native)

## 💡 Tips

- Use MongoDB Compass for easy database visualization
- Use Postman to test API endpoints
- Check browser console for frontend errors
- Check terminal logs for backend errors
- Use `console.log()` for debugging

## 🆘 Need Help?

- Check the README.md files in `/backend` and `/frontend`
- Review the code comments
- Check MongoDB and Shopify documentation
- Verify all environment variables are set correctly

---

**Happy Building! 🎉**

Created with ❤️ for Auto Shopify Store Builder MVP

