import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { StoreOrder } from '../models/StoreOrder';
import { InternalStoreLog } from '../models/InternalStoreLog';
import { createError } from '../middleware/errorHandler';
import { getStoreLogs, getStoreLogStats } from '../services/internalStoreLogger';

/**
 * List all internal stores
 * GET /api/admin/internal-stores
 */
export const listInternalStores = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, owner, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (owner) {
      query.owner = owner;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const [stores, total] = await Promise.all([
      Store.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string, 10))
        .lean(),
      Store.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: stores,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        pages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get internal store details
 * GET /api/admin/internal-stores/:id
 */
export const getInternalStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const store = await Store.findById(storeId).populate('owner', 'name email').lean();

    if (!store) {
      throw createError('Store not found', 404);
    }

    // Get store statistics
    const [productCount, orderCount, logStats] = await Promise.all([
      StoreProduct.countDocuments({ storeId }),
      StoreOrder.countDocuments({ storeId }),
      getStoreLogStats(storeId),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...store,
        stats: {
          products: productCount,
          orders: orderCount,
          logs: logStats,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update internal store (admin override)
 * PUT /api/admin/internal-stores/:id
 */
export const updateInternalStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { name, status, settings } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    if (name !== undefined) {
      store.name = name;
    }

    if (status !== undefined) {
      if (!['inactive', 'active', 'suspended'].includes(status)) {
        throw createError('Invalid status', 400);
      }
      store.status = status;
    }

    if (settings !== undefined) {
      store.settings = { ...store.settings, ...settings };
      store.markModified('settings');
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
 * Suspend internal store
 * POST /api/admin/internal-stores/:id/suspend
 */
export const suspendInternalStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const store = await Store.findById(storeId);

    if (!store) {
      throw createError('Store not found', 404);
    }

    store.status = 'suspended';
    await store.save();

    res.status(200).json({
      success: true,
      data: store,
      message: 'Store suspended successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Activate internal store
 * POST /api/admin/internal-stores/:id/activate
 */
export const activateInternalStore = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const store = await Store.findById(storeId);

    if (!store) {
      throw createError('Store not found', 404);
    }

    store.status = 'active';
    await store.save();

    res.status(200).json({
      success: true,
      data: store,
      message: 'Store activated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get store activity logs
 * GET /api/admin/internal-stores/:id/logs
 */
export const getInternalStoreLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { action, entityType, success, startDate, endDate, page = 1, limit = 50 } = req.query;

    const logs = await getStoreLogs(storeId, {
      limit: parseInt(limit as string, 10),
      skip: (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10),
      action: action as string,
      entityType: entityType as string,
      success: success === 'true' ? true : success === 'false' ? false : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    // Build query for total count
    const mongoose = await import('mongoose');
    const countQuery: any = { storeId: new mongoose.default.Types.ObjectId(storeId) };
    if (action) countQuery.action = action;
    if (entityType) countQuery.entityType = entityType;
    if (success !== undefined) countQuery.success = success === 'true';
    if (startDate || endDate) {
      countQuery.timestamp = {};
      if (startDate) countQuery.timestamp.$gte = new Date(startDate as string);
      if (endDate) countQuery.timestamp.$lte = new Date(endDate as string);
    }
    const total = await InternalStoreLog.countDocuments(countQuery);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        pages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get store products
 * GET /api/admin/internal-stores/:id/products
 */
export const getStoreProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query: any = { storeId };
    if (status) {
      query.status = status;
    }

    const [products, total] = await Promise.all([
      StoreProduct.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string, 10)).lean(),
      StoreProduct.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        pages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get store orders
 * GET /api/admin/internal-stores/:id/orders
 */
export const getStoreOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query: any = { storeId };
    if (status) {
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      StoreOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string, 10)).lean(),
      StoreOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        pages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};
