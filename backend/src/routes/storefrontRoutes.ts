import express from 'express';
import * as storefrontController from '../controllers/storefrontController';
import { rateLimitStoreOrders } from '../middleware/storeMiddleware';

const router = express.Router();

// Public storefront routes (no auth required)
router.get('/:slug', storefrontController.getStorePublicInfo);
router.get('/:slug/products', storefrontController.listStorefrontProducts);
router.get('/:slug/products/:productId', storefrontController.getStorefrontProduct);
router.post('/:slug/orders', rateLimitStoreOrders, storefrontController.createStorefrontOrder);
router.post('/:slug/orders/:orderId/payment', storefrontController.createPaymentOrder);
router.post('/:slug/orders/:orderId/verify', storefrontController.verifyPayment);

export default router;
