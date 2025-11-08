import { Request, Response, NextFunction } from 'express';

// In-memory store (use LRU cache or Redis in production)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function createRateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?._id?.toString() || req.ip;
    const key = `${userId}:${req.path}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      });
    }

    record.count++;
    next();
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) rateLimitStore.delete(key);
  }
}, 300000); // 5 minutes

// Pre-configured rate limiters
export const authRateLimit = createRateLimit(5, 60 * 1000); // 5 per minute
export const storeTestRateLimit = createRateLimit(5, 60 * 1000); // 5 per minute
export const storeCreateRateLimit = createRateLimit(10, 60 * 60 * 1000); // 10 per hour
export const generalApiRateLimit = createRateLimit(100, 60 * 1000); // 100 per minute

