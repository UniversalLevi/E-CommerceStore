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
   * Note: Razorpay Connect requires special setup. For MVP, we provide manual instructions.
   */
  async createOnboardingLink(params: {
    email: string;
    phone: string;
    legalBusinessName: string;
    businessType: string;
    redirectUrl: string;
  }): Promise<{ onboardingUrl: string; accountId?: string }> {
    try {
      // Razorpay Connect requires special approval and setup
      // For MVP, redirect to Razorpay dashboard where user can:
      // 1. Enable Razorpay Connect in their dashboard
      // 2. Complete onboarding manually
      // 3. Then enter their account ID in our system
      
      // Direct to Razorpay Connect setup page
      const onboardingUrl = `https://dashboard.razorpay.com/app/connect/accounts`;
      
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
   * Verify and fetch account details from Razorpay
   */
  async verifyAccount(accountId: string): Promise<{ id: string; status: string; email?: string } | null> {
    try {
      // Try to fetch account details using Razorpay API
      // Note: This requires Razorpay Connect to be enabled
      if (this.razorpay && this.razorpay.accounts) {
        const account = await this.razorpay.accounts.fetch(accountId);
        return {
          id: account.id,
          status: account.status || 'active',
          email: account.email,
        };
      }
      // If accounts API is not available, return null (will be handled by caller)
      return null;
    } catch (error: any) {
      // Log the error but don't throw - let caller decide what to do
      console.warn('Could not verify Razorpay account:', error.message || error);
      // Return null if verification fails (account might still be valid)
      return null;
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
