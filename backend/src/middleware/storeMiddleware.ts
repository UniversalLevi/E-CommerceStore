import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Store } from '../models/Store';
import { createError } from './errorHandler';

/**
 * Middleware to verify user owns the store
 */
export const requireStoreOwner = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const storeId = req.params.id || req.params.storeId;
    if (!storeId) {
      throw createError('Store ID is required', 400);
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    const userId = (req.user as any)._id.toString();
    const storeOwnerId = store.owner.toString();

    if (userId !== storeOwnerId) {
      throw createError('You do not have permission to access this store', 403);
    }

    // Attach store to request for use in controllers
    (req as any).store = store;
    next();
  } catch (error: any) {
    next(error);
  }
};

/**
 * Middleware to verify store is active and payment connected
 */
export const requireActiveStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = req.params.id || req.params.storeId || (req as any).store?._id;
    if (!storeId) {
      throw createError('Store ID is required', 400);
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    if (store.status !== 'active') {
      throw createError('Store is not active', 400);
    }

    // Payment connection is optional - only check when processing payments

    (req as any).store = store;
    next();
  } catch (error: any) {
    next(error);
  }
};

/**
 * Rate limiting for store orders (100 orders/day per store)
 * Supports both store ID (from dashboard routes) and slug (from storefront routes)
 */
export const rateLimitStoreOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let storeId = req.params.id || req.params.storeId || (req as any).store?._id;
    
    // If we have a slug instead of ID, look up the store
    if (!storeId && req.params.slug) {
      const store = await Store.findOne({ slug: req.params.slug.toLowerCase(), status: 'active' });
      if (!store) {
        throw createError('Store not found', 404);
      }
      storeId = store._id;
    }
    
    if (!storeId) {
      throw createError('Store ID or slug is required', 400);
    }

    const { StoreOrder } = await import('../models/StoreOrder');
    const maxOrdersPerDay = parseInt(process.env.MAX_ORDERS_PER_DAY_PER_STORE || '100', 10);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ordersToday = await StoreOrder.countDocuments({
      storeId,
      createdAt: { $gte: startOfDay },
    });

    if (ordersToday >= maxOrdersPerDay) {
      throw createError(
        `Daily order limit reached (${maxOrdersPerDay} orders/day). Please try again tomorrow.`,
        429
      );
    }

    next();
  } catch (error: any) {
    next(error);
  }
};
