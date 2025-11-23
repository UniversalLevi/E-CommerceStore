import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { encrypt, decrypt } from '../utils/encryption';
import { validateShopifyCredentials, normalizeShopDomain } from '../utils/shopify';
import { createError } from '../middleware/errorHandler';
import { config } from '../config/env';
import { createNotification } from '../utils/notifications';

/**
 * Create a new store connection
 * POST /api/stores
 */
export const createStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const {
      storeName,
      shopDomain,
      accessToken,
      apiKey,
      apiSecret,
      environment = 'production',
      isDefault = false,
    } = req.body;

    // Normalize shop domain
    const normalizedDomain = normalizeShopDomain(shopDomain);

    // Check if store already exists for this user (use lean for faster query)
    const existingStore = await StoreConnection.findOne({
      owner: (req.user as any)._id,
      shopDomain: normalizedDomain,
    }).lean();

    if (existingStore) {
      throw createError(
        'A store with this domain is already connected to your account',
        400
      );
    }

    // Validate credentials with Shopify API
    const validation = await validateShopifyCredentials(
      normalizedDomain,
      accessToken
    );

    if (!validation.ok) {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'CREATE_STORE',
        success: false,
        errorMessage: validation.error || 'Failed to validate credentials',
        details: { shopDomain: normalizedDomain },
        ipAddress: req.ip,
      });

      throw createError(
        `Shopify validation failed: ${validation.error}`,
        400
      );
    }

    // Encrypt sensitive fields
    const encryptedAccessToken = encrypt(accessToken);
    const encryptedApiKey = apiKey ? encrypt(apiKey) : undefined;
    const encryptedApiSecret = apiSecret ? encrypt(apiSecret) : undefined;

    // Auto-populate scopes from env
    const scopes = config.shopify.scopes.split(',').map((s: string) => s.trim());

    // If this should be default, unset other defaults
    if (isDefault) {
      await StoreConnection.updateMany(
        { owner: (req.user as any)._id, isDefault: true },
        { isDefault: false }
      );
    }

    // Create store connection
    const store = await StoreConnection.create({
      owner: (req.user as any)._id,
      storeName,
      shopDomain: normalizedDomain,
      accessToken: encryptedAccessToken,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      scopes,
      environment,
      isDefault,
      status: 'active',
      lastTestedAt: new Date(),
      lastTestResult: 'success',
      metadata: {
        shopInfo: validation.shop,
      },
    });

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'CREATE_STORE',
      success: true,
      details: {
        storeName,
        shopDomain: normalizedDomain,
        environment,
        shopName: validation.shop?.name,
      },
      ipAddress: req.ip,
    });

    // Create notification
    await createNotification({
      userId: (req.user as any)._id,
      type: 'store_connection',
      title: 'Store Connected Successfully',
      message: `Your Shopify store "${storeName}" has been connected successfully. You can now start adding products!`,
      link: `/dashboard/stores/${(store as any)._id}`,
      metadata: {
        storeId: (store as any)._id.toString(),
        storeName,
        shopDomain: normalizedDomain,
      },
    });

    // Return store info (without sensitive data)
    res.status(201).json({
      success: true,
      message: 'Store connected successfully',
      data: {
        id: store._id,
        storeName: store.storeName,
        shopDomain: store.shopDomain,
        environment: store.environment,
        isDefault: store.isDefault,
        status: store.status,
        shopInfo: validation.shop,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List user's store connections
 * GET /api/stores
 */
export const listStoreConnections = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Admin can view all stores, users see only their own
    const query: any = req.user.role === 'admin'
      ? {}
      : { owner: (req.user as any)._id };

    // Optional filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const stores = await StoreConnection.find(query)
      .populate('owner', 'email role')
      .select('-accessToken -apiKey -apiSecret') // Never return encrypted credentials
      .sort({ isDefault: -1, createdAt: -1 })
      .lean(); // Use lean for better performance

    res.json({
      success: true,
      count: stores.length,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single store connection
 * GET /api/stores/:id
 */
export const getStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.storeDoc) {
      throw createError('Store not found', 404);
    }

    const store = req.storeDoc;
    const { User } = await import('../models/User');

    // Get store URL
    const cleanShop = store.shopDomain.replace('.myshopify.com', '');
    const storeUrl = `https://${cleanShop}.myshopify.com`;

    // Count products added to this store
    const user = await User.findById(store.owner).lean();
    const productsInStore = user?.stores?.filter(
      (s: any) => s.storeUrl === storeUrl
    ) || [];
    const productCount = productsInStore.length;

    // Get recent activity from audit logs
    const { AuditLog } = await import('../models/AuditLog');
    const recentActivity = await AuditLog.find({
      storeId: store._id,
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action success timestamp details')
      .lean();

    // Return store info without decrypted credentials
    res.json({
      success: true,
      data: {
        id: store._id,
        storeName: store.storeName,
        shopDomain: store.shopDomain,
        storeUrl,
        environment: store.environment,
        apiVersion: store.apiVersion,
        isDefault: store.isDefault,
        status: store.status,
        lastTestedAt: store.lastTestedAt,
        lastTestResult: store.lastTestResult,
        scopes: store.scopes,
        metadata: store.metadata,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
        owner: store.owner,
        stats: {
          productCount,
        },
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update store connection
 * PUT /api/stores/:id
 */
export const updateStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (!req.storeDoc) {
      throw createError('Store not found', 404);
    }

    const store = req.storeDoc;
    const {
      storeName,
      accessToken,
      apiKey,
      apiSecret,
      environment,
      isDefault,
    } = req.body;

    let credentialsChanged = false;

    // Update fields
    if (storeName) store.storeName = storeName;
    if (environment) store.environment = environment;

    // If access token changed, validate and re-encrypt
    if (accessToken) {
      const validation = await validateShopifyCredentials(
        store.shopDomain,
        accessToken
      );

      if (!validation.ok) {
        await AuditLog.create({
          userId: (req.user as any)._id,
          storeId: store._id,
          action: 'UPDATE_STORE',
          success: false,
          errorMessage: validation.error || 'Failed to validate new credentials',
          ipAddress: req.ip,
        });

        throw createError(
          `Shopify validation failed: ${validation.error}`,
          400
        );
      }

      store.accessToken = encrypt(accessToken);
      store.status = 'active';
      store.lastTestedAt = new Date();
      store.lastTestResult = 'success';
      credentialsChanged = true;
    }

    // Update optional encrypted fields
    if (apiKey !== undefined) {
      store.apiKey = apiKey ? encrypt(apiKey) : undefined;
      credentialsChanged = true;
    }

    if (apiSecret !== undefined) {
      store.apiSecret = apiSecret ? encrypt(apiSecret) : undefined;
      credentialsChanged = true;
    }

    // Handle default status
    if (isDefault === true && !store.isDefault) {
      // Unset other defaults for this user
      await StoreConnection.updateMany(
        { owner: (req.user as any)._id, isDefault: true, _id: { $ne: store._id } },
        { isDefault: false }
      );
      store.isDefault = true;
    } else if (isDefault === false && store.isDefault) {
      store.isDefault = false;
    }

    await store.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'UPDATE_STORE',
      success: true,
      details: {
        credentialsChanged,
        fieldsUpdated: Object.keys(req.body),
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Store updated successfully',
      data: {
        id: store._id,
        storeName: store.storeName,
        shopDomain: store.shopDomain,
        environment: store.environment,
        isDefault: store.isDefault,
        status: store.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete store connection
 * DELETE /api/stores/:id
 */
export const deleteStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (!req.storeDoc) {
      throw createError('Store not found', 404);
    }

    const store = req.storeDoc;
    const wasDefault = store.isDefault;
    const storeName = store.storeName;

    // Delete the store
    await StoreConnection.findByIdAndDelete(store._id);

    // If it was default, set another store as default if exists
    let newDefaultStore = null;
    if (wasDefault) {
      const otherStore = await StoreConnection.findOne({
        owner: (req.user as any)._id,
        _id: { $ne: store._id },
      }).sort({ createdAt: -1 });

      if (otherStore) {
        otherStore.isDefault = true;
        await otherStore.save();
        newDefaultStore = otherStore.storeName;
      }
    }

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'DELETE_STORE',
      success: true,
      details: {
        storeName,
        shopDomain: store.shopDomain,
        wasDefault,
        newDefaultStore,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: wasDefault && newDefaultStore
        ? `Store deleted. ${newDefaultStore} is now your default store.`
        : 'Store deleted successfully',
      data: {
        deletedStore: storeName,
        newDefaultStore,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test store connection
 * POST /api/stores/:id/test
 */
export const testStoreConnection = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (!req.storeDoc) {
      throw createError('Store not found', 404);
    }

    const store = req.storeDoc;

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);

    // Test with Shopify API
    const validation = await validateShopifyCredentials(
      store.shopDomain,
      accessToken,
      store.apiVersion
    );

    // Update store status
    store.lastTestedAt = new Date();

    if (validation.ok) {
      store.status = 'active';
      store.lastTestResult = 'success';
      store.metadata = {
        ...store.metadata,
        shopInfo: validation.shop,
      };
    } else {
      store.status = 'invalid';
      store.lastTestResult = validation.error || 'validation failed';
    }

    await store.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'TEST_STORE',
      success: validation.ok,
      errorMessage: validation.ok ? undefined : validation.error,
      details: {
        shopDomain: store.shopDomain,
        statusCode: validation.statusCode,
      },
      ipAddress: req.ip,
    });

    // Create notification if test failed
    if (!validation.ok) {
      await createNotification({
        userId: (req.user as any)._id,
        type: 'store_test',
        title: 'Store Connection Test Failed',
        message: `Connection test failed for "${store.storeName}": ${validation.error || 'Unknown error'}. Please check your credentials.`,
        link: `/dashboard/stores/${(store as any)._id}`,
        metadata: {
          storeId: (store as any)._id.toString(),
          storeName: store.storeName,
          error: validation.error,
        },
      });
    }

    res.json({
      success: true,
      valid: validation.ok,
      message: validation.ok
        ? 'Store connection is valid'
        : `Connection test failed: ${validation.error}`,
      data: validation.ok ? {
        status: 'active',
        shopInfo: validation.shop,
        lastTested: store.lastTestedAt,
      } : {
        status: 'invalid',
        error: validation.error,
        lastTested: store.lastTestedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set store as default
 * PUT /api/stores/:id/default
 */
export const setDefaultStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (!req.storeDoc) {
      throw createError('Store not found', 404);
    }

    const store = req.storeDoc;

    // Unset all other defaults for this user
    await StoreConnection.updateMany(
      { owner: (req.user as any)._id, isDefault: true, _id: { $ne: store._id } },
      { isDefault: false }
    );

    // Set this store as default
    store.isDefault = true;
    await store.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'SET_DEFAULT_STORE',
      success: true,
      details: {
        storeName: store.storeName,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `${store.storeName} is now your default store`,
      data: {
        id: store._id,
        storeName: store.storeName,
        isDefault: true,
      },
    });
  } catch (error) {
    next(error);
  }
};



