import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { createError } from '../middleware/errorHandler';
import { createStoreSchema, updateStoreSchema } from '../validators/storeDashboardValidator';
import { StoreProduct } from '../models/StoreProduct';
import { StoreOrder } from '../models/StoreOrder';

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
    });

    await store.save();

    res.status(201).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
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

    // Only allow updating name and settings (slug and currency are locked)
    if (value.name) {
      store.name = value.name;
    }
    if (value.settings) {
      store.settings = { ...store.settings, ...value.settings };
    }

    await store.save();

    res.status(200).json({
      success: true,
      data: store,
    });
  } catch (error: any) {
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
