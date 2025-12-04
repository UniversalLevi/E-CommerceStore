import { Router } from 'express';
import {
  listZenOrders,
  getZenOrderDetails,
  updateZenOrderStatus,
  assignStaff,
  updateTracking,
  updateRtoAddress,
  addInternalNote,
  updateFlags,
  bulkUpdateZenOrders,
  getZenOrderStats,
} from '../controllers/zenOrderController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);
router.use(generalApiRateLimit);

// Stats (must be before :zenOrderId routes)
router.get('/stats', getZenOrderStats);

// Bulk operations
router.post('/bulk', bulkUpdateZenOrders);

// List all ZEN orders
router.get('/', listZenOrders);

// Get single ZEN order details
router.get('/:zenOrderId', getZenOrderDetails);

// Update status
router.post('/:zenOrderId/status', updateZenOrderStatus);

// Assign staff
router.post('/:zenOrderId/assign', assignStaff);

// Update tracking
router.post('/:zenOrderId/tracking', updateTracking);
router.post('/:zenOrderId/rto-address', updateRtoAddress);

// Add internal note
router.post('/:zenOrderId/notes', addInternalNote);

// Update flags (priority, delayed, issue)
router.post('/:zenOrderId/flags', updateFlags);

export default router;

