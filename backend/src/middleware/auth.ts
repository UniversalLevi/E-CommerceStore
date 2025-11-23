import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User, IUser } from '../models/User';
import { createError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check cookie first (HttpOnly), then Bearer token as fallback for API clients
    let token = req.cookies?.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { 
      userId: string;
      passwordChangedAt?: number;
    };

    const user = await User.findById(decoded.userId).select('-password').lean();

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if account is active
    if (!user.isActive) {
      throw createError('Account is disabled', 403);
    }

    // Check if password was changed after token was issued
    const tokenPasswordChangedAt = decoded.passwordChangedAt || 0;
    const userPasswordChangedAt = user.passwordChangedAt?.getTime() || 0;
    
    if (userPasswordChangedAt > tokenPasswordChangedAt) {
      throw createError('Password has been changed. Please log in again.', 401);
    }

    req.user = user as unknown as IUser;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(createError('Token expired', 401));
    }
    next(error);
  }
};

/**
 * Require specific role middleware
 * @param role - Required role ('admin' or 'user')
 */
export const requireRole = (role: 'admin' | 'user') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (req.user.role !== role) {
      return next(
        createError(`Access denied. ${role} role required.`, 403)
      );
    }

    next();
  };
};

/**
 * Require admin role middleware
 * CRITICAL: Verifies role from DB, not just JWT (prevents privilege escalation)
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  // CRITICAL: Verify role from DB, not just JWT (prevents privilege escalation)
  const user = await User.findById((req.user as any)._id).select('role').lean();

  if (!user || user.role !== 'admin') {
    return next(createError('Access denied. Admin role required.', 403));
  }

  next();
};

