import axios from 'axios';
import { ConnectedStore } from '../models/ConnectedStore';
import { CredentialService } from './CredentialService';
import { AuditLogService } from './AuditLogService';
import { config } from '../config/env';

export class TokenRefreshService {
  /**
   * Get valid token for a store, refreshing if needed (lazy refresh)
   * @param storeId - The connected store ID
   * @param userId - The user ID for validation
   */
  static async getValidToken(storeId: string, userId: string): Promise<string> {
    const store = await ConnectedStore.findOne({ _id: storeId, userId });

    if (!store) {
      throw new Error('Store not found or access denied');
    }

    // Check if token is expired
    if (store.tokenExpiresAt && store.tokenExpiresAt < new Date()) {
      console.log(`Token expired for store ${storeId}, attempting refresh...`);

      try {
        // For Shopify, tokens don't expire but we'll implement refresh logic
        // In case of OAuth refresh token flow
        const newToken = await this.refreshShopifyToken(store);
        
        // Encrypt new token
        const encrypted = CredentialService.encrypt(newToken);

        // Update store
        await ConnectedStore.updateOne(
          { _id: storeId },
          {
            encryptedCredentials: encrypted,
            tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            status: 'connected',
            lastActivityAt: new Date(),
          }
        );

        // Log successful refresh
        await AuditLogService.log({
          storeId: storeId,
          userId,
          action: 'refreshed',
          metadata: { success: true },
        });

        return newToken;
      } catch (error: any) {
        console.error(`Failed to refresh token for store ${storeId}:`, error.message);

        // Mark store as expired
        await ConnectedStore.updateOne(
          { _id: storeId },
          { status: 'expired' }
        );

        // Log failed refresh
        await AuditLogService.log({
          storeId: storeId,
          userId,
          action: 'token_expired',
          metadata: { error: error.message },
        });

        throw new Error('Token expired. Please reconnect your store.');
      }
    }

    // Token is valid, decrypt and return
    return CredentialService.decrypt(store.encryptedCredentials);
  }

  /**
   * Refresh Shopify access token
   * Note: Shopify OAuth tokens don't expire, but this is here for completeness
   * @param store - The connected store
   */
  private static async refreshShopifyToken(store: any): Promise<string> {
    // Shopify's offline access tokens don't expire
    // If they did, we would use refresh_token here
    
    // For now, just validate the existing token works
    const currentToken = CredentialService.decrypt(store.encryptedCredentials);
    
    try {
      // Test token by making a simple API call
      const response = await axios.get(
        `https://${store.storeDomain}/admin/api/2024-01/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': currentToken,
          },
        }
      );

      if (response.status === 200) {
        // Token is still valid
        return currentToken;
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Token is invalid or revoked');
      }
    }

    throw new Error('Unable to refresh token');
  }

  /**
   * Validate that a store's credentials are still working
   * @param storeId - The connected store ID
   */
  static async validateToken(storeId: string): Promise<boolean> {
    try {
      const store = await ConnectedStore.findById(storeId);
      if (!store) return false;

      const token = CredentialService.decrypt(store.encryptedCredentials);

      // Test token with Shopify API
      const response = await axios.get(
        `https://${store.storeDomain}/admin/api/2024-01/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': token,
          },
        }
      );

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

