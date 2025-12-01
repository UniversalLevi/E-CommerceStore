import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requirePaidPlan } from '../middleware/subscription';
import { generalApiRateLimit } from '../middleware/rateLimit';
import {
  listStoreOrders,
  listAllStoreOrders,
  getOrderDetails,
  updateOrder,
  fulfillOrder,
  cancelFulfillment,
  getStoreRevenueAnalytics,
  addOrderNote,
  markOrderCompleted,
  reopenOrder,
} from '../controllers/orderController';

const router = Router();

// ==========================================
// Admin Routes (must be before :storeId routes)
// ==========================================

// List orders from all stores (Admin only)
router.get(
  '/admin/all',
  authenticateToken,
  requireAdmin,
  generalApiRateLimit,
  listAllStoreOrders
);

// Get store-wise revenue analytics (Admin only)
router.get(
  '/admin/revenue',
  authenticateToken,
  requireAdmin,
  generalApiRateLimit,
  getStoreRevenueAnalytics
);

// ==========================================
// Store-specific Routes
// ==========================================

// List orders for a specific store
router.get(
  '/:storeId',
  authenticateToken,
  requirePaidPlan,
  generalApiRateLimit,
  listStoreOrders
);

// Get single order details
router.get(
  '/:storeId/:orderId',
  authenticateToken,
  requirePaidPlan,
  getOrderDetails
);

// Update order (cancel, close, open)
router.put(
  '/:storeId/:orderId',
  authenticateToken,
  requirePaidPlan,
  updateOrder
);

// Fulfill an order
router.post(
  '/:storeId/:orderId/fulfill',
  authenticateToken,
  requirePaidPlan,
  fulfillOrder
);

// Cancel a fulfillment
router.post(
  '/:storeId/:orderId/fulfillments/:fulfillmentId/cancel',
  authenticateToken,
  requirePaidPlan,
  cancelFulfillment
);

// Add note to order
router.post(
  '/:storeId/:orderId/note',
  authenticateToken,
  requirePaidPlan,
  addOrderNote
);

// Mark order as completed (payment received)
router.post(
  '/:storeId/:orderId/complete',
  authenticateToken,
  requirePaidPlan,
  markOrderCompleted
);

// Reopen a completed order
router.post(
  '/:storeId/:orderId/reopen',
  authenticateToken,
  requirePaidPlan,
  reopenOrder
);

export default router;

