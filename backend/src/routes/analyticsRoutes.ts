import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePaidPlan } from '../middleware/subscription';
import { getUserAnalytics, trackProductView, trackProductImport } from '../controllers/analyticsController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Protected routes - require subscription
router.get('/', authenticateToken, requirePaidPlan, generalApiRateLimit, getUserAnalytics);
router.post('/product-view', authenticateToken, requirePaidPlan, generalApiRateLimit, trackProductView);
router.post('/product-import', authenticateToken, requirePaidPlan, generalApiRateLimit, trackProductImport);

export default router;

