import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

/**
 * Create a new internal store
 * POST /api/stores
 */
export const createStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { name, slug, currency = 'INR' } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw createError('Store name is required', 400);
    }

    // Check if user already has a store (one store per user)
    const existingStore = await Store.findOne({
      owner: (req.user as any)._id,
    }).lean();

    if (existingStore) {
      throw createError(
        'You already have a store. Each user can only have one store.',
        400
      );
    }

    // Generate slug from name if not provided
    let storeSlug = slug;
    if (!storeSlug) {
      storeSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Check if slug is already taken
    const slugExists = await Store.findOne({ slug: storeSlug }).lean();
    if (slugExists) {
      throw createError('This store URL is already taken. Please choose a different name.', 400);
    }

    // Create internal store
    const store = await Store.create({
      owner: (req.user as any)._id,
      name: name.trim(),
      slug: storeSlug,
      currency: currency.toUpperCase(),
      status: 'active',
    });

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'CREATE_STORE',
      success: true,
      details: {
        storeName: name,
        slug: storeSlug,
        currency,
      },
      ipAddress: req.ip,
    });

    // Create notification
    await createNotification({
      userId: (req.user as any)._id,
      type: 'store_connection',
      title: 'Store Created Successfully',
      message: `Your store "${name}" has been created successfully. You can now start adding products!`,
      link: `/dashboard/stores/${(store as any)._id}`,
      metadata: {
        storeId: (store as any)._id.toString(),
        storeName: name,
      },
    });

    // Return store info
    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        currency: store.currency,
        status: store.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List user's stores
 * GET /api/stores
 */
export const listStoreConnections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Admin can view all stores, users see only their own
    const query: any = req.user.role === 'admin'
      ? {}
      : { owner: (req.user as any)._id };

    // Optional filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const stores = await Store.find(query)
      .populate('owner', 'email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single store
 * GET /api/stores/:id
 */
export const getStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = req.params.id;
    if (!storeId) {
      throw createError('Store ID is required', 400);
    }

    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)?._id?.toString();
    const isAdmin = req.user?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Count products in this store
    const { StoreProduct } = await import('../models/StoreProduct');
    const productCount = await StoreProduct.countDocuments({ storeId: store._id });

    // Get recent activity from audit logs
    const { AuditLog } = await import('../models/AuditLog');
    const recentActivity = await AuditLog.find({
      storeId: store._id,
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action success timestamp details')
      .lean();

    // Return store info
    res.json({
      success: true,
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        currency: store.currency,
        status: store.status,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        owner: store.owner,
        stats: {
          productCount,
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update store
 * PUT /api/stores/:id
 */
export const updateStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const storeId = req.params.id;
    const store = await Store.findById(storeId);
    
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    const { name, status } = req.body;

    // Update fields
    if (name) store.name = name.trim();
    if (status && ['inactive', 'active', 'suspended'].includes(status)) {
      store.status = status;
    }

    await store.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'UPDATE_STORE',
      success: true,
      details: {
        fieldsUpdated: Object.keys(req.body),
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: {
        id: store._id,
        name: store.name,
        slug: store.slug,
        status: store.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete store
 * DELETE /api/stores/:id
 */
export const deleteStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const storeId = req.params.id;
    const store = await Store.findById(storeId);
    
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    const storeName = store.name;

    // Delete the store
    await Store.findByIdAndDelete(store._id);

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'DELETE_STORE',
      success: true,
      details: {
        storeName,
        slug: store.slug,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Store deleted successfully',
      data: {
        deletedStore: storeName,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test store (internal stores don't need connection testing)
 * POST /api/stores/:id/test
 */
export const testStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const storeId = req.params.id;
    const store = await Store.findById(storeId);
    
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Internal stores are always valid - just return store status
    res.json({
      success: true,
      valid: true,
      message: 'Store is active',
      data: {
        status: store.status,
        name: store.name,
        slug: store.slug,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set store as default (not applicable for internal stores - one store per user)
 * PUT /api/stores/:id/default
 */
export const setDefaultStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const storeId = req.params.id;
    const store = await Store.findById(storeId);
    
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Internal stores: Each user has only one store, so it's always the default
    res.json({
      success: true,
      message: `${store.name} is your store`,
      data: {
        id: store._id,
        name: store.name,
      },
    });
  } catch (error) {
    next(error);
  }
};



