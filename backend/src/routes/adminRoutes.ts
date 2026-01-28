import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getDashboardStats,
  getSystemHealth,
  listUsers,
  getUserDetails,
  getComprehensiveUserData,
  updateUserRole,
  toggleUserStatus,
  updateUserInfo,
  deleteUser,
  getAuditLogs,
  exportAuditLogs,
  getContacts,
  getContact,
  replyToContact,
  updateContactStatus,
  deleteContact,
  updateOrderZenStatus,
} from '../controllers/adminController';
import revenueRoutes from './revenueRoutes';
import subscriptionRoutes from './subscriptionRoutes';
import productAnalyticsRoutes from './productAnalyticsRoutes';
import emailSenderRoutes from './emailSenderRoutes';
import adminInternalStoreRoutes from './adminInternalStoreRoutes';
import { sendNotification, getNotificationHistory, getNotificationDetails } from '../controllers/notificationController';
import { getAllCustomers } from '../controllers/customerController';
import { createCallLog, getUserCallLogs, getAllCallLogs, updateCallLog, deleteCallLog } from '../controllers/callLogController';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/health', getSystemHealth);

// User management routes
router.get('/users', listUsers);
router.get('/users/:id', getUserDetails);
router.get('/users/:id/comprehensive', getComprehensiveUserData);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/update', updateUserInfo);
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

// Product analytics routes
router.use('/product-analytics', productAnalyticsRoutes);

// Email sender routes
router.use('/email-sender', emailSenderRoutes);

// Subscription management routes
router.use('/subscriptions', subscriptionRoutes);

// Notification routes
router.post('/notifications/send', sendNotification);
router.get('/notifications/history', getNotificationHistory);
router.get('/notifications/details', getNotificationDetails);

// Customer management routes
router.get('/customers', getAllCustomers);

// Order management routes
router.put('/orders/:orderId/zen-status', updateOrderZenStatus);

// Call log routes
router.post('/call-logs', createCallLog);
router.get('/call-logs', getAllCallLogs);
router.get('/call-logs/user/:userId', getUserCallLogs);
router.put('/call-logs/:id', updateCallLog);
router.delete('/call-logs/:id', deleteCallLog);

// Internal store management routes
router.use('/internal-stores', adminInternalStoreRoutes);

export default router;

