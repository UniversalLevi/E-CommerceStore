import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ConnectedStore } from '../models/ConnectedStore';
import { AuditLogService } from '../services/AuditLogService';
import { createError } from '../middleware/errorHandler';

/**
 * Verify Shopify webhook signature
 */
function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');
    
    return hash === hmacHeader;
  } catch (error) {
    return false;
  }
}

/**
 * Handle Shopify order webhooks
 */
export const handleOrderWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const hmacHeader = req.get('X-Shopify-Hmac-SHA256');

    if (!shopDomain || !hmacHeader) {
      throw createError('Invalid webhook headers', 400);
    }

    // Find the store by domain
    const store = await ConnectedStore.findOne({ storeDomain: shopDomain });

    if (!store) {
      console.warn(`Webhook received for unknown store: ${shopDomain}`);
      return res.status(404).json({ error: 'Store not found' });
    }

    // Verify webhook signature
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyShopifyWebhook(rawBody, hmacHeader, store.hmacSecret || '');

    if (!isValid) {
      console.error(`Invalid webhook signature for store: ${shopDomain}`);
      await AuditLogService.log({
        storeId: String(store._id),
        userId: String(store.userId),
        action: 'webhook_failed',
        metadata: {
          reason: 'Invalid signature',
          topic: 'orders/create',
        },
      });
      
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the webhook payload
    const orderData = req.body;
    
    console.log(`Order webhook received for store ${shopDomain}:`, {
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      totalPrice: orderData.total_price,
      customerEmail: orderData.email,
    });

    // Log successful webhook
    await AuditLogService.log({
      storeId: String(store._id),
      userId: String(store.userId),
      action: 'webhook_received',
      metadata: {
        topic: 'orders/create',
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        totalPrice: orderData.total_price,
      },
    });

    // Update store's last activity
    store.lastActivityAt = new Date();
    await store.save();

    // TODO: Process order data (send email notification, update analytics, etc.)

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing order webhook:', error);
    next(error);
  }
};

/**
 * Handle Shopify product update webhooks
 */
export const handleProductUpdateWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const hmacHeader = req.get('X-Shopify-Hmac-SHA256');

    if (!shopDomain || !hmacHeader) {
      throw createError('Invalid webhook headers', 400);
    }

    // Find the store by domain
    const store = await ConnectedStore.findOne({ storeDomain: shopDomain });

    if (!store) {
      console.warn(`Webhook received for unknown store: ${shopDomain}`);
      return res.status(404).json({ error: 'Store not found' });
    }

    // Verify webhook signature
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyShopifyWebhook(rawBody, hmacHeader, store.hmacSecret || '');

    if (!isValid) {
      console.error(`Invalid webhook signature for store: ${shopDomain}`);
      await AuditLogService.log({
        storeId: String(store._id),
        userId: String(store.userId),
        action: 'webhook_failed',
        metadata: {
          reason: 'Invalid signature',
          topic: 'products/update',
        },
      });
      
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process the webhook payload
    const productData = req.body;
    
    console.log(`Product update webhook received for store ${shopDomain}:`, {
      productId: productData.id,
      title: productData.title,
      status: productData.status,
    });

    // Log successful webhook
    await AuditLogService.log({
      storeId: String(store._id),
      userId: String(store.userId),
      action: 'webhook_received',
      metadata: {
        topic: 'products/update',
        productId: productData.id,
        title: productData.title,
      },
    });

    // Update store's last activity
    store.lastActivityAt = new Date();
    await store.save();

    // TODO: Process product update (sync with local database, etc.)

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing product update webhook:', error);
    next(error);
  }
};

/**
 * Handle generic Shopify webhooks
 */
export const handleGenericWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopDomain = req.get('X-Shopify-Shop-Domain');
    const topic = req.get('X-Shopify-Topic');
    const hmacHeader = req.get('X-Shopify-Hmac-SHA256');

    console.log(`Generic webhook received: ${topic} from ${shopDomain}`);

    if (!shopDomain || !hmacHeader) {
      throw createError('Invalid webhook headers', 400);
    }

    // Find the store by domain
    const store = await ConnectedStore.findOne({ storeDomain: shopDomain });

    if (!store) {
      console.warn(`Webhook received for unknown store: ${shopDomain}`);
      return res.status(404).json({ error: 'Store not found' });
    }

    // Verify webhook signature
    const rawBody = JSON.stringify(req.body);
    const isValid = verifyShopifyWebhook(rawBody, hmacHeader, store.hmacSecret || '');

    if (!isValid) {
      console.error(`Invalid webhook signature for store: ${shopDomain}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Log webhook receipt
    await AuditLogService.log({
      storeId: String(store._id),
      userId: String(store.userId),
      action: 'webhook_received',
      metadata: {
        topic,
        data: req.body,
      },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    next(error);
  }
};

