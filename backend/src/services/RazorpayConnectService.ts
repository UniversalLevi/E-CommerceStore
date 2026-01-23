import crypto from 'crypto';
import { config } from '../config/env';
import { RazorpayAccount } from '../models/RazorpayAccount';
import { Store } from '../models/Store';

// Use require for Razorpay as it's a CommonJS module
const Razorpay = require('razorpay');

class RazorpayConnectService {
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
      console.error('Failed to initialize Razorpay Connect:', error.message);
      throw error;
    }
  }

  /**
   * Create onboarding link for Razorpay Connect
   * Note: This requires Razorpay Connect to be enabled in your Razorpay dashboard
   */
  async createOnboardingLink(params: {
    email: string;
    phone: string;
    legalBusinessName: string;
    businessType: string;
    redirectUrl: string;
  }): Promise<{ onboardingUrl: string; accountId?: string }> {
    try {
      // For MVP, we'll use a simplified approach
      // In production, you'd use Razorpay Connect API to create onboarding links
      // This is a placeholder - actual implementation depends on Razorpay Connect setup

      // For now, return a mock onboarding URL
      // TODO: Replace with actual Razorpay Connect API call when Connect is enabled
      const onboardingUrl = `https://dashboard.razorpay.com/app/connect/onboarding?email=${encodeURIComponent(
        params.email
      )}&redirect=${encodeURIComponent(params.redirectUrl)}`;

      return {
        onboardingUrl,
      };
    } catch (error: any) {
      console.error('Razorpay Connect onboarding error:', error);
      throw new Error(
        `Failed to create onboarding link: ${error.message || error.error?.description || 'Unknown error'}`
      );
    }
  }

  /**
   * Create Razorpay order with seller account (for direct-to-seller payments)
   */
  async createOrderForSeller(params: {
    amount: number; // in paise
    currency: string;
    receipt: string;
    accountId: string; // Seller's Razorpay account ID
  }) {
    try {
      if (!this.razorpay) {
        throw new Error('Razorpay client not initialized');
      }

      const options: any = {
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        // For Razorpay Connect, include account_id to route payment to seller
        // Note: This requires Razorpay Connect to be enabled
        // account_id: params.accountId, // Uncomment when Connect is enabled
      };

      console.log('Creating Razorpay order for seller:', {
        amount: params.amount,
        currency: params.currency,
        receipt: params.receipt,
        accountId: params.accountId,
      });

      const order = await this.razorpay.orders.create(options);
      console.log('Razorpay order created successfully:', order.id);
      return order;
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      throw new Error(
        `Failed to create Razorpay order: ${error.message || error.error?.description || 'Unknown error'}`
      );
    }
  }

  /**
   * Verify webhook signature for Razorpay Connect
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
   * Handle account status update from webhook
   */
  async handleAccountStatusUpdate(accountData: {
    account_id: string;
    status: string;
    email?: string;
  }) {
    try {
      const account = await RazorpayAccount.findOne({
        razorpayAccountId: accountData.account_id,
      });

      if (!account) {
        console.warn(`Razorpay account not found: ${accountData.account_id}`);
        return;
      }

      // Update account status
      account.status = accountData.status as any;
      if (accountData.email) {
        account.email = accountData.email;
      }
      await account.save();

      // Update store Razorpay account status
      const store = await Store.findById(account.storeId);
      if (store) {
        store.razorpayAccountStatus = accountData.status as any;
        // Store remains active regardless of payment status
        await store.save();
      }

      console.log(`Updated Razorpay account status: ${accountData.account_id} -> ${accountData.status}`);
    } catch (error: any) {
      console.error('Error handling account status update:', error);
      throw error;
    }
  }

  /**
   * Get Razorpay key ID for frontend
   */
  getKeyId(): string {
    return config.razorpay.keyId;
  }
}

export const razorpayConnectService = new RazorpayConnectService();
