import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCurrentSubscription,
  cancelSubscription,
  getSubscriptionStatus,
} from '../controllers/subscriptionController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// All routes require authentication (user-facing, not admin)
router.use(authenticateToken);
router.use(generalApiRateLimit);

router.get('/current', getCurrentSubscription);
router.post('/:id/cancel', cancelSubscription);
router.get('/:id/status', getSubscriptionStatus);

export default router;
