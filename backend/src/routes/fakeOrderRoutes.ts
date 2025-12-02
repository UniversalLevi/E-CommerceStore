import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requirePaidPlan } from '../middleware/subscription';
import { generalApiRateLimit } from '../middleware/rateLimit';
import { generateFakeOrders } from '../controllers/fakeOrderController';

const router = Router();

// Auto place (test) orders for a specific store
router.post(
  '/:storeId/generate',
  authenticateToken,
  requireAdmin,
  requirePaidPlan,
  generalApiRateLimit,
  generateFakeOrders
);

export default router;


