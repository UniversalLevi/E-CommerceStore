import { Request } from 'express';
import { InternalStoreLog, IInternalStoreLog } from '../models/InternalStoreLog';
import mongoose from 'mongoose';

export interface LogOptions {
  storeId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string;
  action: string;
  entityType: 'product' | 'order' | 'theme' | 'settings' | 'store' | 'other';
  entityId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log internal store activity
 * This is non-blocking and won't throw errors to avoid impacting the main request
 */
export async function logInternalStoreActivity(options: LogOptions): Promise<void> {
  try {
    await InternalStoreLog.create({
      storeId: typeof options.storeId === 'string' ? new mongoose.Types.ObjectId(options.storeId) : options.storeId,
      userId: typeof options.userId === 'string' ? new mongoose.Types.ObjectId(options.userId) : options.userId,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      changes: options.changes,
      success: options.success !== false,
      errorMessage: options.errorMessage,
      metadata: options.metadata || {},
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to create internal store log:', error);
  }
}

/**
 * Extract audit context from Express request
 */
export function getInternalStoreLogContext(req: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: req.ip || req.socket.remoteAddress || undefined,
    userAgent: req.get('user-agent') || undefined,
  };
}

/**
 * Get logs for a specific store
 */
export async function getStoreLogs(
  storeId: string | mongoose.Types.ObjectId,
  options?: {
    limit?: number;
    skip?: number;
    action?: string;
    entityType?: string;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<IInternalStoreLog[]> {
  const query: any = {
    storeId: typeof storeId === 'string' ? new mongoose.Types.ObjectId(storeId) : storeId,
  };

  if (options?.action) {
    query.action = options.action;
  }

  if (options?.entityType) {
    query.entityType = options.entityType;
  }

  if (options?.success !== undefined) {
    query.success = options.success;
  }

  if (options?.startDate || options?.endDate) {
    query.timestamp = {};
    if (options.startDate) {
      query.timestamp.$gte = options.startDate;
    }
    if (options.endDate) {
      query.timestamp.$lte = options.endDate;
    }
  }

  const logs = await InternalStoreLog.find(query)
    .sort({ timestamp: -1 })
    .limit(options?.limit || 100)
    .skip(options?.skip || 0)
    .populate('userId', 'name email')
    .lean();

  return logs as unknown as IInternalStoreLog[];
}

/**
 * Get log statistics for a store
 */
export async function getStoreLogStats(storeId: string | mongoose.Types.ObjectId): Promise<{
  total: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  successRate: number;
  recentErrors: number;
}> {
  const storeIdObj = typeof storeId === 'string' ? new mongoose.Types.ObjectId(storeId) : storeId;

  const [total, byAction, byEntityType, successCount, recentErrors] = await Promise.all([
    InternalStoreLog.countDocuments({ storeId: storeIdObj }),
    InternalStoreLog.aggregate([
      { $match: { storeId: storeIdObj } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
    ]),
    InternalStoreLog.aggregate([
      { $match: { storeId: storeIdObj } },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
    ]),
    InternalStoreLog.countDocuments({ storeId: storeIdObj, success: true }),
    InternalStoreLog.countDocuments({
      storeId: storeIdObj,
      success: false,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    }),
  ]);

  const byActionMap: Record<string, number> = {};
  byAction.forEach((item: any) => {
    byActionMap[item._id] = item.count;
  });

  const byEntityTypeMap: Record<string, number> = {};
  byEntityType.forEach((item: any) => {
    byEntityTypeMap[item._id] = item.count;
  });

  return {
    total,
    byAction: byActionMap,
    byEntityType: byEntityTypeMap,
    successRate: total > 0 ? (successCount / total) * 100 : 100,
    recentErrors,
  };
}
