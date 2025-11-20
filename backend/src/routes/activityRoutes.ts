import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getUserActivity } from '../controllers/activityController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Protected route
router.get('/', authenticateToken, generalApiRateLimit, getUserActivity);

export default router;

