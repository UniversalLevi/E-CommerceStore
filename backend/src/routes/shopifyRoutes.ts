import { Router } from 'express';
import {
  initiateAuth,
  handleCallback,
  getConnectionStatus,
  disconnectShopify,
} from '../controllers/shopifyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// OAuth flow (auth accepts token in query param for redirect)
router.get('/auth', initiateAuth);
router.get('/callback', handleCallback);

// Connection management
router.get('/status', authenticateToken, getConnectionStatus);
router.post('/disconnect', authenticateToken, disconnectShopify);

export default router;

