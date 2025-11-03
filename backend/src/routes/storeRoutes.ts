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

// Legacy store creation
import { createStore, getUserStores } from '../controllers/storeController';

const router = Router();

// Rate limiter for test endpoint (5 requests per minute per IP)
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
  validate(createStoreSchema),
  createStoreConnection
);

router.get(
  '/',
  authenticateToken,
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
  testLimiter,
  testStoreConnection
);

router.put(
  '/:id/default',
  authenticateToken,
  requireStoreOwner,
  setDefaultStore
);

// Legacy routes (for backward compatibility during migration)
router.post('/create', authenticateToken, createStore);
router.get('/user-stores', authenticateToken, getUserStores);

export default router;
