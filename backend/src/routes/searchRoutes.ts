import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public route with rate limiting
router.get('/', generalApiRateLimit, globalSearch);

export default router;

