# ✅ Testing Checklist - Auto Shopify Store Builder MVP

Use this checklist to verify all features are working correctly.

## 🔧 Prerequisites Testing

- [ ] MongoDB is running and accessible
- [ ] Backend server starts without errors (`npm run dev` in `/backend`)
- [ ] Frontend server starts without errors (`npm run dev` in `/frontend`)
- [ ] Environment variables are properly configured
- [ ] Health endpoint returns success: `http://localhost:5000/api/health`

## 🔐 Phase 1: Authentication System

### User Registration
- [ ] Navigate to `/register`
- [ ] Register with email: `testuser@example.com` and password: `password123`
- [ ] Should redirect to dashboard after successful registration
- [ ] Should show error for duplicate email registration
- [ ] Should validate password minimum length (6 characters)
- [ ] Should validate email format

### User Login
- [ ] Navigate to `/login`
- [ ] Login with registered credentials
- [ ] Should redirect to dashboard after successful login
- [ ] Should show error for incorrect password
- [ ] Should show error for non-existent email
- [ ] JWT token should be stored in localStorage

### Protected Routes
- [ ] Try accessing `/dashboard` without logging in → should redirect to `/login`
- [ ] After login, `/dashboard` should be accessible
- [ ] Logout button should work and redirect to login page
- [ ] Token should persist across page refreshes

## 👨‍💼 Phase 2: Admin Panel

### Create Admin User
- [ ] Register a new user or use existing user
- [ ] Change role to 'admin' in MongoDB:
  ```javascript
  db.users.updateOne(
    { email: "admin@example.com" },
    { $set: { role: "admin" } }
  )
  ```
- [ ] Login with admin user
- [ ] "Admin" link should appear in navbar

### Product Management
- [ ] Navigate to `/admin/products`
- [ ] Should see empty state with "Add Your First Product" button

#### Create Product
- [ ] Click "+ Add Product"
- [ ] Fill in form:
  - Title: "Test Wireless Headphones"
  - Description: "High-quality wireless Bluetooth headphones with noise cancellation"
  - Price: 79.99
  - Category: "electronics"
  - Image URL: `https://images.unsplash.com/photo-1505740420928-5e560c06d30e`
  - Active: checked
- [ ] Click "Create Product"
- [ ] Should redirect to product list
- [ ] New product should appear in the list

#### Edit Product
- [ ] Click "Edit" on the test product
- [ ] Change price to 69.99
- [ ] Click "Update Product"
- [ ] Should show updated price in list

#### Delete Product (Optional)
- [ ] Click "Delete" on a test product
- [ ] Confirm deletion
- [ ] Product should be removed from list

**Create at least 3 different products for testing:**
- [ ] Product 1: Electronics category
- [ ] Product 2: Fashion category  
- [ ] Product 3: Home goods category

## 🛍️ Phase 3: Product Catalog (User View)

### Browse Products
- [ ] Log out and log in as regular user (non-admin)
- [ ] Navigate to `/products`
- [ ] All active products should be displayed
- [ ] Category filter buttons should appear
- [ ] Click on category filter → should filter products correctly

### Product Detail Page
- [ ] Click on any product card
- [ ] Should navigate to `/products/[id]`
- [ ] Product images, title, price, description should display
- [ ] If multiple images, thumbnail gallery should work
- [ ] "Create My Store" button should be visible

## 🔗 Phase 4: Shopify OAuth Integration

