import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { createError } from '../middleware/errorHandler';
import { createStoreSchema, updateStoreSchema } from '../validators/storeDashboardValidator';
import { StoreProduct } from '../models/StoreProduct';
import { StoreOrder } from '../models/StoreOrder';
import * as themeService from '../services/storeThemeService';
import { logInternalStoreActivity, getInternalStoreLogContext } from '../services/internalStoreLogger';
import { hasStoreSubscription } from '../middleware/subscription';

/**
 * Create store (one per user)
 * POST /api/store-dashboard/stores
 */
export const createStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { error, value } = createStoreSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const userId = (req.user as any)._id;

    // Check if user has active store subscription (admins bypass)
    if (req.user.role !== 'admin') {
      const hasAccess = await hasStoreSubscription(req.user);
      if (!hasAccess) {
        throw createError('Store subscription required. Please upgrade to a store plan to create a store.', 403);
      }
    }

    // Check if user already has a store
    const existingStore = await Store.findOne({ owner: userId });
    if (existingStore) {
      throw createError('You already have a store. Only one store per user is allowed.', 400);
    }

    // Generate slug if not provided
    let slug = value.slug;
    if (!slug) {
      slug = value.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
    }

    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 1;
    while (await Store.findOne({ slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const store = new Store({
      owner: userId,
      name: value.name,
      slug: finalSlug,
      currency: value.currency || 'INR',
      status: 'active', // Activate store immediately
      razorpayAccountStatus: 'not_connected',
      settings: {
        testMode: false,
        theme: {
          name: 'modern',
          customizations: {},
        },
      },
    });

    await store.save();

    // Log store creation
    const logContext = getInternalStoreLogContext(req);
    const storeId = (store._id as any).toString();
    await logInternalStoreActivity({
      storeId: storeId,
      userId: userId.toString(),
      action: 'INTERNAL_STORE_CREATED',
      entityType: 'store',
      entityId: storeId,
      changes: {
        after: {
          name: store.name,
          slug: store.slug,
          currency: store.currency,
          status: store.status,
        },
      },
      success: true,
      ...logContext,
    });

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    // Log error if we have user context
    if (req.user) {
      const logContext = getInternalStoreLogContext(req);
      await logInternalStoreActivity({
        storeId: (req as any).store?._id || 'unknown',
        userId: (req.user as any)._id,
        action: 'INTERNAL_STORE_CREATED',
        entityType: 'store',
        success: false,
        errorMessage: error.message,
        ...logContext,
      });
    }
    next(error);
  }
};

/**
 * Get user's store
 * GET /api/store-dashboard/stores
 */
export const getMyStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const store = await Store.findOne({ owner: userId });

    if (!store) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get store details
 * GET /api/store-dashboard/stores/:id
 */
export const getStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update store
 * PUT /api/store-dashboard/stores/:id
 */
export const updateStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateStoreSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const userId = (req.user as any)?._id;
    const beforeState = {
      name: store.name,
      settings: JSON.parse(JSON.stringify(store.settings || {})),
    };

    // Only allow updating name and settings (slug and currency are locked)
    if (value.name) {
      store.name = value.name;
    }
    if (value.settings) {
      store.settings = { ...store.settings, ...value.settings };
      // Mark settings as modified to ensure it's saved (required for Mixed type)
      store.markModified('settings');
    }

    await store.save();

    // Log store update
    if (userId) {
      const logContext = getInternalStoreLogContext(req);
      await logInternalStoreActivity({
        storeId: store._id.toString(),
        userId: userId.toString(),
        action: 'INTERNAL_STORE_UPDATED',
        entityType: 'settings',
        entityId: store._id.toString(),
        changes: {
          before: beforeState,
          after: {
            name: store.name,
            settings: store.settings,
          },
        },
        success: true,
        ...logContext,
      });
    }

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    // Log error
    if (req.user && (req as any).store) {
      const logContext = getInternalStoreLogContext(req);
      await logInternalStoreActivity({
        storeId: (req as any).store._id,
        userId: (req.user as any)._id,
        action: 'INTERNAL_STORE_UPDATED',
        entityType: 'settings',
        success: false,
        errorMessage: error.message,
        ...logContext,
      });
    }
    next(error);
  }
};

/**
 * Get store overview stats
 * GET /api/store-dashboard/stores/:id/overview
 */
