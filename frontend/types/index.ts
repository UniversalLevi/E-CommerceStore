export interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  shopifyConnected?: boolean;
  shopifyShop?: string;
  stores: Store[];
}

export interface Niche {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  richDescription?: string;
  image?: string;
  icon?: string;
  active: boolean;
  featured: boolean;
  showOnHomePage: boolean;
  order: number;
  priority: number;
  isDefault: boolean;
  deleted?: boolean;
  deletedAt?: string;
  synonyms: string[];
  metaTitle?: string;
  metaDescription?: string;
  themeColor?: string;
  textColor?: string;
  defaultSortMode: 'popularity' | 'newest' | 'price_low_to_high' | 'price_high_to_low';
  productCount?: number; // Active products (public)
  activeProductCount?: number; // Cached count (public)
  totalProductCount?: number; // Cached count (admin only)
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category?: string; // Keep for backward compatibility
  niche: string | Niche; // ObjectId or populated object
  images: string[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Store {
  _id?: string;
  storeUrl: string;
  productId: string;
  productName?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta?: {
    niche?: Niche;
    lastUpdatedAt?: string;
  };
}

// Subscription types
export type PlanCode = 'starter_30' | 'growth_90' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'none';

export interface Plan {
  code: PlanCode;
  name: string;
  price: number; // in paise
  durationDays: number | null;
  isLifetime: boolean;
  maxProducts: number | null; // null = unlimited
  features: string[];
}

export interface Payment {
  _id: string;
  planCode: PlanCode;
  amount: number;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
}

export interface SubscriptionInfo {
  plan: string | null;
  planExpiresAt: string | null;
  isLifetime: boolean;
  status: SubscriptionStatus;
  maxProducts: number | null;
  productsAdded: number;
  productsRemaining: number | null;
}

export interface PaymentOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

