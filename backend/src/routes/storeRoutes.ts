import { Router } from 'express';
import { createStore, getUserStores } from '../controllers/storeController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStoreSchema } from '../validators/storeValidator';

const router = Router();

// All store routes require authentication
router.post('/create', authenticateToken, validate(createStoreSchema), createStore);
router.get('/', authenticateToken, getUserStores);

export default router;

