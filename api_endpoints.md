API endpoints by category:

## API endpoints reference

### Base URL
`http://localhost:5000/api`

---

## 1. Health & system

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/health` | ❌ Public | Server health check |

---

## 2. Authentication (`/api/auth`)

| Method | Endpoint | Auth Required | Rate Limit | Description |
|--------|----------|---------------|------------|-------------|
| `POST` | `/api/auth/register` | ❌ Public | ✅ Auth Rate Limit | Register new user account |
| `POST` | `/api/auth/login` | ❌ Public | ✅ Auth Rate Limit | Login user (returns JWT token) |
| `POST` | `/api/auth/logout` | ✅ Required | ✅ General Rate Limit | Logout user (clears token) |
| `GET` | `/api/auth/me` | ✅ Required | ✅ General Rate Limit | Get current user profile |
| `PUT` | `/api/auth/change-password` | ✅ Required | ✅ General Rate Limit | Change user password |
| `DELETE` | `/api/auth/account` | ✅ Required | ✅ General Rate Limit | Delete user account |

---

## 3. Products (`/api/products`)

### Public routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/products` | ❌ Public | Get all active products (supports `?active=true` query) |
| `GET` | `/api/products/categories` | ❌ Public | Get all product categories |
| `GET` | `/api/products/:id` | ❌ Public | Get product by ID |

### Admin routes

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `POST` | `/api/products` | ✅ Required | 🔒 Admin | Create new product |
| `PUT` | `/api/products/:id` | ✅ Required | 🔒 Admin | Update product |
| `DELETE` | `/api/products/:id` | ✅ Required | 🔒 Admin | Delete product |

---

## 4. Store connections (`/api/stores`)

### Store connection management

| Method | Endpoint | Auth Required | Rate Limit | Description |
|--------|----------|---------------|------------|-------------|
| `POST` | `/api/stores` | ✅ Required | ✅ Store Create | Create new store connection |
| `GET` | `/api/stores` | ✅ Required | ✅ General | List user's stores (admin sees all) |
| `GET` | `/api/stores/:id` | ✅ Required | - | Get store connection details |
| `PUT` | `/api/stores/:id` | ✅ Required | - | Update store connection credentials |
| `DELETE` | `/api/stores/:id` | ✅ Required | - | Delete store connection |
| `POST` | `/api/stores/:id/test` | ✅ Required | ✅ Store Test (5/min) | Test store connection |
| `PUT` | `/api/stores/:id/default` | ✅ Required | - | Set store as default |

### Legacy routes (backward compatibility)

| Method | Endpoint | Auth Required | Rate Limit | Description |
|--------|----------|---------------|------------|-------------|
| `POST` | `/api/stores/create` | ✅ Required | ✅ Store Create | Create Shopify store with product (legacy) |
| `GET` | `/api/stores/user-stores` | ✅ Required | ✅ General | Get user's created stores (legacy) |

---

## 5. Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/dashboard/stats` | ✅ Required | Get user dashboard statistics |

---

## 6. Admin (`/api/admin`)

All admin routes require authentication and admin role.

### Dashboard & system

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/api/admin/dashboard` | ✅ Required | 🔒 Admin | Get admin dashboard stats |
| `GET` | `/api/admin/health` | ✅ Required | 🔒 Admin | Get system health status |

### User management

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/api/admin/users` | ✅ Required | 🔒 Admin | List all users |
| `PUT` | `/api/admin/users/:id/role` | ✅ Required | 🔒 Admin | Update user role |
| `PUT` | `/api/admin/users/:id/status` | ✅ Required | 🔒 Admin | Toggle user active status |
| `DELETE` | `/api/admin/users/:id` | ✅ Required | 🔒 Admin | Delete user |

### Audit logs

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/api/admin/audit` | ✅ Required | 🔒 Admin | Get audit logs (with filters) |
| `GET` | `/api/admin/audit/export` | ✅ Required | 🔒 Admin | Export audit logs as CSV |

---

## Authentication

- Protected routes require a JWT token in:
  - Cookie: `auth_token` (HttpOnly)
  - Header: `Authorization: Bearer <token>`
- Admin routes require the `admin` role.

---

## Rate limiting

| Type | Limit | Window |
|------|-------|--------|
| Auth Rate Limit | 5 requests | 15 minutes |
| Store Create Rate Limit | 10 requests | 1 hour |
| Store Test Rate Limit | 5 requests | 1 minute |
| General API Rate Limit | 100 requests | 15 minutes |

---

## Frontend pages

| Route | Page | Auth Required |
|-------|------|---------------|
| `/` | Homepage | ❌ Public |
| `/login` | Login page | ❌ Public |
| `/register` | Registration page | ❌ Public |
| `/products` | Product catalog | ❌ Public |
| `/products/[id]` | Product details | ❌ Public |
| `/dashboard` | User dashboard | ✅ Required |
| `/dashboard/stores` | My stores | ✅ Required |
| `/dashboard/stores/connect` | Connect store | ✅ Required |
| `/dashboard/stores/[id]/edit` | Edit store | ✅ Required |
| `/settings` | User settings | ✅ Required |
| `/admin/products` | Admin products | ✅ Required + Admin |
| `/admin/products/new` | Create product | ✅ Required + Admin |
| `/admin/products/[id]/edit` | Edit product | ✅ Required + Admin |
| `/admin/stores` | All stores (admin) | ✅ Required + Admin |
| `/admin/dashboard` | Admin dashboard | ✅ Required + Admin |
| `/admin/users` | User management | ✅ Required + Admin |
| `/admin/audit` | Audit logs | ✅ Required + Admin |

---

## Summary

- Total API endpoints: 30+
- Public endpoints: 5 (health, register, login, products, categories)
- Protected endpoints: 25+ (require authentication)
- Admin-only endpoints: 8 (require admin role)
- Frontend pages: 15+

All endpoints return JSON with a `success` boolean and either `data` or `error` fields.