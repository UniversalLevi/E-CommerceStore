import { Router } from 'express';
import {
  applyForAffiliate,
  getMyAffiliate,
  getAffiliateStats,
  getCommissions,
  getReferrals,
  requestPayout,
  getPayoutHistory,
} from '../controllers/affiliateController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/apply', applyForAffiliate);
router.get('/me', getMyAffiliate);
router.get('/stats', getAffiliateStats);
router.get('/commissions', getCommissions);
router.get('/referrals', getReferrals);
router.post('/payout/request', requestPayout);
router.get('/payout/history', getPayoutHistory);

export default router;
