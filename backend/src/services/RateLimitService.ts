import { ApiUsage } from '../models/ApiUsage';
import { ConnectedStore } from '../models/ConnectedStore';

export class RateLimitService {
  /**
   * Check if store is within rate limits and record API call
   * Shopify typically allows ~40 calls per second (2400/min)
   * @param storeId - The connected store ID
   * @returns true if request is allowed, false if rate limited
   */
  static async checkLimit(storeId: string): Promise<boolean> {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      
      // Count recent API calls for this store
      const recentCalls = await ApiUsage.countDocuments({
        storeId,
        timestamp: { $gte: oneMinuteAgo },
      });
      
      // Conservative limit: 2000 calls per minute (leaves buffer for Shopify's limit)
      const RATE_LIMIT_PER_MINUTE = 2000;
      
      if (recentCalls >= RATE_LIMIT_PER_MINUTE) {
        console.warn(`Rate limit exceeded for store ${storeId}: ${recentCalls} calls in last minute`);
        return false;
      }
      
      // Record this API call
      await ApiUsage.create({
        storeId,
        timestamp: now,
        callCount: 1,
        resetAt: new Date(now.getTime() + 60 * 1000),
      });
      
      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return true;
    }
  }

  /**
   * Update rate limit metadata from Shopify API response headers
   * Shopify returns X-Shopify-Shop-Api-Call-Limit header (e.g., "32/40")
   * @param storeId - The connected store ID
   * @param headers - Response headers from Shopify API
   */
  static async updateFromHeaders(storeId: string, headers: any): Promise<void> {
    try {
      const limitHeader = headers['x-shopify-shop-api-call-limit'];
      
      if (!limitHeader) {
        return;
      }
      
      // Parse "32/40" format
      const parts = limitHeader.split('/');
      if (parts.length !== 2) {
        return;
      }
      
      const used = parseInt(parts[0], 10);
      const max = parseInt(parts[1], 10);
      
      if (isNaN(used) || isNaN(max)) {
        return;
      }
      
      // Update store's rate limit metadata
      await ConnectedStore.updateOne(
        { _id: storeId },
        {
          'rateLimitMeta.callsUsed': used,
          'rateLimitMeta.callsMax': max,
          'rateLimitMeta.resetAt': new Date(Date.now() + 60 * 1000),
        }
      );
      
      // Log warning if approaching limit
      if (used >= max * 0.9) {
        console.warn(`Store ${storeId} approaching rate limit: ${used}/${max}`);
      }
    } catch (error) {
      console.error('Error updating rate limit from headers:', error);
    }
  }

  /**
   * Get current rate limit status for a store
   * @param storeId - The connected store ID
   */
  static async getStatus(storeId: string): Promise<{
    callsUsed: number;
    callsMax: number;
    percentageUsed: number;
    resetAt: Date;
  }> {
    try {
      const store = await ConnectedStore.findById(storeId);
      
      if (!store || !store.rateLimitMeta) {
        return {
          callsUsed: 0,
          callsMax: 40,
          percentageUsed: 0,
          resetAt: new Date(Date.now() + 60 * 1000),
        };
      }
      
      const callsUsed = store.rateLimitMeta.callsUsed || 0;
      const callsMax = store.rateLimitMeta.callsMax || 40;
      const percentageUsed = (callsUsed / callsMax) * 100;
      
      return {
        callsUsed,
        callsMax,
        percentageUsed,
        resetAt: store.rateLimitMeta.resetAt || new Date(Date.now() + 60 * 1000),
      };
    } catch (error) {
      console.error('Error getting rate limit status:', error);
      throw error;
    }
  }

  /**
   * Cleanup old API usage records (run daily via cron)
   * TTL index should handle this automatically, but this is a backup
   */
  static async cleanup(): Promise<number> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const result = await ApiUsage.deleteMany({
        timestamp: { $lt: oneDayAgo },
      });
      
      console.log(`Cleaned up ${result.deletedCount} old API usage records`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up API usage records:', error);
      return 0;
    }
  }

  /**
   * Get API usage statistics for a store
   * @param storeId - The connected store ID
   * @param minutes - Number of minutes to look back (default: 60)
   */
  static async getUsageStats(storeId: string, minutes = 60): Promise<{
    totalCalls: number;
    period: string;
    callsPerMinute: number;
  }> {
    try {
      const now = new Date();
      const lookbackTime = new Date(now.getTime() - minutes * 60 * 1000);
      
      const totalCalls = await ApiUsage.countDocuments({
        storeId,
        timestamp: { $gte: lookbackTime },
      });
      
      const callsPerMinute = totalCalls / minutes;
      
      return {
        totalCalls,
        period: `${minutes} minutes`,
        callsPerMinute: Math.round(callsPerMinute * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw error;
    }
  }
}

