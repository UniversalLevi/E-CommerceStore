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

