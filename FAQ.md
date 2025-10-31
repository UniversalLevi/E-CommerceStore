# ❓ Frequently Asked Questions (FAQ)

## 🚀 Getting Started

### Q: What do I need to run this project?
**A:** You need:
- Node.js 18 or higher
- MongoDB (running locally or cloud)
- Shopify Partner account (for full features)
- Code editor (VS Code recommended)

### Q: How long does setup take?
**A:** 
- Basic setup: 5-10 minutes
- With Shopify integration: 15-20 minutes
- Full testing: 30-45 minutes

### Q: Can I test without a Shopify account?
**A:** Yes! You can test:
- ✅ User registration/login
- ✅ Product browsing
- ✅ Admin panel
- ❌ Cannot test: Store creation (requires Shopify)

---

## 🔧 Technical Questions

### Q: Why am I getting "MongoDB connection failed"?
**A:** MongoDB is not running. Start it:
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Q: Port 5000 or 3000 is already in use. What do I do?
**A:** Change the port:
- Backend: Edit `PORT=5000` in `backend/.env` to `PORT=5001`
- Frontend: Next.js will auto-increment to 3001 if 3000 is busy
- Remember to update `NEXT_PUBLIC_API_URL` in frontend

### Q: How do I create an admin user?
**A:** Two methods:

**Method 1 (Easy):**
```bash
cd backend
npm run create-admin
# Follow the prompts
```

**Method 2 (Manual):**
1. Register normally at `/register`
2. Open MongoDB and find your user
3. Change `role: "user"` to `role: "admin"`
4. Logout and login again

### Q: What TypeScript version should I use?
**A:** TypeScript 5.3+ is recommended. The project is configured for optimal type safety.

---

## 🛍️ Shopify Integration

### Q: Do I need a paid Shopify account?
**A:** No! Use Shopify Partner account (free) which allows:
- Creating development stores
- Testing apps
- Full API access

### Q: Where do I get Shopify API credentials?
**A:** 
1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create an app
3. Go to app Configuration
4. Copy API Key and API Secret
5. Add to `backend/.env`

### Q: What's the difference between development and production Shopify apps?
**A:**
- **Development:** Testing only, free, has limitations
- **Production:** Real stores, requires approval, full features

### Q: Can I use an existing Shopify store?
**A:** Yes! The OAuth flow works with:
- Development stores (from Partners)
- Production stores
- Any Shopify account you own

### Q: What Shopify API scopes do I need?
**A:** Minimum required:
- `write_products` - Create products
- `read_products` - Read product data
- `write_themes` - Modify store themes (optional)
- `read_themes` - Read theme data (optional)

### Q: Why does store creation fail?
**A:** Common reasons:
1. Shopify token expired → Reconnect your account
2. Invalid API credentials → Check `.env` file
3. Rate limit exceeded → Wait 1 minute and retry
4. Product data invalid → Check image URLs are accessible

---

## 💻 Development

### Q: How do I add more products?
**A:** Three ways:

**1. Use Seeder (Quick):**
```bash
cd backend
npm run seed
```

**2. Via Admin Panel:**
- Login as admin
- Go to Admin Panel → Products
- Click "Add Product"

