import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getRevenueSummary,
  getPayments,
  exportPayments,
} from '../controllers/revenueController';

const router = Router();

// All revenue routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/summary', getRevenueSummary);
router.get('/payments', getPayments);
router.get('/export', exportPayments);

export default router;

