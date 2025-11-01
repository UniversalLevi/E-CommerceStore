import { Response, NextFunction } from 'express';
import { ConnectedStore } from '../models/ConnectedStore';
import { CredentialService } from '../services/CredentialService';
import { TokenRefreshService } from '../services/TokenRefreshService';
import { RateLimitService } from '../services/RateLimitService';
import { AuditLogService } from '../services/AuditLogService';
import { createError } from './errorHandler';
import { AuthRequest } from './auth';

export interface StoreContext {
  id: string;
  domain: string;
  accessToken: string;
  platform: string;
  status: string;
  webhookSecret?: string;
  hmacSecret?: string;
}

declare global {
  namespace Express {
    interface Request {
      store?: StoreContext;
    }
  }
}

/**
 * Middleware to load store context and decrypt credentials
 * Decrypts per request (no caching)
 * @param storeIdParam - Parameter name or direct store ID
 */
export const withStoreContext = (storeIdParam: string = 'storeId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      // Get store ID from params, body, or query
      const storeId = 
        req.params[storeIdParam] ||
        req.body[storeIdParam] ||
        req.query[storeIdParam];

      if (!storeId) {
        throw createError(`Store ID is required (${storeIdParam})`, 400);
      }

      // Validate user has access to this store
      const store = await ConnectedStore.findOne({
        _id: storeId,
        userId: String(req.user._id),
      });

      if (!store) {
        throw createError('Store not found or access denied', 403);
      }

      // Check store status
      if (store.status === 'revoked') {
        throw createError('Store connection has been revoked', 403);
      }

      // Check rate limit
      const withinLimit = await RateLimitService.checkLimit(storeId as string);
      if (!withinLimit) {
        throw createError('Rate limit exceeded for this store. Please try again later.', 429);
      }

      // Get valid token (with lazy refresh if needed)
      let accessToken: string;
      try {
        accessToken = await TokenRefreshService.getValidToken(
          storeId as string,
          String(req.user._id)
        );
      } catch (error: any) {
        if (error.message.includes('expired')) {
          throw createError('Store credentials have expired. Please reconnect your store.', 401);
        }
        throw error;
      }

      // Attach store context to request (temporary, cleared after response)
      req.store = {
        id: String(store._id),
        domain: store.storeDomain,
        accessToken,
        platform: store.platform,
        status: store.status,
        webhookSecret: store.webhookSecret,
        hmacSecret: store.hmacSecret,
      };

      // Log credential access
      await AuditLogService.log({
        storeId: String(store._id),
        userId: String(req.user._id),
        action: 'accessed',
        metadata: {
          endpoint: req.path,
          method: req.method,
        },
        req,
      });

      // Update last activity
      store.lastActivityAt = new Date();
      await store.save();

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional store context - doesn't fail if store not provided
 * Used for endpoints that can work with or without store context
 */
export const withOptionalStoreContext = (storeIdParam: string = 'storeId') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next();
      }

      const storeId = 
        req.params[storeIdParam] ||
        req.body[storeIdParam] ||
        req.query[storeIdParam];

      if (!storeId) {
        return next();
      }

      // Try to load store context but don't fail if it doesn't exist
      const store = await ConnectedStore.findOne({
        _id: storeId,
        userId: String(req.user._id),
      });

      if (store && store.status === 'connected') {
        try {
          const accessToken = await TokenRefreshService.getValidToken(
            storeId as string,
            String(req.user._id)
          );

          req.store = {
            id: String(store._id),
            domain: store.storeDomain,
            accessToken,
            platform: store.platform,
            status: store.status,
          };
        } catch (error) {
          // Silently fail - store context is optional
          console.warn(`Failed to load optional store context: ${error}`);
        }
      }

      next();
    } catch (error) {
      // Don't fail for optional context
      next();
    }
  };
};