**3. Via API:**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test product",...}'
```

### Q: Where are images stored?
**A:** Images are stored as URLs (not uploaded). Use:
- External image hosting (Imgur, Cloudinary)
- Your own CDN
- Direct URLs from suppliers
- Free sources like Unsplash

### Q: Can I add image upload functionality?
**A:** Yes! You can integrate:
- AWS S3
- Cloudinary
- Multer (local storage)
- Any cloud storage service

### Q: How do I customize the UI?
**A:** 
- Colors: Edit `tailwind.config.ts`
- Components: Modify files in `frontend/components/`
- Pages: Edit files in `frontend/app/`
- Global styles: Update `frontend/app/globals.css`

---

## 🔐 Security

### Q: How secure is this application?
**A:** Security features:
- ✅ JWT token authentication
- ✅ Password hashing (bcrypt)
- ✅ CORS protection
- ✅ Request validation (Zod)
- ✅ Protected routes
- ✅ Admin role verification

### Q: Should I change the JWT_SECRET?
**A:** **YES!** Always change it to a random, secure string:
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Q: How long do JWT tokens last?
**A:** Default: 1 day. Change in `backend/.env`:
```env
JWT_EXPIRES_IN=1d   # 1 day
JWT_EXPIRES_IN=7d   # 7 days
JWT_EXPIRES_IN=12h  # 12 hours
```

### Q: Is it safe to store JWT in localStorage?
**A:** For MVP: Yes. For production: Consider:
- HttpOnly cookies (more secure)
- Refresh token rotation
- XSS protection measures

---

## 🐛 Troubleshooting

### Q: "Cannot find module" error
**A:** Run `npm install` again:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Q: Frontend can't connect to backend
**A:** Check:
1. Backend is running on port 5000
2. Frontend `.env.local` has correct URL
3. CORS is enabled in backend
4. No firewall blocking requests

### Q: Products don't appear
**A:** Verify:
1. Products exist in MongoDB
2. Products are marked as `active: true`
3. User is not filtered by category
4. Check browser console for errors

### Q: Shopify OAuth redirects but doesn't connect
**A:** Verify:
1. Redirect URI in Shopify app matches exactly
2. API credentials are correct
3. State parameter is valid
4. Check backend logs for errors

### Q: Store creation succeeds but product missing in Shopify
**A:** Check:
1. Image URLs are publicly accessible
2. Product data is valid
3. Shopify access token is not expired
4. API rate limits not exceeded

---

## 📊 Features & Functionality

### Q: Can users create multiple stores?
**A:** Yes! Users can create unlimited stores, each with different products.

### Q: Can one store have multiple products?
**A:** Current MVP: One product per store creation. 
**Future:** Can be extended to multiple products.

### Q: How do I track store performance?
**A:** Current MVP: Basic tracking (store count, creation date).
**Future:** Add analytics dashboard with sales, visits, conversions.

### Q: Can I customize the Shopify store theme?
**A:** Not in current MVP. The store uses default Shopify theme.
**Future:** Add theme selection and customization features.

### Q: Does this work with dropshipping?
**A:** The MVP adds products to Shopify. For dropshipping:
- Integrate with suppliers (AliExpress, Spocket, Printful)
- Add inventory management
- Set up order fulfillment

---

## 🚀 Deployment

### Q: How do I deploy to production?
**A:** Steps:
1. Build both applications
2. Set up MongoDB Atlas (cloud DB)
3. Deploy backend (Heroku, Railway, VPS)
4. Deploy frontend (Vercel, Netlify)
5. Update environment variables
6. Configure production Shopify app

### Q: What's the best hosting option?
**A:** Recommendations:
- **Frontend:** Vercel (free, optimized for Next.js)
- **Backend:** Railway, Render, or VPS
- **Database:** MongoDB Atlas (free tier)

### Q: Do I need HTTPS for production?
**A:** **Yes!** Required for:
- Shopify OAuth
- Secure authentication
- Production deployment
- Use Let's Encrypt (free SSL)

---

## 💰 Costs

### Q: Is this project free to use?
**A:** Yes! All technologies used are free:
- Node.js, MongoDB, Next.js: Open source
- Shopify Partner: Free
- Development: $0

### Q: What are the production costs?
**A:** Estimated monthly costs:
- **Hosting:** $0-20 (Vercel free + backend hosting)
- **Database:** $0-10 (MongoDB Atlas free tier)
- **Domain:** $10-15/year
- **Total:** ~$0-30/month

### Q: Do users need to pay for Shopify?
**A:** Yes, users need their own Shopify plan:
- Basic: $29/month
- Shopify: $79/month
- Advanced: $299/month

---

## 🎯 Future Features

### Q: What features are planned for Phase 2?
**A:** Roadmap includes:
- 🤖 AI marketing content generator
- 📧 Email notifications
- 💳 Payment system (Razorpay)
- 📊 Analytics dashboard
- 🎨 Theme customization
- 📱 Mobile app

### Q: Can I add my own features?
**A:** Absolutely! The codebase is:
- Well-structured
- TypeScript for type safety
- Modular and extensible
- Documented

### Q: How do I contribute?
**A:** 
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📚 Learning Resources

### Q: I'm new to Next.js. Where do I start?
**A:** Resources:
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn Tutorial](https://nextjs.org/learn)
- [React Documentation](https://react.dev)

### Q: I don't know MongoDB. Is that okay?
**A:** Yes! Resources:
- [MongoDB University](https://university.mongodb.com)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- Use MongoDB Compass for visual interface

### Q: Where can I learn about Shopify APIs?
**A:** Resources:
- [Shopify Dev Docs](https://shopify.dev/docs)
- [Shopify Partners](https://partners.shopify.com)
- [API Reference](https://shopify.dev/api/admin-rest)

---

## 🆘 Still Need Help?

### Q: Where can I get more help?
**A:** Check:
1. **Documentation:** README.md, SETUP_GUIDE.md
2. **Code Comments:** Well-documented codebase
3. **Console Logs:** Check terminal and browser console
4. **GitHub Issues:** Create an issue (if applicable)

### Q: How do I report a bug?
**A:** Include:
- Description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Console/terminal errors
- Environment (OS, Node version)

### Q: Can I hire someone to customize this?
**A:** Yes! Consider:
- Freelance developers
- Development agencies
- Full-stack developers familiar with:
  - Next.js + React
  - Node.js + Express
  - MongoDB
  - Shopify APIs

---

**Still have questions? Check the other documentation files or create an issue!**

📖 **See also:**
- QUICK_START.md - Get started in 5 minutes
- SETUP_GUIDE.md - Detailed setup instructions
- TESTING_CHECKLIST.md - Testing guide
- PROJECT_SUMMARY.md - Complete feature overview

