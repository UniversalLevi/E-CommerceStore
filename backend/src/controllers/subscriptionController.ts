import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Subscription } from '../models/Subscription';
import { Payment } from '../models/Payment';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { plans, isValidPlanCode, PlanCode } from '../config/plans';
import mongoose from 'mongoose';
import { razorpayService } from '../services/RazorpayService';
import {
  grantSubscriptionSchema,
  revokeSubscriptionSchema,
  updateSubscriptionSchema,
} from '../validators/subscriptionValidator';

/**
 * List all subscriptions with pagination and filters
 * GET /admin/subscriptions
 */
export const listSubscriptions = async (
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

    if (req.query.status) {
      // If status is 'active', include both 'active' and 'manually_granted'
      if (req.query.status === 'active') {
        filter.status = { $in: ['active', 'manually_granted'] };
      } else {
        filter.status = req.query.status;
      }
    }

    if (req.query.planCode) {
      filter.planCode = req.query.planCode;
    }

    if (req.query.userId) {
      filter.userId = new mongoose.Types.ObjectId(req.query.userId as string);
    }

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

    // Get subscriptions
    const subscriptions = await Subscription.find(filter)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format subscriptions
    const formattedSubscriptions = subscriptions.map((sub: any) => ({
      id: sub._id,
      userId: sub.userId?._id || sub.userId,
      userEmail: sub.userId?.email || 'Unknown',
      planCode: sub.planCode,
      planName: plans[sub.planCode as keyof typeof plans]?.name || sub.planCode,
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      renewalDate: sub.renewalDate,
      amountPaid: sub.amountPaid,
      source: sub.source,
      adminNote: sub.adminNote,
      razorpaySubscriptionId: sub.razorpaySubscriptionId,
      razorpayPaymentId: sub.razorpayPaymentId,
      history: sub.history,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    }));

    const total = await Subscription.countDocuments(filter);

    // Log audit
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'SUBSCRIPTION_LIST_VIEWED',
        success: true,
        details: {
          filters: {
            status: req.query.status,
            planCode: req.query.planCode,
            userId: req.query.userId,
            page,
            limit,
          },
          totalResults: total,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log subscription list view:', auditError);
    }

    res.json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
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
 * Get single subscription details
 * GET /admin/subscriptions/:subscriptionId
 */
export const getSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId)
      .populate('userId', 'email')
      .lean();

    if (!subscription) {
      throw createError('Subscription not found', 404);
    }

    // Get linked payments
    const payments = await Payment.find({ subscriptionId: subscriptionId })
      .sort({ createdAt: -1 })
      .lean();

    // Log audit
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'SUBSCRIPTION_VIEWED',
        success: true,
        details: {
          subscriptionId: subscriptionId,
          userId: (subscription.userId as any)?._id || subscription.userId,
          planCode: subscription.planCode,
          status: subscription.status,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log subscription view:', auditError);
    }

    res.json({
      success: true,
      data: {
        subscription: {
          ...subscription,
          planName: plans[subscription.planCode as keyof typeof plans]?.name || subscription.planCode,
          userEmail: (subscription.userId as any)?.email || 'Unknown',
        },
        payments: payments.map((p: any) => ({
          id: p._id,
          amount: p.amount,
          status: p.status,
          paymentId: p.paymentId,
          orderId: p.orderId,
          createdAt: p.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription history for a user
 * GET /admin/subscriptions/user/:userId/history
 */
export const getUserSubscriptionHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { userId } = req.params;

    const subscriptions = await Subscription.find({ userId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .lean();

    // Log audit
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'SUBSCRIPTION_HISTORY_VIEWED',
        success: true,
        details: {
          targetUserId: userId,
          subscriptionCount: subscriptions.length,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log subscription history view:', auditError);
    }

    res.json({
      success: true,
      data: {
        subscriptions: subscriptions.map((sub: any) => ({
          id: sub._id,
          planCode: sub.planCode,
          planName: plans[sub.planCode as keyof typeof plans]?.name || sub.planCode,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          source: sub.source,
          history: sub.history,
          createdAt: sub.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually grant a subscription
 * POST /admin/subscriptions/grant
 */
export const grantSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Validate request body
    const validationResult = grantSubscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw createError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { userId, planCode, daysValid, endDate, adminNote } = validationResult.data;

    if (!userId || !planCode) {
      throw createError('userId and planCode are required', 400);
    }

    if (!isValidPlanCode(planCode)) {
      throw createError('Invalid plan code', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    const plan = plans[planCode];
    const now = new Date();

    // Calculate end date
    let calculatedEndDate: Date | null = null;
    if (plan.isLifetime) {
      calculatedEndDate = null;
    } else if (endDate) {
      calculatedEndDate = new Date(endDate);
    } else if (daysValid) {
      calculatedEndDate = new Date(now.getTime() + daysValid * 24 * 60 * 60 * 1000);
    } else {
      // Default to plan duration
      calculatedEndDate = plan.durationDays
        ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
        : null;
    }

    // Cancel any existing active subscription
    await Subscription.updateMany(
      { userId, status: 'active' },
      { status: 'cancelled' }
    );

    // Create new subscription
    const subscription = await Subscription.create({
      userId,
      planCode: planCode as PlanCode,
      status: 'manually_granted',
      startDate: now,
      endDate: calculatedEndDate,
      amountPaid: plan.price,
      source: 'manual',
      adminNote,
      history: [
        {
          action: 'manual_granted',
          timestamp: now,
          adminId: (req.user as any)._id,
          notes: adminNote || 'Manually granted by admin',
        },
      ],
    });

    // Update user model
    user.plan = planCode;
    user.planExpiresAt = calculatedEndDate;
    user.isLifetime = plan.isLifetime;
    user.productsAdded = 0; // Reset on new grant

    await user.save();

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'SUBSCRIPTION_GRANTED',
        success: true,
        details: {
          targetUserId: userId,
          planCode,
          subscriptionId: subscription._id,
          endDate: calculatedEndDate,
          adminNote,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log subscription grant:', auditError);
    }

    res.json({
      success: true,
      message: 'Subscription granted successfully',
      data: {
        subscription: {
          id: subscription._id,
          planCode: subscription.planCode,
          planName: plan.name,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually revoke a subscription
 * POST /admin/subscriptions/revoke
 */
export const revokeSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Validate request body
    const validationResult = revokeSubscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw createError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { userId, reason } = validationResult.data;

    if (!userId) {
      throw createError('userId is required', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'manually_granted'] },
    });

    if (!subscription) {
      throw createError('No active subscription found for this user', 404);
    }

    // Cancel Razorpay subscription if exists
    if (subscription.razorpaySubscriptionId) {
      try {
        await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId);
      } catch (error) {
        console.error('Error cancelling Razorpay subscription:', error);
        // Continue even if Razorpay cancellation fails
      }
    }

    // Update subscription
    subscription.status = 'cancelled';
    subscription.history.push({
      action: 'manual_revoke',
      timestamp: new Date(),
      adminId: (req.user as any)._id,
      notes: reason || 'Manually revoked by admin',
    });
    await subscription.save();

    // Update user model
    user.plan = null;
    user.planExpiresAt = null;
    user.isLifetime = false;
    await user.save();

    // Create audit log
    try {
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'SUBSCRIPTION_REVOKED',
        success: true,
        details: {
          targetUserId: userId,
          subscriptionId: subscription._id,
          reason,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log subscription revoke:', auditError);
    }

    res.json({
      success: true,
      message: 'Subscription revoked successfully',
      data: {
        subscriptionId: subscription._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription (upgrade or extend)
 * POST /admin/subscriptions/update
 */
export const updateSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Validate request body
    const validationResult = updateSubscriptionSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw createError(
        validationResult.error.errors.map((e) => e.message).join(', '),
        400
      );
    }

    const { userId, planCode, extendDays, adminNote } = validationResult.data;

    if (!userId) {
      throw createError('userId is required', 400);
    }

    if (!planCode && !extendDays && !adminNote) {
      throw createError('Either planCode, extendDays, or adminNote must be provided', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Find active subscription
    const subscription = await Subscription.findOne({
      userId,
      status: { $in: ['active', 'manually_granted'] },
    });

    if (!subscription) {
      throw createError('No active subscription found for this user', 404);
    }

    const now = new Date();
    let actionType: 'manual_upgrade' | 'manual_extension' | 'note_added' = 'note_added';

    // Handle upgrade
    if (planCode) {
      if (!isValidPlanCode(planCode)) {
        throw createError('Invalid plan code', 400);
      }

      const newPlan = plans[planCode];
      const isUpgrade = subscription.planCode !== planCode;

      if (isUpgrade) {
        actionType = 'manual_upgrade';
        subscription.planCode = planCode as PlanCode;
        subscription.amountPaid = newPlan.price;

        // Reset end date based on new plan
        if (newPlan.isLifetime) {
          subscription.endDate = null;
        } else if (newPlan.durationDays) {
          subscription.endDate = new Date(now.getTime() + newPlan.durationDays * 24 * 60 * 60 * 1000);
        }

        // Update user model
        user.plan = planCode;
        user.planExpiresAt = subscription.endDate || null;
        user.isLifetime = newPlan.isLifetime;
        user.productsAdded = 0; // Reset on upgrade
      }
    }

    // Handle extension
    if (extendDays) {
      if (subscription.endDate) {
        subscription.endDate = new Date(
          subscription.endDate.getTime() + extendDays * 24 * 60 * 60 * 1000
        );
      } else {
        // If no end date (lifetime), can't extend
        throw createError('Cannot extend a lifetime subscription', 400);
      }

      // Update user model
      user.planExpiresAt = subscription.endDate;
      actionType = 'manual_extension';
    }

    // Handle admin note update
    if (adminNote && !planCode && !extendDays) {
      subscription.adminNote = adminNote;
      actionType = 'note_added';
    } else if (adminNote) {
      // If adminNote is provided along with other changes, just update it
      subscription.adminNote = adminNote;
    }

    // Add history entry
    const historyNotes = adminNote || 
      (actionType === 'manual_upgrade' ? 'Plan upgraded by admin' : 
       actionType === 'manual_extension' ? 'Plan extended by admin' : 
       'Admin note added');
    
    // Use valid action type for history
    const historyAction = actionType === 'note_added' ? 'manual_extension' : actionType;
    
    subscription.history.push({
      action: historyAction as 'manual_upgrade' | 'manual_extension',
      timestamp: now,
      adminId: (req.user as any)._id,
      notes: historyNotes,
    });

    await subscription.save();
    await user.save();

    // Create audit log
    try {
      let auditAction: string;
      if (actionType === 'manual_upgrade') {
        auditAction = 'SUBSCRIPTION_UPGRADED';
      } else if (actionType === 'note_added') {
        auditAction = 'SUBSCRIPTION_NOTE_ADDED';
      } else {
        auditAction = 'SUBSCRIPTION_EXTENDED';
      }
      
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: auditAction,
        success: true,
        details: {
          targetUserId: userId,
          subscriptionId: subscription._id,
          planCode: planCode || subscription.planCode,
          extendDays,
          adminNote,
          actionType: actionType,
        },
        ipAddress: req.ip,
      });
    } catch (auditError) {
      console.error('Failed to log subscription update:', auditError);
    }

    const successMessage = actionType === 'manual_upgrade' 
      ? 'Subscription upgraded successfully' 
      : actionType === 'note_added'
      ? 'Admin note added successfully'
      : 'Subscription extended successfully';

    res.json({
      success: true,
      message: successMessage,
      data: {
        subscription: {
          id: subscription._id,
          planCode: subscription.planCode,
          planName: plans[subscription.planCode as keyof typeof plans]?.name || subscription.planCode,
          status: subscription.status,
          endDate: subscription.endDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user's subscription with trial info
 * GET /api/subscriptions/current
 */
export const getCurrentSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const subscription = await Subscription.findOne({
      userId: (req.user as any)._id,
      status: { $in: ['active', 'trialing', 'manually_granted'] },
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(200).json({
        success: true,
        data: {
          subscription: null,
        },
      });
    }

    const plan = plans[subscription.planCode as PlanCode];

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          planCode: subscription.planCode,
          planName: plan?.name || subscription.planCode,
          status: subscription.status,
          startDate: subscription.startDate,
          trialEndsAt: subscription.trialEndsAt,
          endDate: subscription.endDate,
          amountPaid: subscription.amountPaid,
          razorpaySubscriptionId: subscription.razorpaySubscriptionId,
          history: subscription.history,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel subscription
 * POST /api/subscriptions/:id/cancel
 */
export const cancelSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: (req.user as any)._id,
    });

    if (!subscription) {
      throw createError('Subscription not found', 404);
    }

    if (!subscription.razorpaySubscriptionId) {
      throw createError('Subscription cannot be cancelled - no Razorpay subscription ID', 400);
    }

    // Cancel via Razorpay API
    await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId);

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.history.push({
      action: 'subscription_cancelled',
      timestamp: new Date(),
      notes: 'Subscription cancelled by user',
    });
    await subscription.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscription: {
          id: subscription._id,
          status: subscription.status,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get subscription status from Razorpay
 * GET /api/subscriptions/:id/status
 */
export const getSubscriptionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      userId: (req.user as any)._id,
    });

    if (!subscription) {
      throw createError('Subscription not found', 404);
    }

    if (!subscription.razorpaySubscriptionId) {
      throw createError('No Razorpay subscription ID found', 400);
    }

    // Fetch from Razorpay
    const razorpaySubscription = await razorpayService.getSubscription(subscription.razorpaySubscriptionId);

    res.status(200).json({
      success: true,
      data: {
        razorpayStatus: razorpaySubscription.status,
        razorpaySubscription: {
          id: razorpaySubscription.id,
          status: razorpaySubscription.status,
          current_start: razorpaySubscription.current_start,
          current_end: razorpaySubscription.current_end,
          ended_at: razorpaySubscription.ended_at,
          quantity: razorpaySubscription.quantity,
          notes: razorpaySubscription.notes,
        },
        localStatus: subscription.status,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
