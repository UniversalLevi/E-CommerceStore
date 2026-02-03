export interface User {
  _id: string;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  country?: string | null;
  role: 'user' | 'admin';
  shopifyConnected?: boolean;
  shopifyShop?: string;
  stores: Store[];
  createdAt?: string;
  lastLogin?: string;
  // Subscription fields
  plan?: PlanCode | null;
  planExpiresAt?: string | null;
  isLifetime?: boolean;
  productsAdded?: number;
  onboarding?: {
    nicheId: string;
    goal: 'dropship' | 'brand' | 'start_small';
    answeredAt: string;
  };
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
  price: number;          // final price (basePrice + profit + shippingPrice)
  basePrice?: number;     // base product cost
  profit?: number;        // profit margin
  shippingPrice?: number; // shipping cost component
  costPrice?: number;     // legacy field, kept for backward compatibility
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
export type SubscriptionStatus = 'active' | 'expired' | 'none' | 'trialing';

export interface Plan {
  code: PlanCode;
  name: string;
  price: number; // in paise (full amount)
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
  subscriptionId?: string | null;
  maxProducts: number | null;
  productsAdded: number;
  productsRemaining: number | null;
  trialEndsAt?: string | null;
  hasUsedTrial?: boolean;
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

// WhatsApp Product Draft types
export type WhatsAppDraftStatus = 'incoming' | 'enriched' | 'approved' | 'rejected';

export interface WhatsAppProductDraft {
  _id: string;
  whatsapp_message_id: string;
  original_image_url: string;
  generated_image_urls: string[];
  images_ai_generated: boolean;
  original_name: string;
  ai_name: string;
  cost_price: number;
  profit_margin: number;
  shipping_fee: number;
  final_price: number;
  ai_description: string;
  description_source: 'ai_whatsapp_intake';
  detected_niche?: {
    _id: string;
    name: string;
    icon?: string;
  };
  status: WhatsAppDraftStatus;
  needs_review: boolean;
  error_log: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppDraftStats {
  incoming: number;
  enriched: number;
  approved: number;
  rejected: number;
  total: number;
  pending_review: number;
}

// Export affiliate types
export * from './affiliate';
