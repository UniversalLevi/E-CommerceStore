import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to automatically catch errors and pass them to Express error handler
 * @param fn - Async route handler function
 * @returns Wrapped function that catches errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

