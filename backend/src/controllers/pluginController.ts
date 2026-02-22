import { Request, Response, NextFunction } from 'express';
import { Plugin } from '../models/Plugin';
import { StorePluginConfig } from '../models/StorePluginConfig';
import { Coupon } from '../models/Coupon';
import { GiftCard } from '../models/GiftCard';
import { FreeGiftRule } from '../models/FreeGiftRule';
import { ProductBundle } from '../models/ProductBundle';
import { EmailSubscriber } from '../models/EmailSubscriber';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { createError } from '../middleware/errorHandler';
import crypto from 'crypto';

// ─── Plugin Registry ────────────────────────────────────────────────

export const listPlugins = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const plugins = await Plugin.find().sort({ category: 1, name: 1 });
    res.json({ success: true, data: plugins });
  } catch (err) { next(err); }
};

export const togglePlugin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plugin = await Plugin.findOne({ slug: req.params.slug });
    if (!plugin) throw createError('Plugin not found', 404);
    plugin.isActive = !plugin.isActive;
    await plugin.save();
    res.json({ success: true, data: plugin });
  } catch (err) { next(err); }
};

// ─── Store Plugin Configs ───────────────────────────────────────────

export const getStorePlugins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const activePlugins = await Plugin.find({ isActive: true });
    const configs = await StorePluginConfig.find({ storeId });

    const configMap = new Map(configs.map(c => [c.pluginSlug, c]));
    const result = activePlugins.map(p => ({
      ...p.toObject(),
      storeConfig: configMap.get(p.slug) || null,
    }));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const updateStorePluginConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: storeId, pluginSlug } = req.params;
    const plugin = await Plugin.findOne({ slug: pluginSlug, isActive: true });
    if (!plugin) throw createError('Plugin not found or inactive', 404);

    const config = await StorePluginConfig.findOneAndUpdate(
      { storeId, pluginSlug },
      { storeId, pluginSlug, config: req.body.config || {}, isConfigured: true },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
};

export const getStorefrontPlugins = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const activePlugins = await Plugin.find({ isActive: true }).select('slug name');
    const slugs = activePlugins.map(p => p.slug);
    const configs = await StorePluginConfig.find({
      storeId: store._id,
      pluginSlug: { $in: slugs },
      isConfigured: true,
    });

    const result: Record<string, any> = {};
    for (const c of configs) {
      result[c.pluginSlug] = c.config;
    }

    // Also include partial COD settings from store
    const partialCod = store.settings?.partialCod;
    if (partialCod?.enabled) {
      result['partial-cod'] = partialCod;
    }

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ─── Coupons ────────────────────────────────────────────────────────

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { code, type, value, minOrderValue, maxDiscount, usageLimit, expiresAt } = req.body;
    if (!code || !type || value === undefined) throw createError('code, type, and value are required', 400);

    const existing = await Coupon.findOne({ storeId, code: code.toUpperCase() });
    if (existing) throw createError('Coupon code already exists', 409);

    const coupon = await Coupon.create({
      storeId, code: code.toUpperCase(), type, value,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit: usageLimit || 0,
      expiresAt: expiresAt || undefined,
    });
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

export const listCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await Coupon.find({ storeId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.couponId, storeId: req.params.id },
      req.body,
      { new: true }
    );
    if (!coupon) throw createError('Coupon not found', 404);
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await Coupon.findOneAndDelete({ _id: req.params.couponId, storeId: req.params.id });
    if (!result) throw createError('Coupon not found', 404);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (err) { next(err); }
};

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { code, orderSubtotal } = req.body;
    if (!code) throw createError('Coupon code is required', 400);

    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const coupon = await Coupon.findOne({ storeId: store._id, code: code.toUpperCase(), isActive: true });
    if (!coupon) throw createError('Invalid coupon code', 400);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw createError('Coupon has expired', 400);
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) throw createError('Coupon usage limit reached', 400);
    if (coupon.minOrderValue > 0 && orderSubtotal < coupon.minOrderValue) {
      throw createError(`Minimum order value of ${coupon.minOrderValue / 100} required`, 400);
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((orderSubtotal * coupon.value) / 100);
      if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = Math.min(coupon.value, orderSubtotal);
    }

    res.json({ success: true, data: { code: coupon.code, type: coupon.type, value: coupon.value, discount } });
  } catch (err) { next(err); }
};

