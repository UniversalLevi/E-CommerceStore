import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUserAnalytics } from '../controllers/analyticsController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Protected route
router.get('/', authenticateToken, generalApiRateLimit, getUserAnalytics);

export default router;

