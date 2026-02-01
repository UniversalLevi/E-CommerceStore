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
import { User } from '../models/User';
import {
  approveCommission,
  revokeCommission,
  markCommissionAsPaid,
} from '../services/commissionService';
import { logAuditWithRequest } from '../utils/auditLogger';

/**
 * List all affiliates
 * GET /api/admin/affiliates
 */
export const listAffiliates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Search by user name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.userId = { $in: users.map((u) => u._id) };
    }

    const [affiliates, total] = await Promise.all([
      Affiliate.find(query)
        .populate('userId', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Affiliate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        affiliates,
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
 * Get affiliate details
 * GET /api/admin/affiliates/:id
 */
export const getAffiliateDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const affiliate = await Affiliate.findById(id).populate('userId', 'name email mobile');

    if (!affiliate) {
      throw createError('Affiliate not found', 404);
    }

    // Get detailed stats
    const [
      totalReferrals,
      commissions,
      payouts,
      recentReferrals,
    ] = await Promise.all([
      ReferralTracking.countDocuments({
        affiliateId: affiliate._id,
        status: 'converted',
      }),
      AffiliateCommission.find({ affiliateId: affiliate._id })
        .populate('referredUserId', 'name email')
        .populate('subscriptionId', 'planCode amountPaid')
        .populate('serviceOrderId', 'serviceType planType amount')
        .populate('storeOrderId', 'orderId total customer')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      AffiliatePayout.find({ affiliateId: affiliate._id })
        .sort({ createdAt: -1 })
        .lean(),
      ReferralTracking.find({ affiliateId: affiliate._id })
        .populate('referredUserId', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        affiliate,
        stats: {
          totalReferrals,
          commissions,
          payouts,
          recentReferrals,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve affiliate
 * POST /api/admin/affiliates/:id/approve
 */
export const approveAffiliate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      throw createError('Affiliate not found', 404);
    }

    if (affiliate.status === 'active') {
      return res.json({
        success: true,
        message: 'Affiliate is already active',
        data: affiliate,
      });
    }

    affiliate.status = 'active';
    affiliate.approvalDate = new Date();
    if (notes) {
      affiliate.adminNotes = notes;
    }
    await affiliate.save();

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_APPROVE',
      success: true,
      details: { affiliateId: affiliate._id },
    });

    res.json({
      success: true,
      message: 'Affiliate approved successfully',
      data: affiliate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject affiliate
 * POST /api/admin/affiliates/:id/reject
 */
export const rejectAffiliate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      throw createError('Affiliate not found', 404);
    }

    affiliate.status = 'rejected';
    if (reason) {
      affiliate.adminNotes = reason;
    }
    await affiliate.save();

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_REJECT',
      success: true,
      details: { affiliateId: affiliate._id, reason },
    });

    res.json({
      success: true,
      message: 'Affiliate rejected',
      data: affiliate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend affiliate
 * POST /api/admin/affiliates/:id/suspend
 */
export const suspendAffiliate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      throw createError('Affiliate not found', 404);
    }

    affiliate.status = 'suspended';
    affiliate.suspendedAt = new Date();
    if (reason) {
      affiliate.adminNotes = reason;
    }
    await affiliate.save();

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_SUSPEND',
      success: true,
      details: { affiliateId: affiliate._id, reason },
    });

    res.json({
      success: true,
      message: 'Affiliate suspended',
      data: affiliate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set custom commission rate
 * PUT /api/admin/affiliates/:id/commission-rate
 */
export const setCustomCommissionRate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { starter_30, growth_90, lifetime } = req.body;

    const affiliate = await Affiliate.findById(id);
    if (!affiliate) {
      throw createError('Affiliate not found', 404);
    }

    if (starter_30 !== undefined) {
      affiliate.customCommissionRates = affiliate.customCommissionRates || {};
      affiliate.customCommissionRates.starter_30 = starter_30;
    }
    if (growth_90 !== undefined) {
      affiliate.customCommissionRates = affiliate.customCommissionRates || {};
      affiliate.customCommissionRates.growth_90 = growth_90;
    }
    if (lifetime !== undefined) {
      affiliate.customCommissionRates = affiliate.customCommissionRates || {};
      affiliate.customCommissionRates.lifetime = lifetime;
    }

    await affiliate.save();

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_COMMISSION_RATE_UPDATE',
      success: true,
      details: { affiliateId: affiliate._id, rates: affiliate.customCommissionRates },
    });

    res.json({
      success: true,
      message: 'Commission rates updated',
      data: affiliate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get affiliate commissions
 * GET /api/admin/affiliates/:id/commissions
 */
export const getAffiliateCommissions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { affiliateId: id };
    if (status) {
      query.status = status;
    }

    const [commissions, total] = await Promise.all([
      AffiliateCommission.find(query)
        .populate('referredUserId', 'name email')
        .populate('subscriptionId', 'planCode amountPaid')
        .populate('serviceOrderId', 'serviceType planType amount')
        .populate('storeOrderId', 'orderId total customer')
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
 * Manually adjust commission
 * POST /api/admin/affiliates/:id/commission/:commissionId/adjust
 */
export const adjustCommission = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, commissionId } = req.params;
    const { action, amount, notes } = req.body;

    const commission = await AffiliateCommission.findOne({
      _id: commissionId,
      affiliateId: id,
    });

    if (!commission) {
      throw createError('Commission not found', 404);
    }

    if (action === 'approve') {
      await approveCommission(commission._id as mongoose.Types.ObjectId, (req.user as any)?._id as mongoose.Types.ObjectId);
    } else if (action === 'revoke') {
      await revokeCommission(commission._id as mongoose.Types.ObjectId, notes);
    } else if (action === 'adjust_amount' && amount !== undefined) {
      const oldAmount = commission.commissionAmount;
      commission.commissionAmount = amount;
      commission.adminNotes = notes || `Amount adjusted from ₹${oldAmount / 100} to ₹${amount / 100}`;
      await commission.save();
    }

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_COMMISSION_ADJUST',
      success: true,
      details: { commissionId, action, amount, notes },
    });

    res.json({
      success: true,
      message: 'Commission adjusted successfully',
      data: commission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve payout
 * POST /api/admin/affiliates/:id/payout/:payoutId/approve
 */
export const approvePayout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, payoutId } = req.params;
    const { notes } = req.body;

    const payout = await AffiliatePayout.findOne({
      _id: payoutId,
      affiliateId: id,
    }).populate('affiliateId');

    if (!payout) {
      throw createError('Payout not found', 404);
    }

    if (payout.status !== 'pending') {
      throw createError(`Payout is already ${payout.status}`, 400);
    }

    const affiliate = payout.affiliateId as any;

    // Get commissions ready for payout
    const readyCommissions = await AffiliateCommission.find({
      affiliateId: affiliate._id,
      status: 'approved',
      isRefunded: false,
    }).sort({ approvedAt: 1 }); // Oldest first

    // Mark commissions as paid
    for (const commission of readyCommissions) {
      await markCommissionAsPaid(commission._id as mongoose.Types.ObjectId);
    }

    // Get or create wallet for affiliate
    let wallet = await Wallet.findOne({ userId: affiliate.userId });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: affiliate.userId,
        balance: 0,
        currency: 'INR',
      });
    }

    // Credit wallet
    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + payout.amount;

    wallet.balance = balanceAfter;
    await wallet.save();

    // Create wallet transaction
    const walletTransaction = await WalletTransaction.create({
      walletId: wallet._id,
      userId: affiliate.userId,
      amount: payout.amount,
      type: 'credit',
      reason: 'Affiliate payout',
      balanceBefore,
      balanceAfter,
      referenceId: `AFF_PAYOUT_${payout._id}`,
      metadata: {
        payoutId: payout._id,
        affiliateId: affiliate._id,
      },
    });

    // Update payout
    payout.status = 'approved';
    payout.approvedAt = new Date();
    payout.walletTransactionId = walletTransaction._id as mongoose.Types.ObjectId;
    if (notes) {
      payout.adminNotes = notes;
    }
    await payout.save();

    // Mark as paid
    payout.status = 'paid';
    payout.paidAt = new Date();
    await payout.save();

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_PAYOUT_APPROVE',
      success: true,
      details: { payoutId: payout._id, amount: payout.amount },
    });

    res.json({
      success: true,
      message: 'Payout approved and credited to wallet',
      data: payout,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject payout
 * POST /api/admin/affiliates/:id/payout/:payoutId/reject
 */
export const rejectPayout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, payoutId } = req.params;
    const { reason } = req.body;

    const payout = await AffiliatePayout.findOne({
      _id: payoutId,
      affiliateId: id,
    });

    if (!payout) {
      throw createError('Payout not found', 404);
    }

    if (payout.status !== 'pending') {
      throw createError(`Payout is already ${payout.status}`, 400);
    }

    payout.status = 'rejected';
    payout.rejectedAt = new Date();
    payout.rejectionReason = reason;
    await payout.save();

    const userId = (req.user as any)?._id;
    await logAuditWithRequest(req, {
      userId: userId || 'system',
      action: 'AFFILIATE_PAYOUT_REJECT',
      success: true,
      details: { payoutId: payout._id, reason },
    });

    res.json({
      success: true,
      message: 'Payout rejected',
      data: payout,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export affiliates CSV
 * GET /api/admin/affiliates/export
 */
export const exportAffiliates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const affiliates = await Affiliate.find()
      .populate('userId', 'name email mobile')
      .lean();

    // Convert to CSV
    const headers = [
      'ID',
      'User Name',
      'User Email',
      'User Mobile',
      'Referral Code',
      'Status',
      'Total Referrals',
      'Total Commissions',
      'Paid Commissions',
      'Pending Commissions',
      'Application Date',
      'Approval Date',
    ];

    const rows = affiliates.map((aff) => {
      const user = aff.userId as any;
      return [
        aff._id.toString(),
        user?.name || '',
        user?.email || '',
        user?.mobile || '',
        aff.referralCode,
        aff.status,
        aff.totalReferrals,
        (aff.totalCommissions / 100).toFixed(2),
        (aff.paidCommissions / 100).toFixed(2),
        (aff.pendingCommissions / 100).toFixed(2),
        aff.applicationDate.toISOString(),
        aff.approvalDate?.toISOString() || '',
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=affiliates.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * Export payouts CSV
 * GET /api/admin/affiliates/export-payouts
 */
export const exportPayouts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, status } = req.query;

    const query: any = {};
    if (startDate || endDate) {
      query.requestedAt = {};
      if (startDate) query.requestedAt.$gte = new Date(startDate as string);
      if (endDate) query.requestedAt.$lte = new Date(endDate as string);
    }
    if (status) {
      query.status = status;
    }

    const payouts = await AffiliatePayout.find(query)
      .populate('affiliateId')
      .populate({
        path: 'affiliateId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ requestedAt: -1 })
      .lean();

    const headers = [
      'Payout ID',
      'Affiliate Code',
      'User Name',
      'User Email',
      'Amount',
      'Status',
      'Requested At',
      'Approved At',
      'Paid At',
    ];

    const rows = payouts.map((payout) => {
      const affiliate = payout.affiliateId as any;
      const user = affiliate?.userId as any;
      return [
        payout._id.toString(),
        affiliate?.referralCode || '',
        user?.name || '',
        user?.email || '',
        (payout.amount / 100).toFixed(2),
        payout.status,
        payout.requestedAt.toISOString(),
        payout.approvedAt?.toISOString() || '',
        payout.paidAt?.toISOString() || '',
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=affiliate-payouts.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
