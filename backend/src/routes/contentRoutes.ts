import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  generateRecommendations,
  generateCaptions,
  generateHashtags,
  generateInterests,
  generateTrendingContent,
  generateDailyIdeas,
  generateContent,
  getContentLibrary,
  saveToLibrary,
} from '../controllers/contentController';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for content generation endpoints
const contentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: 'Too many requests. Please try again in a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = (req as any).user?._id?.toString();
    return userId ? `user:${userId}` : 'unauthenticated';
  },
});

// Instagram routes
router.post('/instagram/generate-recommendations', authenticateToken, contentRateLimit, generateRecommendations);
router.post('/instagram/generate-captions', authenticateToken, contentRateLimit, generateCaptions);
router.post('/instagram/generate-hashtags', authenticateToken, contentRateLimit, generateHashtags);
router.post('/instagram/generate-interests', authenticateToken, contentRateLimit, generateInterests);

// Facebook routes (same handlers, different endpoints)
router.post('/facebook/generate-recommendations', authenticateToken, contentRateLimit, generateRecommendations);
router.post('/facebook/generate-captions', authenticateToken, contentRateLimit, generateCaptions);
router.post('/facebook/generate-hashtags', authenticateToken, contentRateLimit, generateHashtags);
router.post('/facebook/generate-interests', authenticateToken, contentRateLimit, generateInterests);

// Content routes
router.get('/content/daily', authenticateToken, contentRateLimit, generateDailyIdeas);
router.post('/content/trending', authenticateToken, contentRateLimit, generateTrendingContent);
router.post('/content/generator', authenticateToken, contentRateLimit, generateContent);
router.get('/content/library', authenticateToken, contentRateLimit, getContentLibrary);
router.post('/content/library', authenticateToken, contentRateLimit, saveToLibrary);

export default router;








