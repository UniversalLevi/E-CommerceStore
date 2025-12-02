import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { IUser } from '../models/User';
import { getSubscriptionStatus } from '../models/User';
import { plans, PlanCode } from '../config/plans';

/**
 * Check if user has an active paid subscription
 */
export function isPaidUser(user: IUser): boolean {
  if (user.isLifetime) return true;
  if (user.planExpiresAt && user.planExpiresAt > new Date()) return true;
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
 * Check if user can add a product
 */
export function canAddProduct(user: IUser): { allowed: boolean; reason?: string; maxProducts?: number | null; productsAdded?: number } {
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
 * Middleware to require active paid subscription
 * Note: Admins are always allowed access regardless of subscription
 */
export function requirePaidPlan(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admins always have access regardless of subscription
  if (user.role === 'admin') {
    return next();
  }

  if (!isPaidUser(user)) {
    return res.status(403).json({ 
      error: 'Subscription required',
      message: 'Subscription required. Please upgrade to continue.',
    });
  }

  next();
}

/**
 * Middleware to check product limit before adding product
 */
export function checkProductLimit(req: AuthRequest, res: Response, next: NextFunction) {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Admins bypass product limits
  if (user.role === 'admin') {
    return next();
  }

  const canAdd = canAddProduct(user);
  if (!canAdd.allowed) {
    return res.status(403).json({ 
      error: canAdd.reason || 'Product limit reached',
      maxProducts: canAdd.maxProducts,
      productsAdded: canAdd.productsAdded,
    });
  }

  next();
}

