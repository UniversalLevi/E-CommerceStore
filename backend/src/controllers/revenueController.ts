import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { plans } from '../config/plans';
import mongoose from 'mongoose';

/**
 * Get revenue summary
 * GET /admin/revenue/summary
 */
export const getRevenueSummary = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Aggregate total revenue from paid payments
    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    // Monthly revenue
    const monthlyRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // Yearly revenue
    const yearlyRevenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startOfYear },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const yearlyRevenue = yearlyRevenueResult[0]?.total || 0;

    // Payment counts
    const paymentsCount = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: 'paid' });
    const failedPayments = await Payment.countDocuments({ status: 'failed' });

    // Revenue by plan
    const revenueByPlanResult = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: '$planCode',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]);

    const revenueByPlan = revenueByPlanResult.map((item) => ({
      planCode: item._id,
      planName: plans[item._id as keyof typeof plans]?.name || item._id,
      count: item.count,
      amount: item.amount,
    }));

    // Active subscriptions count (include both 'active' and 'manually_granted')
    const activeSubscriptions = await Subscription.countDocuments({
      status: { $in: ['active', 'manually_granted'] },
    });

    // New payments this month
    const newPaymentsThisMonth = await Payment.countDocuments({
      status: 'paid',
      createdAt: { $gte: startOfMonth },
    });

    // Get payments by date (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const paymentsByDate = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Log audit
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'REVENUE_VIEWED',
        success: true,
        details: {
          summary: 'Revenue summary viewed',
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log revenue view:', auditError);
    }

    res.json({
      success: true,
      data: {
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        paymentsCount,
        successfulPayments,
        failedPayments,
        revenueByPlan,
        activeSubscriptions,
        newPaymentsThisMonth,
        paymentsByDate: paymentsByDate.map((item) => ({
          date: item._id,
          count: item.count,
          amount: item.totalAmount,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payments list with pagination and filters
 * GET /admin/revenue/payments
 */
export const getPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    // Plan filter
    if (req.query.planCode) {
      filter.planCode = req.query.planCode;
    }

    // Status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // User filter
    if (req.query.userId) {
      filter.userId = new mongoose.Types.ObjectId(req.query.userId as string);
    }

    // Search by email (requires aggregation)
    let matchStage: any = { ...filter };
    if (req.query.search) {
      // We'll need to populate userId and search in user email
      // This requires aggregation
    }

    // Get payments with pagination
    const payments = await Payment.find(filter)
      .populate('userId', 'email')
      .populate('subscriptionId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // If search query provided, filter by email
    let filteredPayments = payments;
    if (req.query.search) {
      const searchTerm = (req.query.search as string).toLowerCase();
      filteredPayments = payments.filter((payment: any) => {
        const userEmail = payment.userId?.email?.toLowerCase() || '';
        return userEmail.includes(searchTerm);
      });
    }

    // Format payments
    const formattedPayments = filteredPayments.map((payment: any) => ({
      id: payment._id,
      userId: payment.userId?._id || payment.userId,
      userEmail: payment.userId?.email || 'Unknown',
      planCode: payment.planCode,
      planName: payment.planName || plans[payment.planCode as keyof typeof plans]?.name || payment.planCode,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      subscriptionId: payment.subscriptionId?._id || payment.subscriptionId,
      createdAt: payment.createdAt,
    }));

    // Get total count
    const total = await Payment.countDocuments(filter);

    // Log audit
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'REVENUE_PAYMENTS_VIEWED',
        success: true,
        details: {
          filters: {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            planCode: req.query.planCode,
            status: req.query.status,
            search: req.query.search,
            page,
            limit,
          },
          totalResults: total,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log revenue payments view:', auditError);
    }

    res.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export payments to CSV
 * GET /admin/revenue/export
 */
export const exportPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Build filter (same as getPayments)
    const filter: any = {};

    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.planCode) {
      filter.planCode = req.query.planCode;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.userId) {
      filter.userId = new mongoose.Types.ObjectId(req.query.userId as string);
    }

    // Get all payments matching filter
    const payments = await Payment.find(filter)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .lean();

    // Format as CSV
    const csvRows = [
      ['Date', 'User Email', 'Plan', 'Amount (₹)', 'Status', 'Payment ID', 'Order ID'].join(','),
    ];

    payments.forEach((payment: any) => {
      const row = [
        new Date(payment.createdAt).toISOString(),
        payment.userId?.email || 'Unknown',
        plans[payment.planCode as keyof typeof plans]?.name || payment.planCode,
        (payment.amount / 100).toFixed(2), // Convert paise to rupees
        payment.status,
        payment.paymentId || '',
        payment.orderId,
      ].map((field) => `"${field}"`).join(',');
      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');

    // Log audit
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'REVENUE_EXPORTED',
        success: true,
        details: {
          filters: {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            planCode: req.query.planCode,
            status: req.query.status,
          },
          recordCount: payments.length,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log revenue export:', auditError);
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payments-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

