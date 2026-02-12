import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireStoreOwner } from '../middleware/storeMiddleware';
import { requireStoreSubscription } from '../middleware/subscription';
import * as storeController from '../controllers/storeDashboardController';
import * as productController from '../controllers/storeProductController';
import * as orderController from '../controllers/storeOrderController';
import * as razorpayController from '../controllers/storeRazorpayController';

const router = express.Router();

// Store routes - require store subscription for all store operations
router.post('/stores', authenticateToken, requireStoreSubscription, storeController.createStore);
router.get('/stores', authenticateToken, requireStoreSubscription, storeController.getMyStore);
router.get('/stores/:id', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.getStore);
router.put('/stores/:id', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.updateStore);
router.get('/stores/:id/overview', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.getStoreOverview);
router.get('/stores/:id/analytics', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.getStoreAnalytics);
router.post('/stores/:id/disable', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.disableStore);

// Product routes - require store subscription
router.post('/stores/:id/products', authenticateToken, requireStoreSubscription, requireStoreOwner, productController.createProduct);
router.get('/stores/:id/products', authenticateToken, requireStoreSubscription, requireStoreOwner, productController.listProducts);
router.get('/stores/:id/products/:productId', authenticateToken, requireStoreSubscription, requireStoreOwner, productController.getProduct);
router.put('/stores/:id/products/:productId', authenticateToken, requireStoreSubscription, requireStoreOwner, productController.updateProduct);
router.delete('/stores/:id/products/:productId', authenticateToken, requireStoreSubscription, requireStoreOwner, productController.deleteProduct);

// Order routes - require store subscription
router.get('/stores/:id/orders', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.listOrders);
router.get('/stores/:id/orders/search', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.searchOrders);
router.get('/stores/:id/orders/export', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.exportOrders);
router.get('/stores/:id/orders/:orderId', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.getOrder);
router.put('/stores/:id/orders/:orderId/fulfillment', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.updateFulfillment);
router.put('/stores/:id/orders/:orderId/payment-status', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.updatePaymentStatus);
router.put('/stores/:id/orders/bulk-fulfillment', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.bulkUpdateFulfillment);
router.post('/stores/:id/orders/:orderId/notes', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.addOrderNote);
router.get('/stores/:id/orders/:orderId/notes', authenticateToken, requireStoreSubscription, requireStoreOwner, orderController.getOrderNotes);

// Razorpay routes - require store subscription
router.post('/stores/:id/razorpay/connect', authenticateToken, requireStoreSubscription, requireStoreOwner, razorpayController.initiateRazorpayConnect);
router.get('/stores/:id/razorpay/status', authenticateToken, requireStoreSubscription, requireStoreOwner, razorpayController.getRazorpayStatus);
router.post('/stores/:id/razorpay/set-account', authenticateToken, requireStoreSubscription, requireStoreOwner, razorpayController.setRazorpayAccount);

// Theme routes - require store subscription
router.get('/stores/:id/theme', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.getStoreTheme);
router.put('/stores/:id/theme', authenticateToken, requireStoreSubscription, requireStoreOwner, storeController.updateStoreTheme);
router.get('/themes', authenticateToken, storeController.getAvailableThemes);
router.get('/themes/:name', authenticateToken, storeController.getThemeDetails);

export default router;
