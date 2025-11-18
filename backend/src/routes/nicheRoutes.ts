import { Router } from 'express';
import { getAllNiches, getNicheBySlug, getNicheProducts } from '../controllers/nicheController';
import { cacheMiddleware } from '../middleware/cache';
import { nicheRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public routes (slug-based, with caching and rate limiting)
router.get('/', cacheMiddleware(300), nicheRateLimit, getAllNiches);
router.get('/:slug', cacheMiddleware(300), nicheRateLimit, getNicheBySlug);
router.get('/:slug/products', cacheMiddleware(60), nicheRateLimit, getNicheProducts);

export default router;




