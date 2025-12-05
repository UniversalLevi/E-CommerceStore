import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  syncCustomers,
  getUserCustomers,
  getCustomerStats,
} from '../controllers/customerController';

const router = express.Router();

// User routes
router.post('/sync/:storeId', authenticateToken, syncCustomers);
router.get('/', authenticateToken, getUserCustomers);
router.get('/stats', authenticateToken, getCustomerStats);

export default router;

