import { Router } from 'express';
import {
  getWallet,
  getTransactions,
  createTopupOrder,
  verifyTopup,
  adminGetWallets,
  adminAdjustWallet,
  adminGetUserTransactions,
} from '../controllers/walletController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// User wallet routes (authenticated)
router.get('/', authenticateToken, generalApiRateLimit, getWallet);
router.get('/transactions', authenticateToken, generalApiRateLimit, getTransactions);
router.post('/topup', authenticateToken, generalApiRateLimit, createTopupOrder);
router.post('/topup/verify', authenticateToken, generalApiRateLimit, verifyTopup);

// Admin wallet routes
router.get('/admin', authenticateToken, requireAdmin, generalApiRateLimit, adminGetWallets);
router.post('/admin/:userId/adjust', authenticateToken, requireAdmin, generalApiRateLimit, adminAdjustWallet);
router.get('/admin/:userId/transactions', authenticateToken, requireAdmin, generalApiRateLimit, adminGetUserTransactions);

export default router;

