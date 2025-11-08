import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { Product } from '../models/Product';
import mongoose from 'mongoose';
import { createError } from '../middleware/errorHandler';

// In-memory cache for dashboard stats
let statsCache: any = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Return cached data if available and fresh
    if (statsCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: statsCache,
      });
    }

    // Calculate stats
    const [
      totalUsers,
      activeUsers,
      totalStores,
      activeStores,
      invalidStores,
      revokedStores,
      totalProducts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      StoreConnection.countDocuments(),
      StoreConnection.countDocuments({ status: 'active' }),
      StoreConnection.countDocuments({ status: 'invalid' }),
      StoreConnection.countDocuments({ status: 'revoked' }),
      Product.countDocuments(),
    ]);

    // Get registration trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get store connection trends (last 30 days)
    const storeConnections = await StoreConnection.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Store status distribution
    const storeStatusDistribution = await StoreConnection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent activity (last 10 audit logs)
    const recentActivity = await AuditLog.find()
      .populate('userId', 'email')
      .populate('storeId', 'storeName')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      stores: {
        total: totalStores,
        active: activeStores,
        invalid: invalidStores,
        revoked: revokedStores,
      },
      products: {
        total: totalProducts,
      },
      trends: {
        registrations,
        storeConnections,
      },
      storeStatusDistribution,
      recentActivity: recentActivity.map((log) => ({
        id: log._id,
        timestamp: log.timestamp,
        userEmail: (log.userId as any)?.email || 'System',
        action: log.action,
        target: (log.storeId as any)?.storeName || 'N/A',
        success: log.success,
        details: log.details,
      })),
    };

    // Cache the results
    statsCache = stats;
    cacheTime = Date.now();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getSystemHealth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.command({ ping: 1 });
    const latency = Date.now() - startTime;

    const status =
      latency < 100 ? 'healthy' : latency < 300 ? 'degraded' : 'unhealthy';

    res.status(200).json({
      success: true,
      data: {
        status,
        dbLatency: latency,
        uptime: process.uptime(),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// User Management Functions
export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (role) {
      query.role = role;
    }
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get store counts for each user
    const userIds = users.map((u: any) => u._id);
    const storeCounts = await StoreConnection.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);

    const storeCountMap = new Map(
      storeCounts.map((s: any) => [s._id.toString(), s.count])
    );

    const usersWithStats = users.map((user: any) => ({
      ...user,
      storesCount: storeCountMap.get(user._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      throw createError('Invalid role. Must be "admin" or "user"', 400);
    }

    const user = await User.findById(id).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: 'User role unchanged',
      });
    }

    await User.findByIdAndUpdate(id, { role });

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'UPDATE_USER_ROLE',
      success: true,
      details: {
        targetUserId: id,
        targetEmail: user.email,
        oldRole: user.role,
        newRole: role,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    const newStatus = !user.isActive;
    await User.findByIdAndUpdate(id, { isActive: newStatus });

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: newStatus ? 'ENABLE_USER' : 'DISABLE_USER',
      success: true,
      details: {
        targetUserId: id,
        targetEmail: user.email,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `User ${newStatus ? 'enabled' : 'disabled'} successfully`,
      data: { isActive: newStatus },
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    // Prevent deleting yourself
    if ((req.user as any)._id.toString() === id) {
      throw createError('Cannot delete your own account', 400);
    }

    // Cascade delete: stores and audit logs
    await Promise.all([
      StoreConnection.deleteMany({ owner: id }),
      AuditLog.deleteMany({ userId: id }),
      User.findByIdAndDelete(id),
    ]);

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'DELETE_USER',
      success: true,
      details: {
        targetUserId: id,
        targetEmail: user.email,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Audit Log Functions
export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId = '',
      storeId = '',
      action = '',
      success = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (action) query.action = action;
    if (success === 'true') query.success = true;
    if (success === 'false') query.success = false;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    // Get audit logs with pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'email')
        .populate('storeId', 'storeName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs: logs.map((log: any) => ({
          id: log._id,
          timestamp: log.timestamp,
          userEmail: log.userId?.email || 'System',
          action: log.action,
          target: log.storeId?.storeName || 'N/A',
          success: log.success,
          errorMessage: log.errorMessage,
          details: log.details,
          ipAddress: log.ipAddress,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const exportAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      userId = '',
      storeId = '',
      action = '',
      success = '',
      startDate = '',
      endDate = '',
    } = req.query;

    // Build query (same as getAuditLogs)
    const query: any = {};
    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (action) query.action = action;
    if (success === 'true') query.success = true;
    if (success === 'false') query.success = false;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'email')
      .populate('storeId', 'storeName')
      .sort({ timestamp: -1 })
      .lean();

    // Generate CSV
    const headers = ['Timestamp', 'User Email', 'Action', 'Target', 'Success', 'Error Message', 'IP Address', 'Details'];
    const rows = logs.map((log: any) => [
      new Date(log.timestamp).toISOString(),
      log.userId?.email || 'System',
      log.action,
      log.storeId?.storeName || 'N/A',
      log.success ? 'Yes' : 'No',
      log.errorMessage || '',
      log.ipAddress || '',
      JSON.stringify(log.details || {}),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    next(error);
  }
};

