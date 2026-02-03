import crypto from 'crypto';
import { config } from '../config/env';
import { plans, PlanCode } from '../config/plans';

// Use require for Razorpay as it's a CommonJS module
const Razorpay = require('razorpay');

class RazorpayService {
  private razorpay: any;

  constructor() {
    try {
      if (!config.razorpay.keyId || !config.razorpay.keySecret) {
        throw new Error('Razorpay credentials are missing in environment variables');
      }
      
      this.razorpay = new Razorpay({
        key_id: config.razorpay.keyId,
        key_secret: config.razorpay.keySecret,
      });
    } catch (error: any) {
      console.error('Failed to initialize Razorpay:', error.message);
      throw error;
    }
  }

  /**
   * Create a Razorpay order for UPI autopay token charge
   */
  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const options = {
        amount: amount, // amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        // Note: Payment method (UPI) is selected by user during checkout
        // The frontend checkout will restrict to UPI for autopay mandate
      };

      console.log('Creating Razorpay order for UPI autopay token charge:', { ...options, receipt: options.receipt });
      const order = await this.razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order.id);
      return order;
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message || error.error?.description || 'Unknown error'}`);
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpay.keySecret)
        .update(text)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify webhook signature
   * CRITICAL: Must use raw body buffer, not parsed JSON
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', config.razorpay.webhookSecret)
        .update(rawBody)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch order details from Razorpay
   */
  async getOrder(orderId: string) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);
      return order;
    } catch (error: any) {
      throw new Error(`Failed to fetch Razorpay order: ${error.message}`);
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async getPayment(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      throw new Error(`Failed to fetch Razorpay payment: ${error.message}`);
    }
  }

  /**
   * Cancel a Razorpay subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error: any) {
      throw new Error(`Failed to cancel Razorpay subscription: ${error.message || error.error?.description || 'Unknown error'}`);
    }
  }

  /**
   * Get Razorpay key ID for frontend
   */
  getKeyId(): string {
    return config.razorpay.keyId;
  }

  /**
   * Create a Razorpay plan (one-time setup)
   */
  async createPlan(params: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      amount: number; // in paise
      currency: string;
      description: string;
    };
  }) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const plan = await this.razorpay.plans.create(params);
      console.log('Razorpay plan created successfully:', plan.id);
      return plan;
    } catch (error: any) {
      console.error('Razorpay plan creation error:', error);
      throw new Error(`Failed to create Razorpay plan: ${error.message || error.error?.description || 'Unknown error'}`);
    }
  }

  /**
   * Create a Razorpay subscription with trial period (UPI autopay)
   */
  async createSubscription(params: {
    planId: string;
    startAt: number; // Unix timestamp when subscription should start (after trial)
    totalCount: number; // 1 for one-time, high number for recurring
    customerNotify?: number; // 1 to notify customer
    addons?: Array<{ item: { name: string; amount: number; currency: string } }>; // Upfront charges/addons
  }) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const subscriptionParams: any = {
        plan_id: params.planId,
        customer_notify: params.customerNotify ?? 1,
        total_count: params.totalCount,
        start_at: params.startAt,
        // For UPI autopay subscriptions:
        // - When start_at is in the future (trial period), Razorpay charges ₹5 by default for auth
        // - To override this and charge a specific amount (e.g., ₹20), use addons/upfront amount
        // - The addons amount will be charged during authentication instead of ₹5
        // - The subscription payment flow (without order_id) enables UPI autopay
      };
      
      // If addons are provided, include them for upfront charges
      if (params.addons && params.addons.length > 0) {
        subscriptionParams.addons = params.addons;
      }
      
      console.log('Creating Razorpay subscription with params:', {
        plan_id: params.planId,
        total_count: params.totalCount,
        start_at: params.startAt,
        start_at_date: new Date(params.startAt * 1000).toISOString(),
        has_addons: params.addons ? params.addons.length > 0 : false,
        addons_total: params.addons ? params.addons.reduce((sum, addon) => sum + addon.item.amount, 0) : 0,
      });
      
      const subscription = await this.razorpay.subscriptions.create(subscriptionParams);

      console.log('Razorpay subscription created successfully (UPI autopay):', subscription.id);
      return subscription;
    } catch (error: any) {
      console.error('Razorpay subscription creation error:', error);
      console.error('Error details:', {
        message: error.message,
        description: error.error?.description,
        field: error.error?.field,
        code: error.error?.code,
        statusCode: error.statusCode,
        planId: params.planId,
      });
      
      // Provide more specific error messages
      if (error.error?.description?.toLowerCase().includes('invalid key') || 
          error.error?.description?.toLowerCase().includes('authentication failed')) {
        throw new Error(`Invalid Razorpay API credentials. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file. Error: ${error.error?.description || error.message}`);
      }
      
      if (error.error?.description?.toLowerCase().includes('plan') || 
          error.error?.code === 'BAD_REQUEST_ERROR') {
        throw new Error(`Invalid Razorpay plan ID: ${params.planId}. Please run 'npm run create-razorpay-plans' to create the plans. Error: ${error.error?.description || error.message}`);
      }
      
      throw new Error(`Failed to create Razorpay subscription: ${error.error?.description || error.message || 'Unknown error'}`);
    }
  }

  /**
   * Fetch subscription details from Razorpay
   */
  async getSubscription(subscriptionId: string) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error: any) {
      throw new Error(`Failed to fetch Razorpay subscription: ${error.message || error.error?.description || 'Unknown error'}`);
    }
  }

  /**
   * Fetch plan details from Razorpay
   */
  async fetchPlan(planId: string) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const plan = await this.razorpay.plans.fetch(planId);
      return plan;
    } catch (error: any) {
      throw new Error(`Failed to fetch Razorpay plan: ${error.message || error.error?.description || 'Unknown error'}`);
    }
  }
}

export const razorpayService = new RazorpayService();