// ─── Gift Cards ─────────────────────────────────────────────────────

function generateGiftCode(): string {
  return 'GC-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}

export const createGiftCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { initialBalance, recipientEmail, recipientName, message, expiresAt } = req.body;
    if (!initialBalance || initialBalance <= 0) throw createError('initialBalance is required and must be > 0', 400);

    const store = await Store.findById(storeId);
    if (!store) throw createError('Store not found', 404);

    const gc = await GiftCard.create({
      storeId, code: generateGiftCode(), initialBalance, currentBalance: initialBalance,
      currency: store.currency, recipientEmail, recipientName, message,
      expiresAt: expiresAt || undefined, createdBy: 'store_owner',
    });
    res.status(201).json({ success: true, data: gc });
  } catch (err) { next(err); }
};

export const listGiftCards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gcs = await GiftCard.find({ storeId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: gcs });
  } catch (err) { next(err); }
};

export const deleteGiftCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await GiftCard.findOneAndDelete({ _id: req.params.giftCardId, storeId: req.params.id });
    if (!result) throw createError('Gift card not found', 404);
    res.json({ success: true, message: 'Gift card deleted' });
  } catch (err) { next(err); }
};

export const purchaseGiftCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { amount, purchaserEmail, recipientEmail, recipientName, message } = req.body;
    if (!amount || amount <= 0) throw createError('Amount must be > 0', 400);
    if (!purchaserEmail) throw createError('Purchaser email is required', 400);

    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const gc = await GiftCard.create({
      storeId: store._id, code: generateGiftCode(), initialBalance: amount, currentBalance: amount,
      currency: store.currency, purchaserEmail, recipientEmail, recipientName, message,
      createdBy: 'customer_purchase',
    });
    res.status(201).json({ success: true, data: { code: gc.code, balance: gc.currentBalance } });
  } catch (err) { next(err); }
};

export const checkGiftCardBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { code } = req.body;
    if (!code) throw createError('Gift card code is required', 400);

    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const gc = await GiftCard.findOne({ storeId: store._id, code: code.toUpperCase(), isActive: true });
    if (!gc) throw createError('Gift card not found', 404);
    if (gc.expiresAt && gc.expiresAt < new Date()) throw createError('Gift card has expired', 400);

    res.json({ success: true, data: { code: gc.code, balance: gc.currentBalance, currency: gc.currency } });
  } catch (err) { next(err); }
};

// ─── Free Gift Rules ────────────────────────────────────────────────

export const createFreeGiftRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { minOrderValue, giftProductId, maxClaims } = req.body;
    if (!minOrderValue || !giftProductId) throw createError('minOrderValue and giftProductId are required', 400);

    const product = await StoreProduct.findOne({ _id: giftProductId, storeId });
    if (!product) throw createError('Gift product not found in this store', 404);

    const rule = await FreeGiftRule.create({
      storeId, minOrderValue, giftProductId,
      giftProductTitle: product.title,
      giftProductImage: product.images?.[0],
      maxClaims: maxClaims || 0,
    });
    res.status(201).json({ success: true, data: rule });
  } catch (err) { next(err); }
};

export const listFreeGiftRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await FreeGiftRule.find({ storeId: req.params.id }).sort({ minOrderValue: 1 });
    res.json({ success: true, data: rules });
  } catch (err) { next(err); }
};

export const updateFreeGiftRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await FreeGiftRule.findOneAndUpdate(
      { _id: req.params.ruleId, storeId: req.params.id },
      req.body,
      { new: true }
    );
    if (!rule) throw createError('Rule not found', 404);
    res.json({ success: true, data: rule });
  } catch (err) { next(err); }
};

export const deleteFreeGiftRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await FreeGiftRule.findOneAndDelete({ _id: req.params.ruleId, storeId: req.params.id });
    if (!result) throw createError('Rule not found', 404);
    res.json({ success: true, message: 'Free gift rule deleted' });
  } catch (err) { next(err); }
};

