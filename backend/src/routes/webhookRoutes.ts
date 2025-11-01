import { Router } from 'express';
import {
  handleOrderWebhook,
  handleProductUpdateWebhook,
  handleGenericWebhook,
} from '../controllers/webhookController';

const router = Router();

// Shopify webhooks
router.post('/shopify/orders', handleOrderWebhook);
router.post('/shopify/products', handleProductUpdateWebhook);
router.post('/shopify/:topic', handleGenericWebhook);

export default router;

