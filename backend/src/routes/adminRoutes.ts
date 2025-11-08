import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getDashboardStats,
  getSystemHealth,
  listUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAuditLogs,
  exportAuditLogs,
} from '../controllers/adminController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/health', getSystemHealth);

// User management routes
router.get('/users', listUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Audit log routes
router.get('/audit', getAuditLogs);
router.get('/audit/export', exportAuditLogs);

export default router;

