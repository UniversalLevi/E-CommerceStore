import mongoose from 'mongoose';
import { Affiliate, IAffiliate } from '../models/Affiliate';
import { ReferralTracking, IReferralTracking } from '../models/ReferralTracking';
import { User } from '../models/User';
import { REFERRAL_COOKIE_EXPIRY_DAYS } from '../config/affiliateConfig';
import { createError } from '../middleware/errorHandler';

export interface TrackReferralParams {
  referralCode: string;
  ipAddress?: string;
  userAgent?: string;
  cookieData?: string;
  trackingMethod: 'link' | 'code';
}

export interface BindReferralParams {
  userId: mongoose.Types.ObjectId;
  referralCode?: string;
  ipAddress?: string;
}

/**
 * Track a referral visit (before user signs up)
 * Creates a pending referral tracking record
 */
export async function trackReferralVisit(params: TrackReferralParams): Promise<IReferralTracking | null> {
  const { referralCode, ipAddress, userAgent, cookieData, trackingMethod } = params;

  // Find affiliate by referral code (allow pending and active)
  const affiliate = await Affiliate.findOne({
    referralCode: referralCode.toUpperCase(),
    status: { $in: ['pending', 'active'] }, // Track for pending and active affiliates
  });

  if (!affiliate) {
    // Invalid referral code, return null (don't throw error, just don't track)
    return null;
  }

  // Check if there's already a pending tracking for this cookie/IP
  const existingTracking = await ReferralTracking.findOne({
    $or: [
      { cookieData, status: 'pending' },
      { ipAddress, status: 'pending', createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Same IP within 24 hours
    ],
    expiresAt: { $gt: new Date() },
  });

  if (existingTracking) {
    // Already tracking this visitor, return existing
    return existingTracking;
  }

  // Create new tracking record
  const expiresAt = new Date(Date.now() + REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const tracking = await ReferralTracking.create({
    affiliateId: affiliate._id,
    referralCode: referralCode.toUpperCase(),
    trackingMethod,
    cookieData,
    ipAddress,
    userAgent,
    status: 'pending',
    expiresAt,
  });

  return tracking;
}

/**
 * Bind referral to user on signup
 * This permanently links the user to the affiliate
 */
export async function bindReferralToUser(params: BindReferralParams): Promise<IReferralTracking | null> {
  const { userId, referralCode, ipAddress } = params;

  console.log(`[Referral] bindReferralToUser called with:`, { userId, referralCode, ipAddress });

  // Check if user already has a referral (prevent re-binding)
  const user = await User.findById(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.referredBy) {
    // User already has a referral, return existing tracking
    console.log(`[Referral] User ${userId} already has a referral: ${user.referredBy}`);
    const existing = await ReferralTracking.findOne({
      referredUserId: userId,
      status: 'converted',
    });
    return existing;
  }

  let tracking: IReferralTracking | null = null;

  // Try to find existing pending tracking by referral code or cookie
  if (referralCode) {
    tracking = await ReferralTracking.findOne({
      referralCode: referralCode.toUpperCase(),
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 }); // Get most recent
  }

  // If no tracking found by code, try by IP (within last 30 days)
  if (!tracking && ipAddress) {
    tracking = await ReferralTracking.findOne({
      ipAddress,
      status: 'pending',
      expiresAt: { $gt: new Date() },
      createdAt: { $gte: new Date(Date.now() - REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });
  }

  // If no tracking found but referral code provided, try to create one directly
  if (!tracking && referralCode) {
    // Find affiliate by referral code (allow pending and active)
    const affiliate = await Affiliate.findOne({
      referralCode: referralCode.toUpperCase(),
      status: { $in: ['pending', 'active'] }, // Track for pending and active affiliates
    });

    if (affiliate) {
      // Fraud detection: Check if user is trying to refer themselves
      if (affiliate.userId.toString() === userId.toString()) {
        // Self-referral detected, don't create tracking
        console.log(`[Referral] Self-referral detected for user ${userId} with code ${referralCode}`);
        return null;
      }

      // Check if affiliate is not rejected/suspended
      if (affiliate.status === 'rejected' || affiliate.status === 'suspended') {
        console.log(`[Referral] Affiliate ${affiliate._id} is ${affiliate.status}, cannot track referral`);
        return null;
      }

      // Create tracking record directly
      const expiresAt = new Date(Date.now() + REFERRAL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      tracking = await ReferralTracking.create({
        affiliateId: affiliate._id,
        referralCode: referralCode.toUpperCase(),
        trackingMethod: 'link',
        ipAddress,
        status: 'pending',
        expiresAt,
      });
      console.log(`[Referral] Created new tracking record for referral code ${referralCode} during registration`);
    } else {
      console.log(`[Referral] No affiliate found for referral code ${referralCode}`);
    }
  }

  if (!tracking) {
    // No valid referral found
    console.log(`[Referral] No tracking record found for referral code "${referralCode}"`);
    return null;
  }

  console.log(`[Referral] Found tracking record:`, { trackingId: tracking._id, affiliateId: tracking.affiliateId, status: tracking.status });

  // Check if affiliate exists and is not rejected/suspended
  const affiliate: IAffiliate | null = await Affiliate.findById(tracking.affiliateId);
  if (!affiliate) {
    console.log(`[Referral] Affiliate ${tracking.affiliateId} not found`);
    tracking.status = 'expired';
    await tracking.save();
    return null;
  }

  // Fraud detection: Check if user is trying to refer themselves
  if (affiliate.userId.toString() === userId.toString()) {
    // Self-referral detected, mark as expired
    console.log(`[Referral] Self-referral detected: affiliate userId ${affiliate.userId} matches new user ${userId}`);
    tracking.status = 'expired';
    await tracking.save();
    return null;
  }

  if (affiliate.status === 'rejected' || affiliate.status === 'suspended') {
    console.log(`[Referral] Affiliate ${affiliate._id} is ${affiliate.status}, cannot bind referral`);
    tracking.status = 'expired';
    await tracking.save();
    return null;
  }

  console.log(`[Referral] Affiliate is valid:`, { affiliateId: affiliate._id, status: affiliate.status, userId: affiliate.userId });

  // Bind referral to user
  tracking.referredUserId = userId;
  tracking.status = 'converted';
  tracking.convertedAt = new Date();
  await tracking.save();

  // Update user with referral
  user.referredBy = affiliate._id as mongoose.Types.ObjectId;
  await user.save();

  // Update affiliate stats
  affiliate.totalReferrals += 1;
  await affiliate.save();

  console.log(`[Referral] Successfully bound referral ${tracking._id} to user ${userId} for affiliate ${affiliate._id}`);

  return tracking;
}

/**
 * Get active referral for a user
 */
export async function getUserReferral(userId: mongoose.Types.ObjectId): Promise<IReferralTracking | null> {
  return ReferralTracking.findOne({
    referredUserId: userId,
    status: 'converted',
  }).populate('affiliateId');
}

/**
 * Check if referral code is valid and affiliate is active
 */
export async function validateReferralCode(referralCode: string): Promise<boolean> {
  const affiliate = await Affiliate.findOne({
    referralCode: referralCode.toUpperCase(),
    status: 'active',
  });

  return !!affiliate;
}

/**
 * Clean up expired tracking records (can be run as a cron job)
 */
export async function cleanupExpiredTracking(): Promise<number> {
  const result = await ReferralTracking.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() },
    },
    {
      $set: { status: 'expired' },
    }
  );

  return result.modifiedCount;
}