export const getStoreOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;

    // Get product counts
    const totalProducts = await StoreProduct.countDocuments({ storeId });
    const activeProducts = await StoreProduct.countDocuments({ storeId, status: 'active' });

    // Get order stats
    const totalOrders = await StoreOrder.countDocuments({ storeId });
    const paidOrders = await StoreOrder.countDocuments({ storeId, paymentStatus: 'paid' });

    // Calculate total revenue (sum of paid orders)
    const revenueResult = await StoreOrder.aggregate([
      { $match: { storeId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        store,
        stats: {
          totalProducts,
          activeProducts,
          totalOrders,
          paidOrders,
          totalRevenue, // in paise
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get store analytics
 * GET /api/store-dashboard/stores/:id/analytics?period=7d|30d|90d|all
 */
export const getStoreAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const { period = '30d' } = req.query;

    // Calculate date range based on period
    let startDate: Date | null = null;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = null;
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const dateFilter: any = startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};

    // Revenue over time (daily breakdown)
    const revenueOverTime = await StoreOrder.aggregate([
      { $match: { storeId, paymentStatus: 'paid', ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          revenue: 1,
          orders: 1,
          _id: 0,
        },
      },
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await StoreOrder.aggregate([
      { $match: { storeId, ...dateFilter } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Fulfillment status breakdown
    const fulfillmentStatusBreakdown = await StoreOrder.aggregate([
      { $match: { storeId, ...dateFilter } },
      {
        $group: {
          _id: '$fulfillmentStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // Top products by revenue
    const topProductsByRevenue = await StoreOrder.aggregate([
      { $match: { storeId, paymentStatus: 'paid', ...dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          title: { $first: '$items.title' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          productId: '$_id',
          title: 1,
          revenue: 1,
          quantity: 1,
          _id: 0,
        },
      },
    ]);

    // Customer metrics
    const uniqueCustomers = await StoreOrder.distinct('customer.email', {
      storeId,
      ...dateFilter,
    });
    const repeatCustomers = await StoreOrder.aggregate([
      { $match: { storeId, ...dateFilter } },
      {
        $group: {
          _id: '$customer.email',
          orderCount: { $sum: 1 },
        },
      },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: 'count' },
    ]);

    // Calculate totals
    const totalRevenueResult = await StoreOrder.aggregate([
      { $match: { storeId, paymentStatus: 'paid', ...dateFilter } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const totalOrders = await StoreOrder.countDocuments({ storeId, ...dateFilter });
    const paidOrders = await StoreOrder.countDocuments({
      storeId,
      paymentStatus: 'paid',
      ...dateFilter,
    });

    const averageOrderValue = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        revenueOverTime,
        orderStatusBreakdown: orderStatusBreakdown.map((s) => ({
          status: s._id,
          count: s.count,
        })),
        fulfillmentStatusBreakdown: fulfillmentStatusBreakdown.map((s) => ({
          status: s._id,
          count: s.count,
        })),
        topProductsByRevenue,
        customerMetrics: {
          uniqueCustomers: uniqueCustomers.length,
          repeatCustomers: repeatCustomers.length > 0 ? repeatCustomers[0].count : 0,
        },
        summary: {
          totalRevenue,
          totalOrders,
          paidOrders,
          averageOrderValue,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Disable store (admin or owner)
 * POST /api/store-dashboard/stores/:id/disable
 */
export const disableStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const user = req.user as any;

    // Only admin or owner can disable
    if (user.role !== 'admin' && store.owner.toString() !== user._id.toString()) {
      throw createError('Permission denied', 403);
    }

    store.status = 'suspended';
    await store.save();

    res.status(200).json({
      success: true,
      message: 'Store disabled successfully',
      data: store,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get store theme
 * GET /api/store-dashboard/stores/:id/theme
 */
export const getStoreTheme = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const theme = store.settings?.theme || null;

    res.status(200).json({
      success: true,
      data: theme,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update store theme
 * PUT /api/store-dashboard/stores/:id/theme
 */
export const updateStoreTheme = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const { name, customizations } = req.body;

    if (!name || typeof name !== 'string') {
      throw createError('Theme name is required', 400);
    }

    // Validate theme exists (async for template support)
    const themeConfig = await themeService.getThemeConfig(name);
    if (!themeConfig) {
      throw createError(`Theme "${name}" does not exist`, 400);
    }

    // Validate customizations if provided
    if (customizations) {
      const validation = await themeService.validateThemeCustomization(name, customizations);
      if (!validation.valid) {
        throw createError(`Invalid theme customizations: ${validation.errors.join(', ')}`, 400);
      }
    }

    // Save theme - only save user customizations, defaults are in theme config
    const themeData = {
      name: name,
      customizations: customizations || {},
    };

    // Update store settings
    if (!store.settings) {
      store.settings = {};
    }
    store.settings.theme = themeData;

    // Mark settings as modified to ensure it's saved (required for Mixed type)
    store.markModified('settings');
    
    const beforeTheme = store.settings?.theme ? JSON.parse(JSON.stringify(store.settings.theme)) : null;
    
    try {
      await store.save();
    } catch (saveError: any) {
      console.error('Error saving theme to store:', saveError);
      throw createError(`Failed to save theme: ${saveError.message}`, 500);
    }

    // Log theme update
    const userId = (req.user as any)?._id;
    if (userId) {
      const logContext = getInternalStoreLogContext(req);
      await logInternalStoreActivity({
        storeId: store._id.toString(),
        userId: userId.toString(),
        action: 'INTERNAL_STORE_THEME_CHANGED',
        entityType: 'theme',
        entityId: store._id.toString(),
        changes: {
          before: beforeTheme ? { theme: beforeTheme } : undefined,
          after: { theme: themeData },
        },
        success: true,
        metadata: {
          themeName: name,
        },
        ...logContext,
      });
    }

    res.status(200).json({
      success: true,
      data: themeData,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get all available themes
 * GET /api/store-dashboard/themes
 */
export const getAvailableThemes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const themes = await themeService.getAvailableThemes();

    res.status(200).json({
      success: true,
      data: themes,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get theme details
 * GET /api/store-dashboard/themes/:name
 */
export const getThemeDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;
    const theme = await themeService.getThemeConfig(name);

    if (!theme) {
      throw createError(`Theme "${name}" does not exist`, 404);
    }

    res.status(200).json({
      success: true,
      data: theme,
    });
  } catch (error: any) {
    next(error);
  }
};
