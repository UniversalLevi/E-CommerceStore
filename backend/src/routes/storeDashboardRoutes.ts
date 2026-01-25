import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireStoreOwner } from '../middleware/storeMiddleware';
import * as storeController from '../controllers/storeDashboardController';
import * as productController from '../controllers/storeProductController';
import * as orderController from '../controllers/storeOrderController';
import * as razorpayController from '../controllers/storeRazorpayController';

const router = express.Router();

// Store routes
router.post('/stores', authenticateToken, storeController.createStore);
router.get('/stores', authenticateToken, storeController.getMyStore);
router.get('/stores/:id', authenticateToken, requireStoreOwner, storeController.getStore);
router.put('/stores/:id', authenticateToken, requireStoreOwner, storeController.updateStore);
router.get('/stores/:id/overview', authenticateToken, requireStoreOwner, storeController.getStoreOverview);
router.get('/stores/:id/analytics', authenticateToken, requireStoreOwner, storeController.getStoreAnalytics);
router.post('/stores/:id/disable', authenticateToken, requireStoreOwner, storeController.disableStore);

// Product routes
router.post('/stores/:id/products', authenticateToken, requireStoreOwner, productController.createProduct);
router.get('/stores/:id/products', authenticateToken, requireStoreOwner, productController.listProducts);
router.get('/stores/:id/products/:productId', authenticateToken, requireStoreOwner, productController.getProduct);
router.put('/stores/:id/products/:productId', authenticateToken, requireStoreOwner, productController.updateProduct);
router.delete('/stores/:id/products/:productId', authenticateToken, requireStoreOwner, productController.deleteProduct);

// Order routes
router.get('/stores/:id/orders', authenticateToken, requireStoreOwner, orderController.listOrders);
router.get('/stores/:id/orders/search', authenticateToken, requireStoreOwner, orderController.searchOrders);
router.get('/stores/:id/orders/export', authenticateToken, requireStoreOwner, orderController.exportOrders);
router.get('/stores/:id/orders/:orderId', authenticateToken, requireStoreOwner, orderController.getOrder);
router.put('/stores/:id/orders/:orderId/fulfillment', authenticateToken, requireStoreOwner, orderController.updateFulfillment);
router.put('/stores/:id/orders/:orderId/payment-status', authenticateToken, requireStoreOwner, orderController.updatePaymentStatus);
router.put('/stores/:id/orders/bulk-fulfillment', authenticateToken, requireStoreOwner, orderController.bulkUpdateFulfillment);
router.post('/stores/:id/orders/:orderId/notes', authenticateToken, requireStoreOwner, orderController.addOrderNote);
router.get('/stores/:id/orders/:orderId/notes', authenticateToken, requireStoreOwner, orderController.getOrderNotes);

// Razorpay routes
router.post('/stores/:id/razorpay/connect', authenticateToken, requireStoreOwner, razorpayController.initiateRazorpayConnect);
router.get('/stores/:id/razorpay/status', authenticateToken, requireStoreOwner, razorpayController.getRazorpayStatus);
router.post('/stores/:id/razorpay/set-account', authenticateToken, requireStoreOwner, razorpayController.setRazorpayAccount);

// Theme routes
router.get('/stores/:id/theme', authenticateToken, requireStoreOwner, storeController.getStoreTheme);
router.put('/stores/:id/theme', authenticateToken, requireStoreOwner, storeController.updateStoreTheme);
router.get('/themes', authenticateToken, storeController.getAvailableThemes);
router.get('/themes/:name', authenticateToken, storeController.getThemeDetails);

export default router;
