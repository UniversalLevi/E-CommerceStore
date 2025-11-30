import axios, { AxiosInstance, AxiosError } from 'axios';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = RAW_API_URL.replace(/\/+$/, '');
const BASE_HAS_API_SUFFIX = API_URL.endsWith('/api');

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookies (HttpOnly)
    });

    // Request interceptor to handle FormData
    this.client.interceptors.request.use((config) => {
      // If data is FormData, remove Content-Type header to let browser set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      return config;
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Don't redirect if we're checking auth status or already on login/register
          const url = error.config?.url || '';
          const isAuthCheck = url.includes('/api/auth/me');
          const isPublicPage = typeof window !== 'undefined' && 
            (window.location.pathname === '/login' || 
             window.location.pathname === '/register' ||
             window.location.pathname === '/');
          
          // Only redirect if not checking auth and not on public pages
          if (!isAuthCheck && !isPublicPage && typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /** Normalize path to avoid duplicated `/api` when baseURL already includes it */
  private buildPath(path: string) {
    if (BASE_HAS_API_SUFFIX && path.startsWith('/api/')) {
      return path.replace(/^\/api/, '');
    }
    return path;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      const isRetryable = 
        error.response?.status >= 500 && 
        error.response?.status < 600 &&
        error.response?.data?.retryable !== false &&
        retries > 0;

      if (!isRetryable) {
        throw error;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest(requestFn, retries - 1, delay * 2);
    }
  }

  async get<T>(url: string) {
    return this.retryRequest(async () => {
      const response = await this.client.get<T>(this.buildPath(url));
      return response.data;
    });
  }

  async post<T>(url: string, data?: any, config?: any) {
    return this.retryRequest(async () => {
      const response = await this.client.post<T>(this.buildPath(url), data, config);
      return response.data;
    });
  }

  async put<T>(url: string, data?: any) {
    return this.retryRequest(async () => {
      const response = await this.client.put<T>(this.buildPath(url), data);
      return response.data;
    });
  }

  async delete<T>(url: string, data?: any) {
    return this.retryRequest(async () => {
      const response = await this.client.delete<T>(this.buildPath(url), data ? { data } : undefined);
      return response.data;
    });
  }

  // Payment API methods
  async getPlans() {
    return this.get<{ success: boolean; data: { plans: any[] } }>('/api/payments/plans');
  }

  async createPaymentOrder(planCode: string) {
    return this.post<{ success: boolean; data: { orderId: string; amount: number; currency: string; keyId: string } }>(
      '/api/payments/create-order',
      { planCode }
    );
  }

  async verifyPayment(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    planCode: string;
  }) {
    return this.post<{ success: boolean; message: string; data: any }>(
      '/api/payments/verify',
      paymentData
    );
  }

  async getPaymentHistory() {
    return this.get<{ success: boolean; data: any[] }>('/api/payments/history');
  }

  async getCurrentPlan() {
    return this.get<{ success: boolean; data: any }>('/api/payments/current-plan');
  }
}

export const api = new ApiClient();

