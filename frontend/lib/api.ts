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

  async createTrialSubscription(planCode: string) {
    return this.post<{ 
      success: boolean; 
      data: { 
        subscriptionId: string;
        mainSubscriptionId: string;
        orderId: string; 
        amount: number; 
        currency: string; 
        keyId: string;
        trialDays: number;
        trialEndsAt: string;
      } 
    }>(
      '/api/payments/create-trial-subscription',
      { planCode }
    );
  }

  async verifyPayment(paymentData: {
    razorpay_order_id?: string; // Optional for subscription payments
    razorpay_payment_id: string;
    razorpay_signature: string;
    planCode: string;
    subscription_id?: string;
  }) {
    return this.post<{ success: boolean; message: string; data: any }>(
      '/api/payments/verify',
      paymentData
    );
  }

  async getSubscriptionStatus() {
    return this.get<{ success: boolean; data: any }>('/api/subscriptions/current');
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

  async sendEmailsToCustomers(payload: {
    storeIds?: string[];
    subject?: string;
    htmlContent?: string;
    plainTextContent?: string;
    smtpAccountId?: string;
    templateId?: string;
    acceptsMarketingOnly?: boolean;
  }) {
    return this.post<{
      success: boolean;
      data: {
        sent: number;
        failed: number;
        total: number;
        errors: Array<{ email: string; error: string }>;
      };
    }>('/api/admin/email-sender/send-to-customers', payload);
  }

  // Customer management
  async syncCustomers(storeId: string) {
    return this.post<{
      success: boolean;
      message: string;
      data: {
        total: number;
        created: number;
        updated: number;
        skipped: number;
      };
    }>(`/api/customers/sync/${storeId}`);
  }

  async getCustomers(params: {
    storeId?: string;
    page?: number;
    limit?: number;
    search?: string;
    acceptsMarketing?: boolean;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.storeId) searchParams.set('storeId', params.storeId);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.acceptsMarketing) searchParams.set('acceptsMarketing', String(params.acceptsMarketing));

    const query = searchParams.toString();
    const url = query ? `/api/customers?${query}` : '/api/customers';

    return this.get<{
      success: boolean;
      data: {
        customers: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(url);
  }

  async getCustomerStats(params: { storeId?: string } = {}) {
    const searchParams = new URLSearchParams();
    if (params.storeId) searchParams.set('storeId', params.storeId);

    const query = searchParams.toString();
    const url = query ? `/api/customers/stats?${query}` : '/api/customers/stats';

    return this.get<{
      success: boolean;
      data: {
        total: number;
        withEmail: number;
        withPhone: number;
        acceptsMarketing: number;
        totalSpent: number;
        totalOrders: number;
      };
    }>(url);
  }

  // Admin customer management
  async adminGetCustomers(params: {
    storeIds?: string[];
    page?: number;
    limit?: number;
    search?: string;
    acceptsMarketing?: boolean;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.storeIds && params.storeIds.length > 0) {
      params.storeIds.forEach((id) => searchParams.append('storeIds', id));
    }
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.search) searchParams.set('search', params.search);
    if (params.acceptsMarketing) searchParams.set('acceptsMarketing', String(params.acceptsMarketing));

    const query = searchParams.toString();
    const url = query ? `/api/admin/customers?${query}` : '/api/admin/customers';

    return this.get<{
      success: boolean;
      data: {
        customers: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(url);
  }

  // ========== VIDEO MUTATOR API ==========

  async uploadVideoForMutation(file: File) {
    const formData = new FormData();
    formData.append('video', file);
    return this.post<{
      success: boolean;
      message: string;
      data: {
        jobId: string;
        originalFileName: string;
        status: string;
      };
    }>('/api/video-mutator/upload', formData);
  }

  async getVideoMutatorJobs(params: { page?: number; limit?: number } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const url = query ? `/api/video-mutator/jobs?${query}` : '/api/video-mutator/jobs';
    return this.get<{
      success: boolean;
      data: {
        jobs: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(url);
  }

  async getVideoMutatorJob(jobId: string) {
    return this.get<{
      success: boolean;
      data: any;
    }>(`/api/video-mutator/jobs/${jobId}`);
  }

  async getVideoMutatorStats() {
    return this.get<{
      success: boolean;
      data: {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        pendingJobs: number;
        processingJobs: number;
        totalOriginalSize: number;
        totalMutatedSize: number;
        avgProcessingTime: number;
      };
    }>('/api/video-mutator/stats');
  }

  async retryVideoMutatorJob(jobId: string) {
    return this.post<{
      success: boolean;
      message: string;
      data: {
        jobId: string;
        status: string;
      };
    }>(`/api/video-mutator/jobs/${jobId}/retry`);
  }

  async deleteVideoMutatorJob(jobId: string) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/api/video-mutator/jobs/${jobId}`);
  }

  // Admin video mutator
  async adminGetVideoMutatorJobs(params: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status) searchParams.set('status', params.status);
    if (params.userId) searchParams.set('userId', params.userId);
    const query = searchParams.toString();
    const url = query ? `/api/admin/video-mutator/jobs?${query}` : '/api/admin/video-mutator/jobs';
    return this.get<{
      success: boolean;
      data: {
        jobs: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      };
    }>(url);
  }

  async adminGetVideoMutatorStats() {
    return this.get<{
      success: boolean;
      data: {
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        pendingJobs: number;
        processingJobs: number;
        totalOriginalSize: number;
        totalMutatedSize: number;
        avgProcessingTime: number;
        uniqueUsers: number;
        recentJobs: any[];
      };
    }>('/api/admin/video-mutator/stats');
  }

  async adminDeleteVideoMutatorJob(jobId: string) {
    return this.delete<{
      success: boolean;
      message: string;
    }>(`/api/admin/video-mutator/jobs/${jobId}`);
  }

  // ========== TEMPLATES API ==========

  async getTemplates(category?: string) {
    const params = category ? `?category=${category}` : '';
    return this.get<{ success: boolean; data: any[] }>(`/api/templates${params}`);
  }

  async applyTemplate(templateId: string, storeId?: string) {
    return this.post<{ success: boolean; message: string; data: any }>(
      `/api/templates/${templateId}/apply`,
      { storeId }
    );
  }

  async getStoreThemes(storeId: string) {
    return this.get<{ success: boolean; data: any[] }>(`/api/templates/store-themes/${storeId}`);
  }

  async setDefaultTheme(storeId: string, themeId: number) {
    return this.post<{ success: boolean; message: string; data: any }>(
      '/api/templates/set-default-theme',
      { storeId, themeId }
    );
  }

  // ========== STORE DASHBOARD API ==========

  // Store management
  async createStore(data: { name: string; slug?: string; currency?: string }) {
    return this.post<{ success: boolean; data: any }>('/api/store-dashboard/stores', data);
  }

  async getMyStore() {
    return this.get<{ success: boolean; data: any | null }>('/api/store-dashboard/stores');
  }

  async getStore(storeId: string) {
    return this.get<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}`);
  }

  async updateStore(storeId: string, data: { name?: string; settings?: any }) {
    return this.put<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}`, data);
  }

  async getStoreOverview(storeId: string) {
    return this.get<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/overview`);
  }

  // Product management
  async createStoreProduct(storeId: string, data: any) {
    return this.post<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/products`, data);
  }

  async getStoreProducts(storeId: string, params?: { status?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const url = query ? `/api/store-dashboard/stores/${storeId}/products?${query}` : `/api/store-dashboard/stores/${storeId}/products`;
    return this.get<{ success: boolean; data: any }>(url);
  }

  async getStoreProduct(storeId: string, productId: string) {
    return this.get<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/products/${productId}`);
  }

  async updateStoreProduct(storeId: string, productId: string, data: any) {
    return this.put<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/products/${productId}`, data);
  }

  async deleteStoreProduct(storeId: string, productId: string) {
    return this.delete<{ success: boolean; message: string }>(`/api/store-dashboard/stores/${storeId}/products/${productId}`);
  }

  // Order management
  async getStoreOrders(storeId: string, params?: { paymentStatus?: string; fulfillmentStatus?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus);
    if (params?.fulfillmentStatus) searchParams.set('fulfillmentStatus', params.fulfillmentStatus);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const url = query ? `/api/store-dashboard/stores/${storeId}/orders?${query}` : `/api/store-dashboard/stores/${storeId}/orders`;
    return this.get<{ success: boolean; data: any }>(url);
  }

  async getStoreOrder(storeId: string, orderId: string) {
    return this.get<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/orders/${orderId}`);
  }

  async updateFulfillmentStatus(storeId: string, orderId: string, fulfillmentStatus: string) {
    return this.put<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/orders/${orderId}/fulfillment`, { fulfillmentStatus });
  }

  async searchStoreOrders(storeId: string, query: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    return this.get<{ success: boolean; data: { orders: any[]; pagination: any } }>(
      `/api/store-dashboard/stores/${storeId}/orders/search?${queryParams.toString()}`
    );
  }

  async exportStoreOrders(storeId: string, params?: { format?: string; paymentStatus?: string; fulfillmentStatus?: string; startDate?: string; endDate?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.format) queryParams.append('format', params.format);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.fulfillmentStatus) queryParams.append('fulfillmentStatus', params.fulfillmentStatus);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetch(`${this.baseURL}/api/store-dashboard/stores/${storeId}/orders/export?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
    }).then((res) => res.blob()).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    });
  }

  async bulkUpdateStoreOrders(storeId: string, data: { orderIds: string[]; fulfillmentStatus: string }) {
    return this.put<{ success: boolean; data: { updated: number; total: number } }>(
      `/api/store-dashboard/stores/${storeId}/orders/bulk-fulfillment`,
      data
    );
  }

  async addOrderNote(storeId: string, orderId: string, note: { text: string }) {
    return this.post<{ success: boolean; data: any }>(
      `/api/store-dashboard/stores/${storeId}/orders/${orderId}/notes`,
      note
    );
  }

  async getOrderNotes(storeId: string, orderId: string) {
    return this.get<{ success: boolean; data: any[] }>(
      `/api/store-dashboard/stores/${storeId}/orders/${orderId}/notes`
    );
  }

  async getStoreAnalytics(storeId: string, period: '7d' | '30d' | '90d' | 'all' = '30d') {
    return this.get<{
      success: boolean;
      data: {
        period: string;
        revenueOverTime: Array<{ date: string; revenue: number; orders: number }>;
        orderStatusBreakdown: Array<{ status: string; count: number }>;
        fulfillmentStatusBreakdown: Array<{ status: string; count: number }>;
        topProductsByRevenue: Array<{ productId: string; title: string; revenue: number; quantity: number }>;
        customerMetrics: { uniqueCustomers: number; repeatCustomers: number };
        summary: { totalRevenue: number; totalOrders: number; paidOrders: number; averageOrderValue: number };
      };
    }>(`/api/store-dashboard/stores/${storeId}/analytics?period=${period}`);
  }

  // Razorpay
  async initiateRazorpayConnect(storeId: string) {
    return this.post<{ success: boolean; data: { onboardingUrl: string; accountId?: string } }>(`/api/store-dashboard/stores/${storeId}/razorpay/connect`);
  }

  async getRazorpayStatus(storeId: string) {
    return this.get<{ success: boolean; data: any }>(`/api/store-dashboard/stores/${storeId}/razorpay/status`);
  }

  // Product catalog and import
  async browseCatalogProducts(storeId: string, params?: {
    niche?: string;
    search?: string;
    sort?: 'popularity' | 'newest' | 'price_low_to_high' | 'price_high_to_low';
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.niche) searchParams.set('niche', params.niche);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const url = query
      ? `/api/store-dashboard/stores/${storeId}/products/catalog?${query}`
      : `/api/store-dashboard/stores/${storeId}/products/catalog`;
    return this.get<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(url);
  }

  async getCatalogProductDetails(storeId: string, productId: string) {
    return this.get<{
      success: boolean;
      data: any & {
        isImported: boolean;
        canImport: boolean;
        importWarnings: string[];
      };
    }>(`/api/store-dashboard/stores/${storeId}/products/catalog/${productId}`);
  }

  async importProduct(storeId: string, data: {
    catalogProductId: string;
    basePrice?: number;
    status?: 'draft' | 'active';
    variantDimension?: string;
    variants?: Array<{
      name: string;
      price?: number;
      inventory?: number | null;
    }>;
  }) {
    return this.post<{ success: boolean; data: any; message: string }>(
      `/api/store-dashboard/stores/${storeId}/products/import`,
      data
    );
  }

  // ========== STOREFRONT API (Public) ==========

  async getStorefrontInfo(slug: string) {
    return this.get<{ success: boolean; data: any }>(`/api/storefront/${slug}`);
  }

  async getStorefrontProducts(slug: string, params?: { page?: number; limit?: number; search?: string; minPrice?: number; maxPrice?: number; variantDimension?: string; sort?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.search) searchParams.set('search', params.search);
    if (params?.minPrice) searchParams.set('minPrice', String(params.minPrice));
    if (params?.maxPrice) searchParams.set('maxPrice', String(params.maxPrice));
    if (params?.variantDimension) searchParams.set('variantDimension', params.variantDimension);
    if (params?.sort) searchParams.set('sort', params.sort);
    const query = searchParams.toString();
    const url = query ? `/api/storefront/${slug}/products?${query}` : `/api/storefront/${slug}/products`;
    return this.get<{ success: boolean; data: { products: any[]; pagination: any } }>(url);
  }

  async getStorefrontProduct(slug: string, productId: string) {
    return this.get<{ success: boolean; data: any }>(`/api/storefront/${slug}/products/${productId}`);
  }

  async createStorefrontOrder(slug: string, data: any) {
    return this.post<{ success: boolean; data: any }>(`/api/storefront/${slug}/orders`, data);
  }

  async createPaymentOrder(slug: string, orderId: string) {
    return this.post<{
      success: boolean;
      data: {
        razorpayOrderId: string;
        amount: number;
        currency: string;
        keyId: string;
        testMode?: boolean;
      };
    }>(`/api/storefront/${slug}/orders/${orderId}/payment`);
  }

  async verifyPayment(slug: string, orderId: string, data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    return this.post<{
      success: boolean;
      data: {
        orderId: string;
        paymentStatus: string;
        testMode?: boolean;
      };
    }>(`/api/storefront/${slug}/orders/${orderId}/verify`, data);
  }
}

export const api = new ApiClient();

