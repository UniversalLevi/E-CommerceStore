# Frontend - Auto Shopify Store Builder

Next.js 14 application with TypeScript, Tailwind CSS, and App Router.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start
```

## 📁 Project Structure

```
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/    # User dashboard
│   ├── products/     # Product catalog
│   ├── admin/        # Admin panel
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── components/       # Reusable components
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   └── ...
├── lib/              # Utilities
│   └── api.ts        # API client with interceptors
└── types/            # TypeScript definitions
    └── index.ts
```

## 🎨 Styling

Using Tailwind CSS with custom theme configuration:

```javascript
// Primary green color palette
primary: {
  50: '#f0fdf4',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
}
```

## 🔌 API Integration

The `lib/api.ts` file provides a configured Axios client:

```typescript
import { api } from '@/lib/api';

// Automatically includes JWT token from localStorage
const data = await api.get('/products');
const result = await api.post('/auth/login', { email, password });
```

Features:
- Automatic token attachment from localStorage
- Auto-redirect to login on 401 errors
- Centralized error handling
- Type-safe responses

## 📄 Pages

### Public Pages
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/products` - Product catalog
- `/products/[id]` - Product details

### Protected Pages
- `/dashboard` - User dashboard
- `/admin/*` - Admin panel (admin role required)

## 🔐 Authentication Flow

1. User registers/logs in
2. JWT token stored in localStorage
3. Token automatically sent with API requests
4. If token expires (401), user redirected to login
5. Logout clears token from localStorage

## 🧩 Components

### Planned Components
- `Navbar` - Navigation with auth state
- `ProductCard` - Product display card
- `ProductGrid` - Grid layout for products
- `StoreCard` - Display created stores
- `LoadingSpinner` - Loading state
- `Modal` - Success/error modals
- `ProtectedRoute` - Auth wrapper component

## 🎯 Type Safety

TypeScript interfaces in `types/index.ts`:
- `User` - User data structure
- `Product` - Product details
- `Store` - Store information
- `AuthResponse` - Login/register response
- `ApiResponse<T>` - Generic API response

## 🛠️ Development

```bash
# Run dev server (hot reload)
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Format code
npx prettier --write .
```

## 📱 Responsive Design

All pages are mobile-first and responsive:
- Mobile: Base styles
- Tablet: `md:` prefix (768px+)
- Desktop: `lg:` prefix (1024px+)
- Large: `xl:` prefix (1280px+)

## 🌐 Environment Variables

Required variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For Ad Builder Platform features:

```env
# MongoDB connection (for Next.js API routes)
MONGODB_URI=mongodb://localhost:27017/shopify-store-builder

# OpenAI API key (for AI features)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# JWT Secret (must match backend JWT_SECRET)
JWT_SECRET=your-jwt-secret-key-minimum-32-characters-long
```

Note: `NEXT_PUBLIC_` prefix makes variables available in browser. Server-side variables (like `MONGODB_URI`, `OPENAI_API_KEY`, and `JWT_SECRET`) are only available in API routes and server components.

## 🚀 Deployment

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm start
```

Deploy to:
- Vercel (recommended for Next.js)
- Netlify
- VPS with PM2

## 📝 Notes

- Uses Next.js 14 App Router (not Pages Router)
- Server components by default (add 'use client' when needed)
- API calls should be in client components or server actions
- Images use Next.js Image component for optimization