### Connect Shopify Account
- [ ] Ensure you have a Shopify Partner account
- [ ] Create a development store in your Partner account (if you don't have one)
- [ ] Navigate to `/dashboard`
- [ ] Shopify connection status should show "Not connected"
- [ ] Enter your store name (e.g., "your-store" without .myshopify.com)
- [ ] Click "Connect Shopify Account"
- [ ] Should redirect to Shopify OAuth page
- [ ] Click "Install" on Shopify
- [ ] Should redirect back to dashboard
- [ ] Should show success message: "✅ Shopify account connected successfully!"
- [ ] Connection status should now show "Connected to: your-store.myshopify.com"

### Verify Connection in Database
- [ ] Check MongoDB: user document should have:
  - `shopifyAccessToken`: (non-empty string)
  - `shopifyShop`: "your-store.myshopify.com"

### Disconnect Shopify
- [ ] Click "Disconnect Account" button
- [ ] Confirm disconnection
- [ ] Page should reload
- [ ] Connection status should return to "Not connected"
- [ ] MongoDB should have nullified Shopify fields

## 🏪 Phase 5: Store Creation

### Prerequisites
- [ ] User is logged in
- [ ] Shopify account is connected
- [ ] At least one product exists

### Create Store
- [ ] Navigate to `/products`
- [ ] Click on any product
- [ ] Click "🚀 Create My Store with This Product"
- [ ] Button should show loading spinner
- [ ] Wait 5-10 seconds for store creation

### Success Modal
- [ ] Success modal should appear with:
  - 🎉 emoji
  - "Store Created Successfully!" heading
  - Store URL (clickable)
  - Product URL (clickable)
  - Admin Panel link (clickable)
- [ ] Click on Store URL → should open Shopify store (may show password page)
- [ ] Click on Admin Panel link → should open Shopify admin

### Verify in Shopify
- [ ] Log in to your Shopify store admin
- [ ] Go to Products
- [ ] New product should appear with:
  - Correct title
  - Correct description
  - Correct price
  - Product images
  - Status: Active

### Dashboard Updates
- [ ] Click "Go to Dashboard" in success modal
- [ ] Dashboard should refresh
- [ ] "Your Stores" section should show the new store:
  - Product name
  - Store URL (clickable)
  - Creation date
  - "Visit Store" button

### Create Multiple Stores
- [ ] Create 2-3 more stores with different products
- [ ] All should appear in dashboard
- [ ] Each should be clickable

## 📊 Phase 6: Dashboard Functionality

### Dashboard Elements
- [ ] Welcome message with user email
- [ ] Shopify connection card with status
- [ ] Stores list (if any stores created)
- [ ] Quick actions section with links
- [ ] Logout button

### Quick Actions
- [ ] "Browse Products" link → navigates to `/products`
- [ ] Admin panel link appears only for admin users

### API Endpoint Test
- [ ] Test dashboard stats endpoint:
  ```bash
  curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
       http://localhost:5000/api/dashboard/stats
  ```
- [ ] Should return user stats including store count

## 🔄 Phase 7: Complete User Journey

### As New User (End-to-End)
1. [ ] Open `http://localhost:3000`
2. [ ] Click "Get Started Free"
3. [ ] Register with new email
4. [ ] Should land on dashboard
5. [ ] Click "Browse Products"
6. [ ] View product catalog
7. [ ] Click on a product
8. [ ] Try to create store → should prompt to connect Shopify
9. [ ] Return to dashboard
10. [ ] Connect Shopify account
11. [ ] Go back to products
12. [ ] Select a product
13. [ ] Create store
14. [ ] View success modal
15. [ ] Visit created store
16. [ ] Return to dashboard to see store listed

### As Admin User
1. [ ] Login as admin
2. [ ] Navigate to Admin Panel
3. [ ] Add 3 new products
4. [ ] Edit one product
5. [ ] View products page as user would
6. [ ] Create a store with own product
7. [ ] Verify store appears in dashboard

## 🐛 Error Handling Tests

### Authentication Errors
- [ ] Try accessing `/api/products` with invalid JWT → 401 error
- [ ] Try admin routes with non-admin user → 403 error
- [ ] Try with expired JWT → redirects to login

### Shopify Errors
- [ ] Try creating store without Shopify connection → error message
- [ ] Try creating store with invalid product ID → 404 error
- [ ] Simulate Shopify API error (disconnect internet briefly) → user-friendly error

### Validation Errors
- [ ] Try creating product with empty title → validation error
- [ ] Try creating product with negative price → validation error
- [ ] Try creating product without images → validation error
- [ ] Try registration with existing email → error message

## 🌐 Cross-Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

Verify:
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Store creation works
- [ ] Modals display properly
- [ ] No console errors

## 📱 Responsive Design Testing

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

Check:
- [ ] Navigation menu is usable
- [ ] Forms are accessible
- [ ] Product grid adapts
- [ ] Dashboard is readable
- [ ] Modal fits on screen

## 🔒 Security Testing

- [ ] JWT tokens are properly validated
- [ ] Admin routes reject non-admin users
- [ ] Protected routes redirect to login
- [ ] Passwords are hashed in database (never plain text)
- [ ] CORS is properly configured
- [ ] SQL injection not possible (using Mongoose ODM)

## ⚡ Performance Testing

- [ ] Product list loads quickly (<2 seconds)
- [ ] Store creation completes in <15 seconds
- [ ] Dashboard loads instantly
- [ ] No memory leaks (check browser DevTools)
- [ ] Images load efficiently

## 📝 API Testing with Postman/cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Products
```bash
curl http://localhost:5000/api/products
```

### Get Current User
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/auth/me
```

## ✅ Final Verification

- [ ] All core features work without errors
- [ ] User journey is smooth and intuitive
- [ ] Error messages are clear and helpful
- [ ] UI is responsive and visually appealing
- [ ] No console errors in browser
- [ ] No errors in terminal logs
- [ ] MongoDB data is structured correctly
- [ ] Shopify products are created successfully

## 📊 Success Criteria Met

The MVP is complete when:

1. ✅ Admin can add products via admin panel
2. ✅ Users can register and log in
3. ✅ Users can browse product catalog
4. ✅ Users can connect Shopify account via OAuth
5. ✅ Users can create a new Shopify store with one click
6. ✅ Created stores appear in user dashboard
7. ✅ Store contains the selected product with all details

## 🎉 Congratulations!

If all items are checked, your MVP is fully functional and ready for the next phase of development!

### Next Steps:
- Add AI marketing content generator
- Implement email notifications
- Integrate payment system (Razorpay)
- Add analytics dashboard
- Deploy to production

---

**Testing completed by:** _________________

**Date:** _________________

**Status:** Pass ✅ / Fail ❌

**Notes:**

