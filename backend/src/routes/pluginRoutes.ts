import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { requireStoreOwner } from '../middleware/storeMiddleware';
import { requireStoreSubscription } from '../middleware/subscription';
import * as pc from '../controllers/pluginController';

const router = express.Router();

// ─── Public: list available plugins ─────────────────────────────────
router.get('/plugins', pc.listPlugins);

// ─── Admin: toggle plugin platform-wide ─────────────────────────────
router.put('/admin/plugins/:slug/toggle', authenticateToken, requireAdmin, pc.togglePlugin);

// ─── Store Dashboard: plugin configs ────────────────────────────────
const storeAuth = [authenticateToken, requireStoreSubscription, requireStoreOwner];

router.get('/store-dashboard/stores/:id/plugins', ...storeAuth, pc.getStorePlugins);
router.put('/store-dashboard/stores/:id/plugins/:pluginSlug/config', ...storeAuth, pc.updateStorePluginConfig);

// Coupons
router.post('/store-dashboard/stores/:id/coupons', ...storeAuth, pc.createCoupon);
router.get('/store-dashboard/stores/:id/coupons', ...storeAuth, pc.listCoupons);
router.put('/store-dashboard/stores/:id/coupons/:couponId', ...storeAuth, pc.updateCoupon);
router.delete('/store-dashboard/stores/:id/coupons/:couponId', ...storeAuth, pc.deleteCoupon);

// Gift Cards (store dashboard)
router.post('/store-dashboard/stores/:id/gift-cards', ...storeAuth, pc.createGiftCard);
router.get('/store-dashboard/stores/:id/gift-cards', ...storeAuth, pc.listGiftCards);
router.delete('/store-dashboard/stores/:id/gift-cards/:giftCardId', ...storeAuth, pc.deleteGiftCard);

// Free Gift Rules
router.post('/store-dashboard/stores/:id/free-gift-rules', ...storeAuth, pc.createFreeGiftRule);
router.get('/store-dashboard/stores/:id/free-gift-rules', ...storeAuth, pc.listFreeGiftRules);
router.put('/store-dashboard/stores/:id/free-gift-rules/:ruleId', ...storeAuth, pc.updateFreeGiftRule);
router.delete('/store-dashboard/stores/:id/free-gift-rules/:ruleId', ...storeAuth, pc.deleteFreeGiftRule);

// Bundles
router.post('/store-dashboard/stores/:id/bundles', ...storeAuth, pc.createBundle);
router.get('/store-dashboard/stores/:id/bundles', ...storeAuth, pc.listBundles);
router.put('/store-dashboard/stores/:id/bundles/:bundleId', ...storeAuth, pc.updateBundle);
router.delete('/store-dashboard/stores/:id/bundles/:bundleId', ...storeAuth, pc.deleteBundle);

// Email Subscribers
router.get('/store-dashboard/stores/:id/subscribers', ...storeAuth, pc.listSubscribers);
router.get('/store-dashboard/stores/:id/subscribers/export', ...storeAuth, pc.exportSubscribers);

// ─── Storefront (public) ────────────────────────────────────────────
router.get('/storefront/:slug/plugins', pc.getStorefrontPlugins);
router.post('/storefront/:slug/coupons/validate', pc.validateCoupon);
router.post('/storefront/:slug/gift-cards/purchase', pc.purchaseGiftCard);
router.post('/storefront/:slug/gift-cards/check-balance', pc.checkGiftCardBalance);
router.get('/storefront/:slug/free-gifts', pc.getEligibleFreeGifts);
router.get('/storefront/:slug/bundles', pc.listStorefrontBundles);
router.get('/storefront/:slug/products/:productId/bought-together', pc.getBoughtTogether);
router.post('/storefront/:slug/subscribers', pc.subscribeEmail);

export default router;
