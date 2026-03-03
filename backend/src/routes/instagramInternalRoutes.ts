import { Router, Request, Response, NextFunction } from 'express';
import { createUserAndStoreFromInstagram } from '../controllers/instagramInternalController';
import { createError } from '../middleware/errorHandler';

const router = Router();

const requireInstaForgeApiKey = (req: Request, _res: Response, next: NextFunction) => {
  const apiKey = req.header('x-api-key') || req.header('X-API-Key');
  const expected = process.env.INSTAFORGE_SECRET;

  if (!expected) {
    return next(createError('INSTAFORGE_SECRET is not configured on the server', 500));
  }

  if (!apiKey || apiKey !== expected) {
    return next(createError('Unauthorized: invalid internal API key', 401));
  }

  next();
};

router.post('/create-user-and-store', requireInstaForgeApiKey, createUserAndStoreFromInstagram);

export default router;

