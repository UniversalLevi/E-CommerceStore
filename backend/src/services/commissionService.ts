import mongoose from 'mongoose';
import { Affiliate } from '../models/Affiliate';
import { AffiliateCommission, IAffiliateCommission } from '../models/AffiliateCommission';
import { ReferralTracking } from '../models/ReferralTracking';
import { Subscription } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { COMMISSION_RATES, COMMISSION_HOLDING_DAYS, AUTO_APPROVE_COMMISSIONS } from '../config/affiliateConfig';
import { createError } from '../middleware/errorHandler';

export interface CreateCommissionParams {
  userId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  planCode: 'starter_30' | 'growth_90' | 'lifetime';
  subscriptionAmount: number; // in paise
}

export interface CreateServiceCommissionParams {
  userId: mongoose.Types.ObjectId;
  serviceOrderId: mongoose.Types.ObjectId;
  serviceType: string;
  purchaseAmount: number; // in paise
}

export interface CreateStoreOrderCommissionParams {
  userId: mongoose.Types.ObjectId;
  storeOrderId: mongoose.Types.ObjectId;
  purchaseAmount: number; // in paise
}

/**
 * Calculate commission amount based on plan and custom rates
 */
export function calculateCommission(
  planCode: 'starter_30' | 'growth_90' | 'lifetime',
  subscriptionAmount: number,
  customRates?: {
    starter_30?: number;
    growth_90?: number;
    lifetime?: number;
  }
): { rate: number; amount: number } {
  // Use custom rate if available, otherwise use default
  const rate = customRates?.[planCode] ?? COMMISSION_RATES[planCode];
  const amount = Math.floor(subscriptionAmount * rate); // Round down to avoid fractional paise

  return { rate, amount };
}

/**
 * Calculate commission amount for service or store order purchases
 */
export function calculatePurchaseCommission(
  purchaseType: 'service' | 'store_order',
  purchaseAmount: number,
  customRates?: {
    service?: number;
    store_order?: number;
  }
): { rate: number; amount: number } {
  // Use custom rate if available, otherwise use default
  const rate = customRates?.[purchaseType] ?? COMMISSION_RATES[purchaseType];
  const amount = Math.floor(purchaseAmount * rate); // Round down to avoid fractional paise

  return { rate, amount };
}

/**
 * Create commission for a successful subscription purchase
 */
export async function createCommission(params: CreateCommissionParams): Promise<IAffiliateCommission | null> {
  const { userId, subscriptionId, paymentId, planCode, subscriptionAmount } = params;

  // Check if user has a referral
  const referral = await ReferralTracking.findOne({
    referredUserId: userId,
    status: 'converted',
  }).populate('affiliateId');

  if (!referral) {
    // No referral found, no commission
    return null;
  }

  const affiliate = referral.affiliateId as any;
  if (!affiliate || affiliate.status !== 'active') {
    // Affiliate is not active
    return null;
  }

  // Fraud check: Ensure user is not referring themselves
  if (affiliate.userId.toString() === userId.toString()) {
    // Self-referral detected, skip commission
    return null;
  }

  // Check if commission already exists for this subscription (idempotency)
  const existingCommission = await AffiliateCommission.findOne({ subscriptionId });
  if (existingCommission) {
    return existingCommission;
  }

  // Calculate commission
  const { rate, amount } = calculateCommission(planCode, subscriptionAmount, affiliate.customCommissionRates);

  if (amount <= 0) {
    // No commission to award
    return null;
  }

  // Determine initial status
  // If auto-approve is enabled and holding period has passed, approve immediately
  // Otherwise, mark as pending
  const status: 'pending' | 'approved' = 'pending'; // Always start as pending (admin approval required)

  // Create commission record
  const commission = await AffiliateCommission.create({
    affiliateId: affiliate._id,
    referredUserId: userId,
    purchaseType: 'subscription',
    subscriptionId,
    paymentId,
    planCode,
    purchaseAmount: subscriptionAmount,
    commissionRate: rate,
    commissionAmount: amount,
    status: 'pending',
    paymentStatus: 'paid',
    isRefunded: false,
  });

  // Update affiliate stats
  affiliate.totalCommissions += amount;
  affiliate.pendingCommissions += amount;
  await affiliate.save();

  // Update subscription with referral
  await Subscription.findByIdAndUpdate(subscriptionId, {
    referredBy: affiliate._id,
  });

  return commission;
}

