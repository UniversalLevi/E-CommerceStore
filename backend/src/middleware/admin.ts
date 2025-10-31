import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { createError } from './errorHandler';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  if (req.user.role !== 'admin') {
    return next(createError('Admin access required', 403));
  }

  next();
};

