import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUserAnalytics, trackProductView, trackProductImport } from '../controllers/analyticsController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Protected routes
router.get('/', authenticateToken, generalApiRateLimit, getUserAnalytics);
router.post('/product-view', authenticateToken, generalApiRateLimit, trackProductView);
router.post('/product-import', authenticateToken, generalApiRateLimit, trackProductImport);

export default router;

