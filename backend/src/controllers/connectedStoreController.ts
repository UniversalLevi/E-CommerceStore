import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { ConnectedStore } from '../models/ConnectedStore';
import { User } from '../models/User';
import { CredentialService } from '../services/CredentialService';
import { AuditLogService } from '../services/AuditLogService';
import { TokenRefreshService } from '../services/TokenRefreshService';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';

// In-memory state store for OAuth (in production, use Redis or database)
const oauthStates = new Map<string, { userId: string; timestamp: number }>();

// Clean up expired states every 10 minutes
setInterval(() => {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [state, data] of oauthStates.entries()) {
    if (data.timestamp < tenMinutesAgo) {
      oauthStates.delete(state);
    }
  }
}, 10 * 60 * 1000);

/**
 * Initiate Shopify OAuth flow
 */
export const initiateShopifyOAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      throw createError('Shop parameter is required', 400);
    }

    // Validate shop format
    const shopDomain = shop.endsWith('.myshopify.com') 
      ? shop 
      : `${shop}.myshopify.com`;

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store state with user ID (expires in 10 minutes)
    oauthStates.set(state, {
      userId: String(req.user._id),
      timestamp: Date.now(),
    });

    // Build OAuth authorization URL
    const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
    authUrl.searchParams.append('client_id', config.shopify.apiKey);
    authUrl.searchParams.append('scope', config.shopify.scopes);
    authUrl.searchParams.append('redirect_uri', config.shopify.redirectUri);
    authUrl.searchParams.append('state', state);

    res.status(200).json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Shopify OAuth callback
 */
export const handleShopifyCallback = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, shop, state } = req.query;

    if (!code || !shop || !state) {
      throw createError('Invalid callback parameters', 400);
    }

    // Verify state
    const stateData = oauthStates.get(state as string);
    if (!stateData) {
      throw createError('Invalid or expired state', 400);
    }

    // Remove used state
    oauthStates.delete(state as string);

    const userId = stateData.userId;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: config.shopify.apiKey,
        client_secret: config.shopify.apiSecret,
        code,
      }
    );

    const { access_token, scope } = tokenResponse.data;

    // Encrypt the access token
    const encryptedToken = CredentialService.encrypt(access_token);

    // Generate secrets for webhooks
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    const hmacSecret = config.shopify.apiSecret;

    // Check if store already exists
    const existingStore = await ConnectedStore.findOne({
      userId,
      storeDomain: shop as string,
      platform: 'shopify',
    });

    let store;

    if (existingStore) {
      // Update existing store
      existingStore.encryptedCredentials = encryptedToken;
      existingStore.oauthMetadata.scopes = (scope as string).split(',');
      existingStore.webhookSecret = webhookSecret;
      existingStore.hmacSecret = hmacSecret;
      existingStore.status = 'connected';
      existingStore.lastActivityAt = new Date();
      existingStore.tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      await existingStore.save();
      store = existingStore;

      await AuditLogService.log({
        storeId: String(store._id),
        userId,
        action: 'reconnected',
        req,
      });
    } else {
      // Create new store
      store = await ConnectedStore.create({
        userId,
        storeName: (shop as string).replace('.myshopify.com', ''),
        platform: 'shopify',
        storeDomain: shop,
        encryptedCredentials: encryptedToken,
        encryptionVersion: 1,
        oauthMetadata: {
          scopes: (scope as string).split(','),
          tokenType: 'bearer',
        },
        webhookSecret,
        hmacSecret,
        status: 'connected',
        lastActivityAt: new Date(),
        tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      // Add to user's connected stores
      await User.findByIdAndUpdate(userId, {
        $addToSet: { connectedStores: store._id },
      });

      await AuditLogService.log({
        storeId: String(store._id),
        userId,
        action: 'connected',
        req,
      });
    }

    // Register webhooks with Shopify
    await registerWebhooks(shop as string, access_token, webhookSecret);

    // Redirect to frontend dashboard
    res.redirect(`${config.corsOrigin}/dashboard?shopify=connected&store=${store._id}`);
  } catch (error: any) {
    console.error('Shopify OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${config.corsOrigin}/dashboard?shopify=error`);
  }
};

/**
 * Manual credential entry
 */
export const addManualCredentials = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeName, storeDomain, accessToken, platform } = req.body;

    if (!storeName || !storeDomain || !accessToken) {
      throw createError('Store name, domain, and access token are required', 400);
    }

    // Validate credentials by making test API call
    try {
      await axios.get(
        `https://${storeDomain}/admin/api/2024-01/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );
    } catch (error) {
      throw createError('Invalid credentials or unable to connect to store', 400);
    }

    // Encrypt token
    const encryptedToken = CredentialService.encrypt(accessToken);
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create store
    const store = await ConnectedStore.create({
      userId: req.user._id,
      storeName,
      platform: platform || 'shopify',
      storeDomain,
      encryptedCredentials: encryptedToken,
      encryptionVersion: 1,
      oauthMetadata: {
        scopes: [],
        tokenType: 'manual',
      },
      webhookSecret,
      hmacSecret: config.shopify.apiSecret,
      status: 'connected',
      platformMetadata: { manualEntry: true },
      lastActivityAt: new Date(),
    });

    // Add to user's connected stores
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { connectedStores: store._id },
    });

    await AuditLogService.log({
      storeId: String(store._id),
      userId: String(req.user._id),
      action: 'connected',
      metadata: { type: 'manual' },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Store connected successfully',
      data: {
        storeId: store._id,
        storeName: store.storeName,
        storeDomain: store.storeDomain,
        status: store.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all connected stores for user
 */
export const getUserStores = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const stores = await ConnectedStore.find({ userId: req.user._id })
      .select('-encryptedCredentials -webhookSecret -hmacSecret')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single store status
 */
export const getStoreStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId } = req.params;

    const store = await ConnectedStore.findOne({
      _id: storeId,
      userId: req.user._id,
    }).select('-encryptedCredentials -webhookSecret -hmacSecret');

    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check if token is still valid
    const isValid = await TokenRefreshService.validateToken(storeId);

    res.status(200).json({
      success: true,
      data: {
        ...store.toObject(),
        isTokenValid: isValid,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect store
 */
export const disconnectStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId } = req.params;

    const store = await ConnectedStore.findOne({
      _id: storeId,
      userId: req.user._id,
    });

    if (!store) {
      throw createError('Store not found', 404);
    }

    // Update status to revoked
    store.status = 'revoked';
    await store.save();

    // Remove from user's connected stores
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { connectedStores: store._id },
    });

    await AuditLogService.log({
      storeId: String(store._id),
      userId: String(req.user._id),
      action: 'disconnected',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Store disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Register webhooks with Shopify
 */
async function registerWebhooks(shop: string, accessToken: string, webhookSecret: string) {
  const webhooks = [
    { topic: 'orders/create', address: `${process.env.BACKEND_URL || config.corsOrigin}/api/webhooks/shopify/orders` },
    { topic: 'products/update', address: `${process.env.BACKEND_URL || config.corsOrigin}/api/webhooks/shopify/products` },
  ];

  for (const webhook of webhooks) {
    try {
      await axios.post(
        `https://${shop}/admin/api/2024-01/webhooks.json`,
        {
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json',
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Registered webhook: ${webhook.topic} for ${shop}`);
    } catch (error: any) {
      console.error(`Failed to register webhook ${webhook.topic}:`, error.response?.data || error.message);
    }
  }
}

