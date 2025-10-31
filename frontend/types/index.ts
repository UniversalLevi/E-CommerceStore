export interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  shopifyConnected?: boolean;
  shopifyShop?: string;
  stores: Store[];
}

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  active: boolean;
  createdAt: string;
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