/**
 * Approve a commission (after holding period or manual approval)
 */
export async function approveCommission(
  commissionId: mongoose.Types.ObjectId,
  adminId?: mongoose.Types.ObjectId
): Promise<IAffiliateCommission> {
  const commission = await AffiliateCommission.findById(commissionId).populate('affiliateId');

  if (!commission) {
    throw createError('Commission not found', 404);
  }

  if (commission.status !== 'pending') {
    throw createError(`Commission is already ${commission.status}`, 400);
  }

  if (commission.isRefunded) {
    throw createError('Cannot approve refunded commission', 400);
  }

  // Update commission status
  commission.status = 'approved';
  commission.approvedAt = new Date();
  if (adminId) {
    commission.adminNotes = `Approved by admin ${adminId}`;
  }
  await commission.save();

  // Update affiliate stats
  const affiliate = commission.affiliateId as any;
  affiliate.pendingCommissions -= commission.commissionAmount;
  await affiliate.save();

  return commission;
}

/**
 * Revoke commission (e.g., on refund)
 */
export async function revokeCommission(
  commissionId: mongoose.Types.ObjectId,
  reason?: string
): Promise<IAffiliateCommission> {
  const commission = await AffiliateCommission.findById(commissionId).populate('affiliateId');

  if (!commission) {
    throw createError('Commission not found', 404);
  }

  if (commission.status === 'revoked') {
    // Already revoked
    return commission;
  }

  // Store the original status before changing it
  const originalStatus = commission.status;

  // Mark as refunded and revoked
  commission.isRefunded = true;
  commission.status = 'revoked';
  commission.revokedAt = new Date();
  if (reason) {
    commission.adminNotes = reason;
  }
  await commission.save();

  // Update affiliate stats
  const affiliate = commission.affiliateId as any;
  
  // Deduct from appropriate stat based on original status
  if (originalStatus === 'pending') {
    affiliate.pendingCommissions -= commission.commissionAmount;
  } else if (originalStatus === 'approved' || originalStatus === 'paid') {
    affiliate.paidCommissions -= commission.commissionAmount;
  }
  affiliate.totalCommissions -= commission.commissionAmount;
  await affiliate.save();

  return commission;
}

/**
 * Mark commission as paid (after payout)
 */
export async function markCommissionAsPaid(
  commissionId: mongoose.Types.ObjectId
): Promise<IAffiliateCommission> {
  const commission = await AffiliateCommission.findById(commissionId).populate('affiliateId');

  if (!commission) {
    throw createError('Commission not found', 404);
  }

  if (commission.status !== 'approved') {
    throw createError('Commission must be approved before marking as paid', 400);
  }

  commission.status = 'paid';
  commission.paidAt = new Date();
  await commission.save();

  // Update affiliate stats
  const affiliate = commission.affiliateId as any;
  affiliate.paidCommissions += commission.commissionAmount;
  affiliate.pendingCommissions -= commission.commissionAmount;
  await affiliate.save();

  return commission;
}

/**
 * Get commissions ready for payout (approved and past holding period)
 */
export async function getCommissionsReadyForPayout(
  affiliateId: mongoose.Types.ObjectId
): Promise<IAffiliateCommission[]> {
  const holdingPeriodDate = new Date();
  holdingPeriodDate.setDate(holdingPeriodDate.getDate() - COMMISSION_HOLDING_DAYS);

  return AffiliateCommission.find({
    affiliateId,
    status: 'approved',
    approvedAt: { $lte: holdingPeriodDate },
    isRefunded: false,
  });
}

