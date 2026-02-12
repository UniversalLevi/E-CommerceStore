import { Router } from 'express';
import { getStorePlans, getCurrentStorePlan } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public route for store plans
router.get('/store-plans', getStorePlans);

// Authenticated route for current store subscription
router.get('/store-subscription', authenticateToken, generalApiRateLimit, getCurrentStorePlan);

export default router;
