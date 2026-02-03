import { Router } from 'express';
import express from 'express';
import {
  createSubscription,
  verifyPayment,
  handleWebhook,
  getPlans,
  getPaymentHistory,
  getCurrentPlan,
  verifyTokenPlan,
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public routes
router.get('/plans', getPlans);

// Webhook route - CRITICAL: Must use express.raw middleware for signature verification
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Authenticated routes
router.post('/create-subscription', authenticateToken, generalApiRateLimit, createSubscription);
router.post('/verify', authenticateToken, generalApiRateLimit, verifyPayment);
router.get('/history', authenticateToken, generalApiRateLimit, getPaymentHistory);
router.get('/current-plan', authenticateToken, generalApiRateLimit, getCurrentPlan);
router.get('/verify-token-plan', authenticateToken, generalApiRateLimit, verifyTokenPlan); // Diagnostic endpoint

export default router;