/**
 * Create commission for a service purchase
 */
export async function createServiceCommission(params: CreateServiceCommissionParams): Promise<IAffiliateCommission | null> {
  const { userId, serviceOrderId, serviceType, purchaseAmount } = params;

  // Check if user has a referral
  const referral = await ReferralTracking.findOne({
    referredUserId: userId,
    status: 'converted',
  }).populate('affiliateId');

  if (!referral) {
    return null;
  }

  const affiliate = referral.affiliateId as any;
  if (!affiliate || affiliate.status !== 'active') {
    return null;
  }

  // Fraud check: Ensure user is not referring themselves
  if (affiliate.userId.toString() === userId.toString()) {
    return null;
  }

  // Check if commission already exists for this service order (idempotency)
  const existingCommission = await AffiliateCommission.findOne({ serviceOrderId });
  if (existingCommission) {
    return existingCommission;
  }

  // Calculate commission (use default service rate or custom rate if set)
  const customRates = affiliate.customCommissionRates as any;
  const { rate, amount } = calculatePurchaseCommission('service', purchaseAmount, {
    service: customRates?.service,
    store_order: customRates?.store_order,
  });

  if (amount <= 0) {
    return null;
  }

  // Create commission record
  const commission = await AffiliateCommission.create({
    affiliateId: affiliate._id,
    referredUserId: userId,
    purchaseType: 'service',
    serviceOrderId,
    serviceType,
    purchaseAmount,
    commissionRate: rate,
    commissionAmount: amount,
    status: 'pending',
    paymentStatus: 'paid',
    isRefunded: false,
  });

  // Update affiliate stats
  affiliate.totalCommissions += amount;
  affiliate.pendingCommissions += amount;
  await affiliate.save();

  return commission;
}

/**
 * Create commission for a store order purchase
 */
export async function createStoreOrderCommission(params: CreateStoreOrderCommissionParams): Promise<IAffiliateCommission | null> {
  const { userId, storeOrderId, purchaseAmount } = params;

  // Check if user has a referral
  const referral = await ReferralTracking.findOne({
    referredUserId: userId,
    status: 'converted',
  }).populate('affiliateId');

  if (!referral) {
    return null;
  }

  const affiliate = referral.affiliateId as any;
  if (!affiliate || affiliate.status !== 'active') {
    return null;
  }

  // Fraud check: Ensure user is not referring themselves
  if (affiliate.userId.toString() === userId.toString()) {
    return null;
  }

  // Check if commission already exists for this store order (idempotency)
  const existingCommission = await AffiliateCommission.findOne({ storeOrderId });
  if (existingCommission) {
    return existingCommission;
  }

  // Calculate commission (use default store_order rate or custom rate if set)
  const customRates = affiliate.customCommissionRates as any;
  const { rate, amount } = calculatePurchaseCommission('store_order', purchaseAmount, {
    service: customRates?.service,
    store_order: customRates?.store_order,
  });

  if (amount <= 0) {
    return null;
  }

  // Create commission record
  const commission = await AffiliateCommission.create({
    affiliateId: affiliate._id,
    referredUserId: userId,
    purchaseType: 'store_order',
    storeOrderId,
    purchaseAmount,
    commissionRate: rate,
    commissionAmount: amount,
    status: 'pending',
    paymentStatus: 'paid',
    isRefunded: false,
  });

  // Update affiliate stats
  affiliate.totalCommissions += amount;
  affiliate.pendingCommissions += amount;
  await affiliate.save();

  return commission;
}

/**
 * Check and handle refunds for a payment
 */
export async function handlePaymentRefund(paymentId: mongoose.Types.ObjectId): Promise<void> {
  const commission = await AffiliateCommission.findOne({ paymentId });

  if (commission && commission.status !== 'revoked') {
    await revokeCommission(commission._id as mongoose.Types.ObjectId, 'Payment refunded');
  }
}
