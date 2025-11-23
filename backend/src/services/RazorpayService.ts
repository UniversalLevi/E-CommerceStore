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
   * Create a Razorpay order
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
      };

      console.log('Creating Razorpay order with options:', { ...options, receipt: options.receipt });
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
   * Get Razorpay key ID for frontend
   */
  getKeyId(): string {
    return config.razorpay.keyId;
  }
}

export const razorpayService = new RazorpayService();

