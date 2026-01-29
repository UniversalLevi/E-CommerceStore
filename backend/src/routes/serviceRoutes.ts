import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  createServiceOrder,
  createServicePaymentOrder,
  verifyServicePayment,
  getServiceOrders,
  getServiceOrder,
  getAdminServiceOrders,
  updateServiceOrderStatus,
} from '../controllers/serviceController';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public routes (authenticated users)
router.post('/orders', authenticateToken, generalApiRateLimit, createServiceOrder);
router.post('/orders/:id/payment', authenticateToken, generalApiRateLimit, createServicePaymentOrder);
router.post('/orders/:id/verify', authenticateToken, generalApiRateLimit, verifyServicePayment);
router.get('/orders', authenticateToken, getServiceOrders);
router.get('/orders/:id', authenticateToken, getServiceOrder);

// Admin routes
router.get('/orders/admin/all', authenticateToken, requireAdmin, getAdminServiceOrders);
router.put('/orders/:id/admin', authenticateToken, requireAdmin, updateServiceOrderStatus);

export default router;
