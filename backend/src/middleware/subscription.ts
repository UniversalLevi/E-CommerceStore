import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { IUser } from '../models/User';
import { getSubscriptionStatus, isStorePlan } from '../models/User';
import { Subscription, isStoreSubscription } from '../models/Subscription';
import { plans, PlanCode, isStorePlan as isStorePlanCode } from '../config/plans';

/**
 * Check if user has an active paid subscription (including trial)
 * IMPORTANT: Only checks for PLATFORM plans, not store plans
 */
export async function isPaidUser(user: IUser): Promise<boolean> {
  // Check if user has a platform plan (not store plan)
  if (user.plan && isStorePlanCode(user.plan)) {
    // User has a store plan, not a platform plan
    return false;
  }
  
  if (user.isLifetime) return true;
  if (user.planExpiresAt && user.planExpiresAt > new Date()) return true;
  
  // Check for trialing subscription - ONLY platform plans
  if (user.plan && !isStorePlanCode(user.plan)) {
    const subscription = await Subscription.findOne({
      userId: (user as any)._id,
      planCode: { $in: ['starter_30', 'growth_90', 'lifetime'] }, // Only platform plans
      status: { $in: ['active', 'trialing', 'manually_granted'] },
    }).lean();
    
    if (subscription && subscription.status === 'trialing') {
      // Check if trial hasn't ended
      if (subscription.trialEndsAt && subscription.trialEndsAt > new Date()) {
        return true;
      }
      // Trial has expired - user should not have access
      return false;
    }
  }
  
  // Also check Subscription model for active platform subscription
  const platformSubscription = await Subscription.findOne({
    userId: (user as any)._id,
    planCode: { $in: ['starter_30', 'growth_90', 'lifetime'] }, // Only platform plans
    status: { $in: ['active', 'trialing', 'manually_granted'] },
  }).lean();
  
  if (platformSubscription) {
    if (platformSubscription.status === 'trialing') {
      if (platformSubscription.trialEndsAt && platformSubscription.trialEndsAt > new Date()) {
        return true;
      }
      return false;
    }
    // Check expiration for active subscriptions
    if (platformSubscription.endDate && platformSubscription.endDate > new Date()) {
      return true;
    }
    if (!platformSubscription.endDate) {
      return true; // No end date means active
    }
  }
  
  return false;
}

/**
 * Get maximum products allowed for user's plan
 * IMPORTANT: Only works with PLATFORM plans, not store plans
 */
export function getMaxProducts(user: IUser): number | null {
  if (!user.plan) return null; // No plan = no access
  // Only check platform plans, not store plans
  if (isStorePlanCode(user.plan)) {
    return null; // Store plans don't have product limits for platform features
  }
  const planConfig = plans[user.plan as PlanCode];
  if (!planConfig) return null;
  return planConfig.maxProducts; // null = unlimited
}

/**
 * Check if user can add a product (including during trial)
 * IMPORTANT: Only checks PLATFORM plans, not store plans
 */
export async function canAddProduct(user: IUser): Promise<{ allowed: boolean; reason?: string; maxProducts?: number | null; productsAdded?: number }> {
  // If user only has a store plan, they cannot add platform products
  if (user.plan && isStorePlanCode(user.plan)) {
    return {
      allowed: false,
      reason: 'Platform subscription required to add products. Please upgrade to a platform plan.',
      maxProducts: null,
      productsAdded: user.productsAdded
    };
  }
  
  // Check for trialing subscription first - ONLY platform plans
  if (user.plan && !isStorePlanCode(user.plan)) {
    const subscription = await Subscription.findOne({
      userId: (user as any)._id,
      planCode: { $in: ['starter_30', 'growth_90', 'lifetime'] }, // Only platform plans
      status: { $in: ['active', 'trialing', 'manually_granted'] },
    }).lean();
    
    if (subscription && subscription.status === 'trialing') {
      // Check if trial hasn't ended
      if (subscription.trialEndsAt && subscription.trialEndsAt > new Date()) {
        // User is in trial - allow access
        const maxProducts = getMaxProducts(user);
        if (maxProducts === null) {
          return { allowed: true, maxProducts: null, productsAdded: user.productsAdded };
        }
        if (user.productsAdded >= maxProducts) {
          return { 
            allowed: false, 
            reason: `Product limit reached (${maxProducts} products). Please upgrade to add more products.`,
            maxProducts,
            productsAdded: user.productsAdded
          };
        }
        return { allowed: true, maxProducts, productsAdded: user.productsAdded };
      }
    }
  }
  
  const status = getSubscriptionStatus(user);
  if (status !== 'active') {
    return { 
      allowed: false, 
      reason: 'Platform subscription expired or inactive. Please upgrade to continue.',
      maxProducts: getMaxProducts(user),
      productsAdded: user.productsAdded
    };
  }
  
  const maxProducts = getMaxProducts(user);
  if (maxProducts === null) {
    return { allowed: true, maxProducts: null, productsAdded: user.productsAdded }; // Unlimited
  }
  
  if (user.productsAdded >= maxProducts) {
    return { 
      allowed: false, 
      reason: `Product limit reached (${maxProducts} products). Please upgrade to add more products.`,
      maxProducts,
      productsAdded: user.productsAdded
    };
  }
  
  return { allowed: true, maxProducts, productsAdded: user.productsAdded };
}

/**
 * Middleware to require active paid subscription (including trial)
 * Note: Admins are always allowed access regardless of subscription
 */
export async function requirePaidPlan(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admins always have access regardless of subscription
  if (user.role === 'admin') {
    return next();
  }

  const hasAccess = await isPaidUser(user);
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'Subscription required',
      message: 'Subscription required. Please upgrade to continue.',
    });
  }

  next();
}

/**
 * Middleware to check product limit before adding product (including during trial)
 */
export async function checkProductLimit(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admins bypass product limits
  if (user.role === 'admin') {
    return next();
  }

  const canAdd = await canAddProduct(user);
  if (!canAdd.allowed) {
    return res.status(403).json({ 
      error: canAdd.reason || 'Product limit reached',
      maxProducts: canAdd.maxProducts,
      productsAdded: canAdd.productsAdded,
    });
  }

  next();
}

/**
 * Check if user has an active store subscription
 */
export async function hasStoreSubscription(user: IUser): Promise<boolean> {
  // Check Subscription model for active store subscription
  const storeSubscription = await Subscription.findOne({
    userId: (user as any)._id,
    planCode: { $in: ['stores_basic_free', 'stores_grow', 'stores_advanced'] },
    status: { $in: ['active', 'manually_granted'] },
  }).lean();
  
  if (!storeSubscription) return false;
  
  // For free plan, always active
  if (storeSubscription.planCode === 'stores_basic_free') {
    return true;
  }
  
  // For paid plans, check expiration
  if (storeSubscription.endDate && storeSubscription.endDate > new Date()) {
    return true;
  }
  
  // Check if subscription has no end date (lifetime-like)
  if (!storeSubscription.endDate) {
    return true;
  }
  
  return false;
}

/**
 * Middleware to require active store subscription
 * Note: Admins are always allowed access regardless of subscription
 */
export async function requireStoreSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admins always have access regardless of subscription
  if (user.role === 'admin') {
    return next();
  }

  const hasAccess = await hasStoreSubscription(user);
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'Store subscription required',
      message: 'Store subscription required. Please upgrade to continue.',
    });
  }

  next();
}

