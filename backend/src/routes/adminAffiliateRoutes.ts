import { Router } from 'express';
import {
  listAffiliates,
  getAffiliateDetails,
  approveAffiliate,
  rejectAffiliate,
  suspendAffiliate,
  setCustomCommissionRate,
  getAffiliateCommissions,
  adjustCommission,
  approvePayout,
  rejectPayout,
  exportAffiliates,
  exportPayouts,
} from '../controllers/adminAffiliateController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', listAffiliates);
router.get('/export', exportAffiliates);
router.get('/export-payouts', exportPayouts);
router.get('/:id', getAffiliateDetails);
router.post('/:id/approve', approveAffiliate);
router.post('/:id/reject', rejectAffiliate);
router.post('/:id/suspend', suspendAffiliate);
router.put('/:id/commission-rate', setCustomCommissionRate);
router.get('/:id/commissions', getAffiliateCommissions);
router.post('/:id/commission/:commissionId/adjust', adjustCommission);
router.post('/:id/payout/:payoutId/approve', approvePayout);
router.post('/:id/payout/:payoutId/reject', rejectPayout);

export default router;
