import { AuditLog } from '../models/AuditLog';
import { Request } from 'express';

export class AuditLogService {
  /**
   * Log a store-related action
   * @param options - Audit log options
   */
  static async log(options: {
    storeId?: string;
    userId: string;
    action: 'connected' | 'disconnected' | 'accessed' | 'refreshed' | 'auth_failed' | 'token_expired' | 'token_expiring_soon' | 'reconnected' | 'revoked' | 'webhook_received' | 'webhook_failed';
    metadata?: Record<string, any>;
    req?: Request;
  }): Promise<void> {
    try {
      await AuditLog.create({
        storeId: options.storeId,
        userId: options.userId,
        action: options.action,
        timestamp: new Date(),
        metadata: options.metadata || {},
        ipAddress: options.req?.ip || options.req?.headers['x-forwarded-for'] as string,
        userAgent: options.req?.headers['user-agent'],
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break main flow
    }
  }

  /**
   * Get audit logs for a user
   * @param userId - The user ID
   * @param limit - Number of logs to return
   */
  static async getUserLogs(userId: string, limit = 50) {
    try {
      return await AuditLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('storeId', 'storeName storeDomain platform')
        .lean();
    } catch (error) {
      console.error('Error getting user logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a store
   * @param storeId - The connected store ID
   * @param limit - Number of logs to return
   */
  static async getStoreLogs(storeId: string, limit = 50) {
    try {
      return await AuditLog.find({ storeId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'email')
        .lean();
    } catch (error) {
      console.error('Error getting store logs:', error);
      return [];
    }
  }

  /**
   * Get failed authentication attempts in last 24 hours
   * @param limit - Number of logs to return
   */
  static async getFailedAuthAttempts(limit = 100) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      return await AuditLog.find({
        action: 'auth_failed',
        timestamp: { $gte: oneDayAgo },
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('userId', 'email')
        .lean();
    } catch (error) {
      console.error('Error getting failed auth attempts:', error);
      return [];
    }
  }

  /**
   * Get count of actions by type in a time period
   * @param hours - Number of hours to look back
   */
  static async getActionCounts(hours = 24) {
    try {
      const lookbackTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const counts = await AuditLog.aggregate([
        {
          $match: {
            timestamp: { $gte: lookbackTime },
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);
      
      return counts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Error getting action counts:', error);
      return {};
    }
  }
}

