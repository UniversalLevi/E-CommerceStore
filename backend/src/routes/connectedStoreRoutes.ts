import { Router } from 'express';
import {
  initiateShopifyOAuth,
  handleShopifyCallback,
  addManualCredentials,
  getUserStores,
  getStoreStatus,
  disconnectStore,
} from '../controllers/connectedStoreController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const manualCredentialsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeDomain: z.string().min(1, 'Store domain is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  platform: z.enum(['shopify', 'woocommerce', 'etsy']).optional(),
});

// OAuth routes
router.get('/shopify/connect', authenticateToken, initiateShopifyOAuth);
router.get('/shopify/callback', handleShopifyCallback);

// Manual credential entry
router.post(
  '/shopify/manual',
  authenticateToken,
  validate(manualCredentialsSchema),
  addManualCredentials
);

// Store management
router.get('/', authenticateToken, getUserStores);
router.get('/:storeId/status', authenticateToken, getStoreStatus);
router.delete('/:storeId/disconnect', authenticateToken, disconnectStore);

export default router;

