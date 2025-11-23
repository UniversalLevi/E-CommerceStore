import { Router } from 'express';
import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPlans,
  getPaymentHistory,
  getCurrentPlan,
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
router.post('/create-order', authenticateToken, generalApiRateLimit, createOrder);
router.post('/verify', authenticateToken, generalApiRateLimit, verifyPayment);
router.get('/history', authenticateToken, generalApiRateLimit, getPaymentHistory);
router.get('/current-plan', authenticateToken, generalApiRateLimit, getCurrentPlan);

export default router;

