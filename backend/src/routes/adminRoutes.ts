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
  getContacts,
  getContact,
  replyToContact,
  updateContactStatus,
  deleteContact,
} from '../controllers/adminController';
import revenueRoutes from './revenueRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import { sendNotification, getNotificationHistory, getNotificationDetails } from '../controllers/notificationController';

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

// Contact management routes
router.get('/contacts', getContacts);
router.get('/contacts/:id', getContact);
router.post('/contacts/:id/reply', replyToContact);
router.put('/contacts/:id/status', updateContactStatus);
router.delete('/contacts/:id', deleteContact);

// Revenue routes
router.use('/revenue', revenueRoutes);

// Subscription management routes
router.use('/subscriptions', subscriptionRoutes);

// Notification routes
router.post('/notifications/send', sendNotification);
router.get('/notifications/history', getNotificationHistory);
router.get('/notifications/details', getNotificationDetails);

export default router;

