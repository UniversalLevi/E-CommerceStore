import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  listInternalStores,
  getInternalStore,
  updateInternalStore,
  suspendInternalStore,
  activateInternalStore,
  getInternalStoreLogs,
  getStoreProducts,
  getStoreOrders,
} from '../controllers/adminInternalStoreController';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Store management
router.get('/', listInternalStores);
router.get('/:id', getInternalStore);
router.put('/:id', updateInternalStore);
router.post('/:id/suspend', suspendInternalStore);
router.post('/:id/activate', activateInternalStore);

// Store details
router.get('/:id/logs', getInternalStoreLogs);
router.get('/:id/products', getStoreProducts);
router.get('/:id/orders', getStoreOrders);

export default router;
