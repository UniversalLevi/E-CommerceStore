import { Router } from 'express';
import { createStore, getUserStores } from '../controllers/storeController';
import { authenticateToken } from '../middleware/auth';
import { withOptionalStoreContext } from '../middleware/storeContext';
import { validate } from '../middleware/validate';
import { createStoreSchema } from '../validators/storeValidator';

const router = Router();

// All store routes require authentication
// Use optional store context to support both legacy and multi-tenant modes
router.post(
  '/create',
  authenticateToken,
  withOptionalStoreContext(),
  validate(createStoreSchema),
  createStore
);
router.get('/', authenticateToken, getUserStores);

export default router;

