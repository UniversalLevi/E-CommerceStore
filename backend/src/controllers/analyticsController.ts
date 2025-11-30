import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { Payment } from '../models/Payment';
import { createError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

/**
 * Get user analytics
 * GET /api/analytics
 */
export const getUserAnalytics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const start = startDate ? new Date(startDate as string) : defaultStartDate;
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get user's stores
    const stores = await StoreConnection.find({ owner: userId }).lean();
    const storeIds = stores.map((s) => s._id);

    // Get user's products added over time
    const user = await User.findById(userId).lean();
    const userStores = user?.stores || [];
    
    // Group products by date
    const productsByDate = userStores.reduce((acc: any, store: any) => {
      const date = new Date(store.createdAt).toISOString().split('T')[0];
      if (date >= start.toISOString().split('T')[0] && date <= end.toISOString().split('T')[0]) {
        acc[date] = (acc[date] || 0) + 1;
      }
      return acc;
    }, {});

    // Convert to array format for chart
    const productsOverTime = Object.entries(productsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get store performance
    const storePerformance = stores.map((store) => {
      const storeUrl = `https://${store.shopDomain.replace('.myshopify.com', '')}.myshopify.com`;
      const productsInStore = userStores.filter(
        (s: any) => s.storeUrl === storeUrl
      ).length;
      return {
        storeName: store.storeName,
        shopDomain: store.shopDomain,
        status: store.status,
        productCount: productsInStore,
        lastTestedAt: store.lastTestedAt,
      };
    });

    // Get most popular niches (from user's products)
    const productIds = Array.from(
      new Set(userStores.map((s: any) => s.productId?.toString()).filter(Boolean))
    );
    
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('niche', 'name slug icon')
      .lean();

    const nicheCounts: Record<string, number> = {};
    products.forEach((product: any) => {
      if (product.niche) {
        const nicheName = typeof product.niche === 'object' ? product.niche.name : 'Unknown';
        nicheCounts[nicheName] = (nicheCounts[nicheName] || 0) + 1;
      }
    });

    const popularNiches = Object.entries(nicheCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get activity summary
    const activitySummary = await AuditLog.aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          successCount: {
            $sum: { $cond: ['$success', 1, 0] },
          },
        },
      },
    ]);

    // Get user revenue stats
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Total revenue (all time)
    const totalRevenueResult = await Payment.aggregate([
      {
        $match: {
          userId: userIdObj,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;
    const totalPayments = totalRevenueResult[0]?.count || 0;

    // Revenue in date range
    const revenueInRangeResult = await Payment.aggregate([
      {
        $match: {
          userId: userIdObj,
          status: 'paid',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const revenueInRange = revenueInRangeResult[0]?.total || 0;
    const paymentsInRange = revenueInRangeResult[0]?.count || 0;

    // Revenue over time (grouped by date)
    const revenueOverTime = await Payment.aggregate([
      {
        $match: {
          userId: userIdObj,
          status: 'paid',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Revenue by plan
    const revenueByPlanResult = await Payment.aggregate([
      {
        $match: {
          userId: userIdObj,
          status: 'paid',
        },
      },
      {
        $group: {
          _id: '$planCode',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        productsOverTime,
        storePerformance,
        popularNiches,
        activitySummary,
        summary: {
          totalProducts: userStores.length,
          totalStores: stores.length,
          activeStores: stores.filter((s) => s.status === 'active').length,
        },
        revenue: {
          totalRevenue,
          totalPayments,
          revenueInRange,
          paymentsInRange,
          revenueOverTime: revenueOverTime.map((item) => ({
            date: item._id,
            amount: item.amount,
            count: item.count,
          })),
          revenueByPlan: revenueByPlanResult.map((item) => ({
            planCode: item._id,
            amount: item.amount,
            count: item.count,
          })),
        },
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch analytics', 500));
  }
};

/**
 * Track product view
 * POST /api/analytics/product-view
 */
export const trackProductView = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { productId } = req.body;

    if (!productId) {
      throw createError('Product ID is required', 400);
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Increment view count
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.views': 1 },
    });

    res.status(200).json({
      success: true,
      message: 'Product view tracked',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Track product import
 * POST /api/analytics/product-import
 */
export const trackProductImport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { productId } = req.body;

    if (!productId) {
      throw createError('Product ID is required', 400);
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Increment import count
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.imports': 1 },
    });

    res.status(200).json({
      success: true,
      message: 'Product import tracked',
    });
  } catch (error: any) {
    next(error);
  }
};

