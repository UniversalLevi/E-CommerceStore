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

  // Wallet API methods
  async getWallet() {
    return this.get<{
      success: boolean;
      data: {
        balance: number;
        balanceFormatted: string;
        currency: string;
        autoRechargeEnabled: boolean;
        autoRechargeAmount: number | null;
        minAutoRechargeThreshold: number;
      };
    }>('/api/wallet');
  }

  async getWalletTransactions(params?: {
    limit?: number;
    offset?: number;
    type?: 'credit' | 'debit';
    startDate?: string;
    endDate?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());
    if (params?.type) searchParams.append('type', params.type);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    
    const queryString = searchParams.toString();
    return this.get<{
      success: boolean;
      data: Array<{
        id: string;
        amount: number;
        amountFormatted: string;
        type: 'credit' | 'debit';
        reason: string;
        referenceId: string;
        orderId: any;
        balanceBefore: number;
        balanceAfter: number;
        createdAt: string;
      }>;
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(`/api/wallet/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async createWalletTopupOrder(amount: number) {
    return this.post<{
      success: boolean;
      data: {
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        walletId: string;
      };
    }>('/api/wallet/topup', { amount });
  }

  async verifyWalletTopup(paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    return this.post<{
      success: boolean;
      message: string;
      data: {
        balance: number;
        balanceFormatted: string;
        transactionId: string;
        amount: number;
        amountFormatted: string;
      };
    }>('/api/wallet/topup/verify', paymentData);
  }

  async getPayoutMethods() {
    return this.get<{
      success: boolean;
      data: any[];
    }>('/api/wallet/payout-methods');
  }

  async upsertPayoutMethod(payload: any) {
    return this.post<{
      success: boolean;
      data: any;
    }>('/api/wallet/payout-methods', payload);
  }

  async deletePayoutMethod(id: string) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/api/wallet/payout-methods/${id}`);
  }

  async requestWithdrawal(payload: {
    amount: number; // in paise
    payoutMethodId?: string;
    userNote?: string;
  }) {
    return this.post<{
      success: boolean;
      message: string;
      data: any;
    }>('/api/wallet/withdraw', payload);
  }

  async getUserWithdrawals(params: { limit?: number; offset?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = query ? `/api/wallet/withdrawals?${query}` : '/api/wallet/withdrawals';

    return this.get<{
      success: boolean;
      data: any[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(url);
  }

  // ZEN Fulfillment API methods
  async getOrderZenStatus(storeId: string, orderId: string) {
    return this.get<{
      success: boolean;
      data: {
        hasLocalOrder: boolean;
        orderId?: string;
        shopifyOrderId?: number;
        zenStatus: string;
        productCost?: number;
        shippingCost?: number;
        serviceFee?: number;
        requiredAmount?: number;
        walletChargeAmount?: number;
        walletChargedAt?: string;
        walletShortage?: number;
        zenOrder?: {
          id: string;
          status: string;
          trackingNumber: string | null;
          courierProvider: string | null;
          createdAt: string;
        } | null;
      };
    }>(`/api/orders/${storeId}/${orderId}/zen-status`);
  }

  async setOrderCosts(storeId: string, orderId: string, costs: {
    productCost?: number;
    shippingCost?: number;
    serviceFee?: number;
  }) {
    return this.put<{
      success: boolean;
      message: string;
      data: {
        id: string;
        shopifyOrderId: number;
        productCost: number;
        shippingCost: number;
        serviceFee: number;
        totalRequired: number;
      };
    }>(`/api/orders/${storeId}/${orderId}/costs`, costs);
  }

  async fulfillViaZen(storeId: string, orderId: string, costs: {
    productCost: number;
    shippingCost: number;
    serviceFee?: number;
  }) {
    return this.post<{
      success: boolean;
      message?: string;
      reason?: string;
      data: {
        orderId?: string;
        zenOrderId?: string;
        zenStatus?: string;
        walletDeducted?: number;
        walletDeductedFormatted?: string;
        newBalance?: number;
        newBalanceFormatted?: string;
        currentBalance?: number;
        currentBalanceFormatted?: string;
        requiredAmount?: number;
        requiredAmountFormatted?: string;
        shortage?: number;
        shortageFormatted?: string;
      };
    }>(`/api/orders/${storeId}/${orderId}/fulfill-via-zen`, costs);
  }

  // Admin withdrawal methods
  async adminGetWithdrawals(params: {
    status?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.userId) searchParams.set('userId', params.userId);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    const url = query ? `/api/wallet/admin/withdrawals?${query}` : '/api/wallet/admin/withdrawals';

    return this.get<{
      success: boolean;
      data: any[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(url);
  }

  async adminUpdateWithdrawalStatus(
    withdrawalId: string,
    payload: {
      status: 'pending' | 'processing' | 'approved' | 'rejected' | 'paid' | 'failed';
      adminNote?: string;
      txRef?: string;
    }
  ) {
    return this.post<{
      success: boolean;
      message: string;
      data: any;
    }>(`/api/wallet/admin/withdrawals/${withdrawalId}/status`, payload);
  }

  // Email Sender API methods
  async getSmtpAccounts() {
    return this.get<{
      success: boolean;
      data: any[];
    }>('/api/admin/email-sender/smtp-accounts');
  }

  async createSmtpAccount(payload: any) {
    return this.post<{
      success: boolean;
      data: any;
    }>('/api/admin/email-sender/smtp-accounts', payload);
  }

  async updateSmtpAccount(id: string, payload: any) {
    return this.put<{
      success: boolean;
      data: any;
    }>(`/api/admin/email-sender/smtp-accounts/${id}`, payload);
  }

  async deleteSmtpAccount(id: string) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/api/admin/email-sender/smtp-accounts/${id}`);
  }

  async testSmtpAccount(id: string) {
    return this.post<{
      success: boolean;
      message: string;
    }>(`/api/admin/email-sender/smtp-accounts/${id}/test`);
  }

  async getEmailTemplates() {
    return this.get<{
      success: boolean;
      data: any[];
    }>('/api/admin/email-sender/templates');
  }

  async createEmailTemplate(payload: any) {
    return this.post<{
      success: boolean;
      data: any;
    }>('/api/admin/email-sender/templates', payload);
  }

  async updateEmailTemplate(id: string, payload: any) {
    return this.put<{
      success: boolean;
      data: any;
    }>(`/api/admin/email-sender/templates/${id}`, payload);
  }

  async deleteEmailTemplate(id: string) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/api/admin/email-sender/templates/${id}`);
  }

  async sendBulkEmails(payload: {
    recipients: string[];
    subject?: string;
    htmlContent?: string;
    plainTextContent?: string;
    smtpAccountId?: string;
    templateId?: string;
  }) {
    return this.post<{
      success: boolean;
      data: {
        sent: number;
        failed: number;
        total: number;
        errors: Array<{ email: string; error: string }>;
      };
    }>('/api/admin/email-sender/send', payload);
  }

  async getEmailLogs(params: {
    page?: number;
    limit?: number;
    status?: string;
    recipient?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.recipient) searchParams.set('recipient', params.recipient);

    const query = searchParams.toString();
    const url = query ? `/api/admin/email-sender/logs?${query}` : '/api/admin/email-sender/logs';

    return this.get<{
      success: boolean;
      data: {
        logs: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(url);
  }
}

export const api = new ApiClient();

