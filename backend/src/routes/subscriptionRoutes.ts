import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  listSubscriptions,
  getSubscription,
  getUserSubscriptionHistory,
  grantSubscription,
  revokeSubscription,
  updateSubscription,
  getCurrentSubscription,
  cancelSubscription,
  getSubscriptionStatus,
} from '../controllers/subscriptionController';

const router = Router();

// All subscription routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', listSubscriptions);
router.get('/:subscriptionId', getSubscription);
router.get('/user/:userId/history', getUserSubscriptionHistory);
router.post('/grant', grantSubscription);
router.post('/revoke', revokeSubscription);
router.post('/update', updateSubscription);

export default router;

