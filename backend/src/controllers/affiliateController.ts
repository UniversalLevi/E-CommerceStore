import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { Affiliate } from '../models/Affiliate';
import { AffiliateCommission } from '../models/AffiliateCommission';
import { AffiliatePayout } from '../models/AffiliatePayout';
import { ReferralTracking } from '../models/ReferralTracking';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { MIN_PAYOUT_AMOUNT, COMMISSION_HOLDING_DAYS } from '../config/affiliateConfig';
import { getCommissionsReadyForPayout, markCommissionAsPaid } from '../services/commissionService';
import { logAuditWithRequest } from '../utils/auditLogger';

/**
 * Apply to become an affiliate
 * POST /api/affiliates/apply
 */
export const applyForAffiliate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    // Check if user already has an affiliate account
    const existing = await Affiliate.findOne({ userId });
    if (existing) {
      return res.json({
        success: true,
        message: 'You already have an affiliate account',
        data: existing,
      });
    }

    // Generate unique referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const userIdStr = userId.toString().slice(-6).toUpperCase();
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      referralCode = `${userIdStr}${randomStr}`;

      const codeExists = await Affiliate.findOne({ referralCode });
      if (!codeExists) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Fallback: use timestamp-based code
      referralCode = `REF${Date.now().toString(36).toUpperCase().slice(-8)}`;
    }

    // Create affiliate application
    const affiliate = await Affiliate.create({
      userId,
      status: 'pending',
      referralCode: referralCode!,
      applicationDate: new Date(),
    });

    await logAuditWithRequest(req, {
      userId,
      action: 'AFFILIATE_APPLY',
      success: true,
      details: { affiliateId: affiliate._id },
    });

    res.status(201).json({
      success: true,
      message: 'Affiliate application submitted successfully',
      data: affiliate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate dashboard data
 * GET /api/affiliates/me
 */
export const getMyAffiliate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    const affiliate = await Affiliate.findOne({ userId });

    if (!affiliate) {
      return res.json({
        success: true,
        data: null,
        message: 'You are not an affiliate',
      });
    }

    // Get referral link
    const baseUrl = process.env.FRONTEND_URL || 'https://eazydropshipping.com';
    const referralLink = `${baseUrl}/register?ref=${affiliate.referralCode}`;

    res.json({
      success: true,
      data: {
        ...affiliate.toObject(),
        referralLink,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate statistics
 * GET /api/affiliates/stats
 */
export const getAffiliateStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      throw createError('You are not an affiliate', 404);
    }

    // Get detailed stats
    const [
      totalReferrals,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
      totalCommissions,
      recentCommissions,
    ] = await Promise.all([
      ReferralTracking.countDocuments({
        affiliateId: affiliate._id,
        status: 'converted',
      }),
      AffiliateCommission.aggregate([
        {
          $match: {
            affiliateId: affiliate._id,
            status: 'pending',
            isRefunded: false,
          },
        },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      AffiliateCommission.aggregate([
        {
          $match: {
            affiliateId: affiliate._id,
            status: 'approved',
            isRefunded: false,
          },
        },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      AffiliateCommission.aggregate([
        {
          $match: {
            affiliateId: affiliate._id,
            status: 'paid',
            isRefunded: false,
          },
        },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      AffiliateCommission.aggregate([
        {
          $match: {
            affiliateId: affiliate._id,
            isRefunded: false,
          },
        },
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } },
      ]),
      AffiliateCommission.find({
        affiliateId: affiliate._id,
      })
        .populate('referredUserId', 'name email')
        .populate('subscriptionId', 'planCode amountPaid')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const stats = {
      totalReferrals,
      pendingCommissions: pendingCommissions[0]?.total || 0,
      approvedCommissions: approvedCommissions[0]?.total || 0,
      paidCommissions: paidCommissions[0]?.total || 0,
      totalCommissions: totalCommissions[0]?.total || 0,
      recentCommissions,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get commission history
 * GET /api/affiliates/commissions
 */
export const getCommissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      throw createError('You are not an affiliate', 404);
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { affiliateId: affiliate._id };
    if (status) {
      query.status = status;
    }

    const [commissions, total] = await Promise.all([
      AffiliateCommission.find(query)
        .populate('referredUserId', 'name email')
        .populate('subscriptionId', 'planCode amountPaid')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AffiliateCommission.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        commissions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request payout
 * POST /api/affiliates/payout/request
 */
export const requestPayout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      throw createError('You are not an affiliate', 404);
    }

    if (affiliate.status !== 'active') {
      throw createError('Your affiliate account is not active', 400);
    }

    // Get commissions ready for payout
    const readyCommissions = await getCommissionsReadyForPayout(affiliate._id as mongoose.Types.ObjectId);
    const totalAmount = readyCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    if (totalAmount < MIN_PAYOUT_AMOUNT) {
      throw createError(
        `Minimum payout amount is ₹${MIN_PAYOUT_AMOUNT / 100}. You have ₹${totalAmount / 100} available.`,
        400
      );
    }

    // Check if there's already a pending payout
    const existingPayout = await AffiliatePayout.findOne({
      affiliateId: affiliate._id,
      status: 'pending',
    });

    if (existingPayout) {
      throw createError('You already have a pending payout request', 400);
    }

    // Create payout request
    const payout = await AffiliatePayout.create({
      affiliateId: affiliate._id,
      amount: totalAmount,
      status: 'pending',
      requestedAt: new Date(),
    });

    await logAuditWithRequest(req, {
      userId,
      action: 'AFFILIATE_PAYOUT_REQUEST',
      success: true,
      details: { payoutId: payout._id, amount: totalAmount },
    });

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: payout,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout history
 * GET /api/affiliates/payout/history
 */
export const getPayoutHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    const affiliate = await Affiliate.findOne({ userId });
    if (!affiliate) {
      throw createError('You are not an affiliate', 404);
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payouts, total] = await Promise.all([
      AffiliatePayout.find({ affiliateId: affiliate._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AffiliatePayout.countDocuments({ affiliateId: affiliate._id }),
    ]);

    res.json({
      success: true,
      data: {
        payouts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
