import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireStoreOwner } from '../middleware/storeAccess';
import { validate } from '../middleware/validate';
import { createStoreSchema, updateStoreSchema } from '../validators/storeValidator';
import {
  createStoreConnection,
  listStoreConnections,
  getStoreConnection,
  updateStoreConnection,
  deleteStoreConnection,
  testStoreConnection,
  setDefaultStore,
} from '../controllers/storeConnectionController';
import { storeCreateRateLimit, storeTestRateLimit, generalApiRateLimit } from '../middleware/rateLimit';
import { requirePaidPlan, checkProductLimit } from '../middleware/subscription';

// Legacy store creation
import { createStore, getUserStores } from '../controllers/storeController';

const router = Router();

// Rate limiter for test endpoint (5 requests per minute per IP) - keeping express-rate-limit for compatibility
const testLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many test requests. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Store Connection Management Routes
router.post(
  '/',
  authenticateToken,
  storeCreateRateLimit,
  validate(createStoreSchema),
  createStoreConnection
);

router.get(
  '/',
  authenticateToken,
  generalApiRateLimit,
  listStoreConnections
);

router.get(
  '/:id',
  authenticateToken,
  requireStoreOwner,
  getStoreConnection
);

router.put(
  '/:id',
  authenticateToken,
  requireStoreOwner,
  validate(updateStoreSchema),
  updateStoreConnection
);

router.delete(
  '/:id',
  authenticateToken,
  requireStoreOwner,
  deleteStoreConnection
);

router.post(
  '/:id/test',
  authenticateToken,
  requireStoreOwner,
  storeTestRateLimit,
  testLimiter, // Keep both for compatibility
  testStoreConnection
);

router.put(
  '/:id/default',
  authenticateToken,
  requireStoreOwner,
  setDefaultStore
);

// Legacy routes (for backward compatibility during migration)
// Add product to store - requires subscription and checks product limit
router.post(
  '/create',
  authenticateToken,
  requirePaidPlan,
  checkProductLimit,
  storeCreateRateLimit,
  createStore
);
router.get('/user-stores', authenticateToken, generalApiRateLimit, getUserStores);

export default router;
