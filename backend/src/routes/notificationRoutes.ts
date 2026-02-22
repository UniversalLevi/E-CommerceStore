import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { generalApiRateLimit } from '../middleware/rateLimit';
import { PushSubscription } from '../models/PushSubscription';
import { getVapidPublicKey } from '../services/PushNotificationService';

const router = Router();

// Existing notification CRUD
router.get('/', authenticateToken, generalApiRateLimit, getNotifications);
router.put('/:id/read', authenticateToken, generalApiRateLimit, markAsRead);
router.put('/read-all', authenticateToken, generalApiRateLimit, markAllAsRead);
router.delete('/:id', authenticateToken, generalApiRateLimit, deleteNotification);

// VAPID public key (no auth needed for initial setup)
router.get('/vapid-key', (_req: Request, res: Response) => {
  const key = getVapidPublicKey();
  res.json({ success: true, vapidPublicKey: key || '' });
});

// Push subscribe
router.post('/push/subscribe', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, keys, storeId } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Invalid subscription data' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: (req as any).user.id, storeId: storeId || undefined, endpoint, keys },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Push unsubscribe
router.post('/push/unsubscribe', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint required' });
    }
    await PushSubscription.findOneAndDelete({ endpoint, userId: (req as any).user.id });
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;