export const getEligibleFreeGifts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const orderValue = parseInt(req.query.orderValue as string, 10) || 0;

    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const rules = await FreeGiftRule.find({
      storeId: store._id,
      isActive: true,
      minOrderValue: { $lte: orderValue },
      $or: [{ maxClaims: 0 }, { $expr: { $lt: ['$claimedCount', '$maxClaims'] } }],
    }).sort({ minOrderValue: -1 });

    res.json({ success: true, data: rules });
  } catch (err) { next(err); }
};

// ─── Product Bundles ────────────────────────────────────────────────

export const createBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const storeId = req.params.id;
    const { title, description, image, products, bundlePrice } = req.body;
    if (!title || !products || products.length < 2 || bundlePrice === undefined) {
      throw createError('title, at least 2 products, and bundlePrice are required', 400);
    }

    let originalPrice = 0;
    for (const item of products) {
      const sp = await StoreProduct.findOne({ _id: item.productId, storeId });
      if (!sp) throw createError(`Product ${item.productId} not found`, 404);
      const variantPrice = item.variantName
        ? sp.variants.find(v => v.name === item.variantName)?.price || sp.basePrice
        : sp.basePrice;
      originalPrice += variantPrice * (item.quantity || 1);
    }

    const bundle = await ProductBundle.create({
      storeId, title, description, image, products, bundlePrice, originalPrice,
    });
    res.status(201).json({ success: true, data: bundle });
  } catch (err) { next(err); }
};

export const listBundles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundles = await ProductBundle.find({ storeId: req.params.id }).sort({ displayOrder: 1 });
    res.json({ success: true, data: bundles });
  } catch (err) { next(err); }
};

export const updateBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundle = await ProductBundle.findOneAndUpdate(
      { _id: req.params.bundleId, storeId: req.params.id },
      req.body,
      { new: true }
    );
    if (!bundle) throw createError('Bundle not found', 404);
    res.json({ success: true, data: bundle });
  } catch (err) { next(err); }
};

export const deleteBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await ProductBundle.findOneAndDelete({ _id: req.params.bundleId, storeId: req.params.id });
    if (!result) throw createError('Bundle not found', 404);
    res.json({ success: true, message: 'Bundle deleted' });
  } catch (err) { next(err); }
};

export const listStorefrontBundles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const bundles = await ProductBundle.find({ storeId: store._id, isActive: true })
      .sort({ displayOrder: 1 })
      .populate('products.productId', 'title images basePrice');
    res.json({ success: true, data: bundles });
  } catch (err) { next(err); }
};

export const getBoughtTogether = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug, productId } = req.params;
    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    const product = await StoreProduct.findOne({ _id: productId, storeId: store._id, status: 'active' });
    if (!product) throw createError('Product not found', 404);

    if (!product.boughtTogetherIds || product.boughtTogetherIds.length === 0) {
      return res.json({ success: true, data: { products: [], discount: 0 } });
    }

    const related = await StoreProduct.find({
      _id: { $in: product.boughtTogetherIds },
      storeId: store._id,
      status: 'active',
    }).select('title images basePrice variants');

    res.json({
      success: true,
      data: { products: related, discount: product.boughtTogetherDiscount || 0 },
    });
  } catch (err) { next(err); }
};

// ─── Email Subscribers ──────────────────────────────────────────────

export const subscribeEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { email, name } = req.body;
    if (!email) throw createError('Email is required', 400);

    const store = await Store.findOne({ slug: slug.toLowerCase(), status: 'active' });
    if (!store) throw createError('Store not found', 404);

    await EmailSubscriber.findOneAndUpdate(
      { storeId: store._id, email: email.toLowerCase() },
      { storeId: store._id, email: email.toLowerCase(), name, source: 'popup', subscribedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Subscribed successfully' });
  } catch (err) { next(err); }
};

export const listSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await EmailSubscriber.find({ storeId: req.params.id }).sort({ subscribedAt: -1 });
    res.json({ success: true, data: subs });
  } catch (err) { next(err); }
};

export const exportSubscribers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subs = await EmailSubscriber.find({ storeId: req.params.id }).sort({ subscribedAt: -1 });
    const csv = ['Email,Name,Source,Subscribed At']
      .concat(subs.map(s => `${s.email},${s.name || ''},${s.source},${s.subscribedAt.toISOString()}`))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csv);
  } catch (err) { next(err); }
};
