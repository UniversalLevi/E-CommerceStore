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
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw createError('Access token required', 401);
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw createError('User not found', 404);
    }

    req.user = user;
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
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(createError('Access denied. Admin role required.', 403));
  }

  next();
};

