import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// All routes require authentication
router.get('/', authenticateToken, generalApiRateLimit, getNotifications);
router.put('/:id/read', authenticateToken, generalApiRateLimit, markAsRead);
router.put('/read-all', authenticateToken, generalApiRateLimit, markAllAsRead);
router.delete('/:id', authenticateToken, generalApiRateLimit, deleteNotification);

export default router;

