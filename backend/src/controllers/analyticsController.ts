import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { StoreOrder } from '../models/StoreOrder';
import { AuditLog } from '../models/AuditLog';
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

    // Get user's stores (internal stores)
    const stores = await Store.find({ owner: userId }).lean();
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
    const { StoreProduct } = await import('../models/StoreProduct');
    const storePerformance = await Promise.all(stores.map(async (store) => {
      const productCount = await StoreProduct.countDocuments({ storeId: store._id });
      return {
        storeName: store.name,
        slug: store.slug,
        status: store.status,
        productCount,
      };
    }));

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

    // Get user revenue stats from internal stores
    const activeStores = stores.filter((s) => s.status === 'active');
    let totalRevenue = 0;
    let totalOrders = 0;
    let revenueInRange = 0;
    let ordersInRange = 0;
    const revenueOverTimeMap: Record<string, { amount: number; count: number }> = {};
    const revenueByStoreMap: Record<string, { amount: number; count: number }> = {};
    
    // Order status tracking
    const financialStatusMap: Record<string, number> = {};
    const fulfillmentStatusMap: Record<string, number> = {};
    const financialStatusInRangeMap: Record<string, number> = {};
    const fulfillmentStatusInRangeMap: Record<string, number> = {};

    // Fetch orders from all active stores
    for (const store of activeStores) {
      try {
        // Fetch all orders from internal store
        const allOrders = await StoreOrder.find({ storeId: store._id }).lean();

        // Process all orders
        allOrders.forEach((order: any) => {
          const orderDate = new Date(order.createdAt);
          const isInRange = orderDate >= start && orderDate <= end;
          
          // Track payment status (all orders)
          const paymentStatus = order.paymentStatus || 'pending';
          financialStatusMap[paymentStatus] = (financialStatusMap[paymentStatus] || 0) + 1;
          
          // Track fulfillment status (all orders)
          const fulfillmentStatus = order.fulfillmentStatus || 'pending';
          fulfillmentStatusMap[fulfillmentStatus] = (fulfillmentStatusMap[fulfillmentStatus] || 0) + 1;
          
          // Track status in date range
          if (isInRange) {
            financialStatusInRangeMap[paymentStatus] = (financialStatusInRangeMap[paymentStatus] || 0) + 1;
            fulfillmentStatusInRangeMap[fulfillmentStatus] = (fulfillmentStatusInRangeMap[fulfillmentStatus] || 0) + 1;
          }

          // Only count paid orders for revenue (orders are already in paise)
          if (order.paymentStatus === 'paid') {
            const amount = order.total || 0;
            
            // Add to total revenue (all time)
            totalRevenue += amount;
            totalOrders += 1;

            // Group by store
            if (!revenueByStoreMap[store.name]) {
              revenueByStoreMap[store.name] = { amount: 0, count: 0 };
            }
            revenueByStoreMap[store.name].amount += amount;
            revenueByStoreMap[store.name].count += 1;

            // Check if order is in date range
            if (isInRange) {
              revenueInRange += amount;
              ordersInRange += 1;

              // Group by date for revenue over time
              const orderDateStr = orderDate.toISOString().split('T')[0];
              if (!revenueOverTimeMap[orderDateStr]) {
                revenueOverTimeMap[orderDateStr] = { amount: 0, count: 0 };
              }
              revenueOverTimeMap[orderDateStr].amount += amount;
              revenueOverTimeMap[orderDateStr].count += 1;
            }
          }
        });
      } catch (error: any) {
        console.error(`Error fetching orders from store ${store.name}:`, error.message);
        // Continue with other stores even if one fails
      }
    }

    // Convert revenue over time map to array
    const revenueOverTime = Object.entries(revenueOverTimeMap)
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Convert revenue by store map to array
    const revenueByStore = Object.entries(revenueByStoreMap)
      .map(([storeName, data]) => ({
        storeName,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

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
          totalOrders,
          revenueInRange,
          ordersInRange,
          revenueOverTime,
          revenueByStore,
          financialStatus: Object.entries(financialStatusMap).map(([status, count]) => ({
            status,
            count,
          })),
          fulfillmentStatus: Object.entries(fulfillmentStatusMap).map(([status, count]) => ({
            status,
            count,
          })),
          financialStatusInRange: Object.entries(financialStatusInRangeMap).map(([status, count]) => ({
            status,
            count,
          })),
          fulfillmentStatusInRange: Object.entries(fulfillmentStatusInRangeMap).map(([status, count]) => ({
            status,
            count,
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

