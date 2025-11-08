import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  retryable?: boolean;
  suggestion?: string;
}

export const errorHandler = (
  err: AppError | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      retryable: err.retryable,
      suggestion: err.suggestion,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle regular AppError
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Don't log expected 401s on auth check endpoint (user checking if logged in)
  const isExpectedAuthCheck = statusCode === 401 && req.path === '/api/auth/me';
  
  if (!isExpectedAuthCheck) {
    logger.error('Error occurred', {
      statusCode,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    statusCode,
    retryable: statusCode >= 500 && statusCode < 600,
    suggestion: statusCode >= 500 
      ? 'Please try again in a few moments. If the problem persists, contact support.'
      : '',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

