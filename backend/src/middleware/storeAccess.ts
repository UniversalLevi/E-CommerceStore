import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Store } from '../models/Store';
import { createError } from './errorHandler';

/**
 * Middleware to verify user owns the store or is an admin
 * Attaches store to req.storeDoc for downstream use
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

    // Check if user owns the store or is admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('Access denied. You do not own this store.', 403);
    }

    // Attach store to request for downstream use
    req.storeDoc = store;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional store access - doesn't fail if store not found
 * Used for endpoints that can work with or without store context
 */
export const optionalStoreAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next();
    }

    const storeId = req.params.id || req.params.storeId;

    if (!storeId) {
      return next();
    }

    const store = await Store.findById(storeId);

    if (store) {
      const isOwner = store.owner.toString() === (req.user as any)._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (isOwner || isAdmin) {
        req.storeDoc = store;
      }
    }

    next();
  } catch (error) {
    // Don't fail - this is optional
    next();
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      storeDoc?: any; // Will be populated with Store document
    }
  }
}



