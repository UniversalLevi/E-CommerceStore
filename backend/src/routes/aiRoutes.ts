import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { findWinningProduct, writeProductDescription } from '../controllers/aiController';
import { validate } from '../middleware/validate';
import { WinningProductSchema, WriteDescriptionSchema } from '../validators/aiValidator';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for AI endpoints (10 requests per minute per user)
// Note: Since these routes require authentication, we primarily use user ID for rate limiting
const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many AI requests. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for rate limiting (routes require authentication)
    const userId = (req as any).user?._id?.toString();
    if (userId) {
      return `user:${userId}`;
    }
    // Fallback to a default key if somehow unauthenticated
    // Using a fixed string to avoid IPv6 validation warning
    return 'unauthenticated';
  },
});

// Input size limit middleware (10kb)
const inputSizeLimit = (req: any, res: any, next: any) => {
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  if (contentLength > 10 * 1024) {
    return res.status(413).json({
      success: false,
      error: 'Request payload too large. Maximum 10KB allowed.',
    });
  }
  next();
};

// AI routes with authentication, rate limiting, and validation
router.post(
  '/find-winning-product',
  authenticateToken,
  aiRateLimit,
  inputSizeLimit,
  validate(WinningProductSchema),
  findWinningProduct
);

router.post(
  '/write-product-description',
  authenticateToken,
  aiRateLimit,
  inputSizeLimit,
  validate(WriteDescriptionSchema),
  writeProductDescription
);

export default router;

