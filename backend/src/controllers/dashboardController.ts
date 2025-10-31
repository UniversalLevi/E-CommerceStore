import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const stats = {
      storeCount: req.user.stores?.length || 0,
      shopifyConnected: !!(
        req.user.shopifyAccessToken && req.user.shopifyShop
      ),
      shopifyShop: req.user.shopifyShop || null,
      email: req.user.email,
      role: req.user.role,
      recentStores: req.user.stores?.slice(-5).reverse() || [],
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

