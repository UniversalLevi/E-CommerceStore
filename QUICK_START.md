# ⚡ Quick Start Guide - 5 Minutes to Running MVP

## 🎯 Goal
Get the Auto Shopify Store Builder running in 5 minutes.

## ✅ Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running
- [ ] Code editor open in project directory

## 🚀 Steps

### 1. Install Dependencies (2 minutes)
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment (1 minute)

**Backend** - Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shopify-store-builder
JWT_SECRET=change-this-to-random-secure-string-abc123xyz
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:3000
SHOPIFY_API_KEY=get-from-shopify-partners
SHOPIFY_API_SECRET=get-from-shopify-partners
SHOPIFY_REDIRECT_URI=http://localhost:5000/api/shopify/callback
SHOPIFY_SCOPES=write_products,read_products,write_themes,read_themes
```

**Frontend** - Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Note:** For now, you can use placeholder values for Shopify credentials to test non-Shopify features.

### 3. Start MongoDB (10 seconds)
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Run Applications (30 seconds)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Verify (30 seconds)
- Open: http://localhost:3000 ✅
- Check: http://localhost:5000/api/health ✅

## 🎉 You're Ready!

### Test Basic Flow (Without Shopify):
1. Go to http://localhost:3000
2. Click "Get Started Free"
3. Register with email/password
4. You'll land on the dashboard
5. ✅ Authentication works!

### To Test Full Flow (With Shopify):
1. Create Shopify Partner account at https://partners.shopify.com
2. Create a custom app
3. Get API credentials
4. Update `backend/.env` with real Shopify values
5. Restart backend server
6. Follow full setup guide in `SETUP_GUIDE.md`

## 📚 What's Next?

- **Add Products:** Create admin user and add products (see SETUP_GUIDE.md)
- **Connect Shopify:** Get real Shopify credentials (see SETUP_GUIDE.md)
- **Full Testing:** Use TESTING_CHECKLIST.md for complete validation
- **Learn More:** Read PROJECT_SUMMARY.md for full feature list

## 🐛 Common Issues

**MongoDB not running?**
```bash
# Check if MongoDB is running
mongosh
```

**Port already in use?**
- Change `PORT=5000` in backend/.env to `PORT=5001`
- Update frontend/.env.local to match

**Dependencies failed to install?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🎯 Success Indicators

✅ Backend shows:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

✅ Frontend shows:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
✓ Ready in XXXms
```

✅ You can:
- Register a new user
- Login successfully
- See the dashboard
- Navigate between pages

---

**Need detailed help?** See `SETUP_GUIDE.md`  
**Want to test everything?** See `TESTING_CHECKLIST.md`  
**Curious about features?** See `PROJECT_SUMMARY.md`

**Happy building! 🚀**

