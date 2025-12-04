import { Router } from 'express';
import {
  getWallet,
  getTransactions,
  createTopupOrder,
  verifyTopup,
  adminGetWallets,
  adminAdjustWallet,
  adminGetUserTransactions,
  getPayoutMethods,
  upsertPayoutMethod,
  deletePayoutMethod,
  requestWithdrawal,
  getUserWithdrawals,
  adminListWithdrawals,
  adminUpdateWithdrawalStatus,
} from '../controllers/walletController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// User wallet routes (authenticated)
router.get('/', authenticateToken, generalApiRateLimit, getWallet);
router.get('/transactions', authenticateToken, generalApiRateLimit, getTransactions);
router.post('/topup', authenticateToken, generalApiRateLimit, createTopupOrder);
router.post('/topup/verify', authenticateToken, generalApiRateLimit, verifyTopup);

// User payout methods + withdrawals
router.get('/payout-methods', authenticateToken, generalApiRateLimit, getPayoutMethods);
router.post('/payout-methods', authenticateToken, generalApiRateLimit, upsertPayoutMethod);
router.delete('/payout-methods/:id', authenticateToken, generalApiRateLimit, deletePayoutMethod);
router.post('/withdraw', authenticateToken, generalApiRateLimit, requestWithdrawal);
router.get('/withdrawals', authenticateToken, generalApiRateLimit, getUserWithdrawals);

// Admin wallet routes
router.get('/admin', authenticateToken, requireAdmin, generalApiRateLimit, adminGetWallets);
router.post('/admin/:userId/adjust', authenticateToken, requireAdmin, generalApiRateLimit, adminAdjustWallet);
router.get('/admin/:userId/transactions', authenticateToken, requireAdmin, generalApiRateLimit, adminGetUserTransactions);
router.get('/admin/withdrawals', authenticateToken, requireAdmin, generalApiRateLimit, adminListWithdrawals);
router.post('/admin/withdrawals/:id/status', authenticateToken, requireAdmin, generalApiRateLimit, adminUpdateWithdrawalStatus);

export default router;

