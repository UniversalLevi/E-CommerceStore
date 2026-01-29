import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { IUser } from '../models/User';
import { getSubscriptionStatus } from '../models/User';
import { Subscription } from '../models/Subscription';
import { plans, PlanCode } from '../config/plans';

/**
 * Check if user has an active paid subscription (including trial)
 */
export async function isPaidUser(user: IUser): Promise<boolean> {
  if (user.isLifetime) return true;
  if (user.planExpiresAt && user.planExpiresAt > new Date()) return true;
  
  // Check for trialing subscription
  if (user.plan) {
    const subscription = await Subscription.findOne({
      userId: (user as any)._id,
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
  
  return false;
}

/**
 * Get maximum products allowed for user's plan
 */
export function getMaxProducts(user: IUser): number | null {
  if (!user.plan) return null; // No plan = no access
  const planConfig = plans[user.plan as PlanCode];
  if (!planConfig) return null;
  return planConfig.maxProducts; // null = unlimited
}

/**
 * Check if user can add a product (including during trial)
 */
export async function canAddProduct(user: IUser): Promise<{ allowed: boolean; reason?: string; maxProducts?: number | null; productsAdded?: number }> {
  // Check for trialing subscription first
  if (user.plan) {
    const subscription = await Subscription.findOne({
      userId: (user as any)._id,
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
      reason: 'Subscription expired or inactive. Please upgrade to continue.',
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

