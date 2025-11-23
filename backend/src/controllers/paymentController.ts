import express, { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, getSubscriptionStatus } from '../models/User';
import { Payment } from '../models/Payment';
import { razorpayService } from '../services/RazorpayService';
import { plans, isValidPlanCode, PlanCode } from '../config/plans';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

/**
 * Create Razorpay order
 * POST /api/payments/create-order
 */
export const createOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { planCode } = req.body;

    if (!planCode || typeof planCode !== 'string') {
      throw createError('Plan code is required', 400);
    }

    if (!isValidPlanCode(planCode)) {
      throw createError('Invalid plan code', 400);
    }

    const plan = plans[planCode];
    const amount = plan.price;
    // Razorpay receipt must be max 40 characters
    // Format: rcp_<userId_last12chars>_<timestamp_last8chars>
    const userId = (req.user as any)._id;
    const userIdStr = typeof userId === 'string' ? userId : userId.toString();
    const userIdShort = userIdStr.slice(-12); // Last 12 chars of ObjectId
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `rcp_${userIdShort}_${timestamp}`; // Max 3 + 1 + 12 + 1 + 8 = 25 chars

    console.log('Creating payment order for plan:', planCode, 'amount:', amount, 'receipt:', receipt);

    // Create Razorpay order
    const order = await razorpayService.createOrder(amount, 'INR', receipt);

    console.log('Razorpay order created, saving payment record...');

    // Save payment record with status 'created'
    const payment = await Payment.create({
      userId: (req.user as any)._id,
      orderId: order.id,
      razorpayOrderId: order.id,
      planCode: planCode as PlanCode,
      status: 'created',
      amount: amount,
      currency: 'INR',
    });

    console.log('Payment record saved:', payment._id);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayService.getKeyId(),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Verify payment and activate subscription
 * POST /api/payments/verify
 */
export const verifyPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planCode } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planCode) {
      throw createError('Missing required payment fields', 400);
    }

    if (!isValidPlanCode(planCode)) {
      throw createError('Invalid plan code', 400);
    }

    // Replay Protection: Check if paymentId already exists
    const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id });
    if (existingPayment && existingPayment.status === 'paid') {
      // Already processed, return success (idempotent)
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        data: {
          plan: req.user.plan,
          status: getSubscriptionStatus(req.user),
        },
      });
    }

    // Verify signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      throw createError('Invalid payment signature', 400);
    }

    // Amount Validation: Fetch order from Razorpay and verify amount
    const order = await razorpayService.getOrder(razorpay_order_id);
    const plan = plans[planCode];
    
    if (order.amount !== plan.price) {
      throw createError('Payment amount mismatch', 400);
    }

    // Find or create payment record
    let payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      payment = await Payment.create({
        userId: (req.user as any)._id,
        orderId: razorpay_order_id,
        razorpayOrderId: razorpay_order_id,
        planCode: planCode as PlanCode,
        status: 'created',
        amount: plan.price,
        currency: 'INR',
      });
    }

    // Update payment status
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = 'paid';
    await payment.save();

    // Update user subscription with upgrade/extension rules
    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    const now = new Date();
    const isUpgrade = user.plan && user.plan !== planCode;
    const isRenewal = user.plan === planCode;

    // Upgrade Logic: If upgrading, override with new plan (don't extend)
    // Extension Logic: If renewing same plan or expired, extend from now or current expiry
    if (isUpgrade) {
      // Upgrading - override with new plan
      user.plan = planCode;
      if (plan.isLifetime) {
        user.planExpiresAt = null;
        user.isLifetime = true;
      } else {
        user.planExpiresAt = new Date(now.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
        user.isLifetime = false;
      }
    } else if (isRenewal) {
      // Renewing same plan - extend from current expiry if active, otherwise from now
      if (user.planExpiresAt && user.planExpiresAt > now) {
        // Extend from current expiry
        user.planExpiresAt = new Date(user.planExpiresAt.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
      } else {
        // Expired or no expiry - start from now
        if (plan.isLifetime) {
          user.planExpiresAt = null;
          user.isLifetime = true;
        } else {
          user.planExpiresAt = new Date(now.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
          user.isLifetime = false;
        }
      }
    } else {
      // New subscription
      user.plan = planCode;
      if (plan.isLifetime) {
        user.planExpiresAt = null;
        user.isLifetime = true;
      } else {
        user.planExpiresAt = new Date(now.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
        user.isLifetime = false;
      }
    }

    // Note: Do NOT reset productsAdded counter on upgrade/renewal
    await user.save();

    // Create notification
    const planName = plan.name;
    const notificationMessage = plan.isLifetime
      ? `Your ${planName} subscription has been activated! You now have lifetime access.`
      : isUpgrade
      ? `You've successfully upgraded to ${planName}! Your subscription expires on ${user.planExpiresAt?.toLocaleDateString()}.`
      : isRenewal
      ? `Your ${planName} subscription has been renewed! It now expires on ${user.planExpiresAt?.toLocaleDateString()}.`
      : `Your ${planName} subscription has been activated! It expires on ${user.planExpiresAt?.toLocaleDateString()}.`;

    await createNotification({
      userId: (req.user as any)._id,
      type: 'system_update',
      title: 'Subscription Activated',
      message: notificationMessage,
      link: '/dashboard/billing',
      metadata: {
        planCode,
        planName,
        isLifetime: plan.isLifetime,
        planExpiresAt: user.planExpiresAt?.toISOString(),
        isUpgrade,
        isRenewal,
        paymentId: razorpay_payment_id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      data: {
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        isLifetime: user.isLifetime,
        status: getSubscriptionStatus(user),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Handle Razorpay webhook
 * POST /api/payments/webhook
 * CRITICAL: Must use express.raw middleware for this route
 */
export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get raw body buffer (from express.raw middleware)
    // express.raw() sets req.body to Buffer
    const rawBody = Buffer.isBuffer((req as any).body) 
      ? (req as any).body 
      : Buffer.from(JSON.stringify((req as any).body || {}));
    
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing webhook signature' });
      return;
    }

    // Verify webhook signature with raw body
    const isValidSignature = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    // Parse webhook event from raw body
    const event = JSON.parse(rawBody.toString());
    const { event: eventType, payload } = event;

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity;
      const order = payload.order.entity;

      // Replay Protection: Check if paymentId already exists
      const existingPayment = await Payment.findOne({ paymentId: payment.id });
      if (existingPayment && existingPayment.status === 'paid') {
        // Already processed, return 200
        res.status(200).json({ success: true, message: 'Already processed' });
        return;
      }

      // Find payment record by orderId
      const paymentRecord = await Payment.findOne({ orderId: order.id });
      if (!paymentRecord) {
        console.error('Payment record not found for order:', order.id);
        res.status(200).json({ success: true }); // Return 200 to Razorpay even if error
        return;
      }

      // Amount Validation
      const plan = plans[paymentRecord.planCode];
      if (order.amount !== plan.price) {
        console.error('Amount mismatch in webhook:', order.amount, 'expected:', plan.price);
        res.status(200).json({ success: true }); // Return 200 to Razorpay
        return;
      }

      // Update payment status
      paymentRecord.paymentId = payment.id;
      paymentRecord.status = 'paid';
      await paymentRecord.save();

      // Update user subscription (same logic as verify endpoint)
      const user = await User.findById(paymentRecord.userId);
      if (user) {
        const now = new Date();
        const isUpgrade = user.plan && user.plan !== paymentRecord.planCode;
        const isRenewal = user.plan === paymentRecord.planCode;

        if (isUpgrade) {
          user.plan = paymentRecord.planCode;
          if (plan.isLifetime) {
            user.planExpiresAt = null;
            user.isLifetime = true;
          } else {
            user.planExpiresAt = new Date(now.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
            user.isLifetime = false;
          }
        } else if (isRenewal) {
          if (user.planExpiresAt && user.planExpiresAt > now) {
            user.planExpiresAt = new Date(user.planExpiresAt.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
          } else {
            if (plan.isLifetime) {
              user.planExpiresAt = null;
              user.isLifetime = true;
            } else {
              user.planExpiresAt = new Date(now.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
              user.isLifetime = false;
            }
          }
        } else {
          user.plan = paymentRecord.planCode;
          if (plan.isLifetime) {
            user.planExpiresAt = null;
            user.isLifetime = true;
          } else {
            user.planExpiresAt = new Date(now.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
            user.isLifetime = false;
          }
        }

        await user.save();
      }
    }

    // Handle payment.failed event
    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity;
      const order = payload.order.entity;

      const paymentRecord = await Payment.findOne({ orderId: order.id });
      if (paymentRecord) {
        paymentRecord.status = 'failed';
        paymentRecord.paymentId = payment.id;
        await paymentRecord.save();
      }
    }

    // Always return 200 immediately to Razorpay
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    // Still return 200 to Razorpay to prevent retries
    res.status(200).json({ success: true });
  }
};

/**
 * Get available plans
 * GET /api/payments/plans
 */
export const getPlans = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const plansArray = Object.entries(plans).map(([code, plan]) => ({
      code,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      isLifetime: plan.isLifetime,
      maxProducts: plan.maxProducts,
      features: plan.features,
    }));

    res.status(200).json({
      success: true,
      data: {
        plans: plansArray,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get payment history
 * GET /api/payments/history
 */
export const getPaymentHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const payments = await Payment.find({ userId: (req.user as any)._id })
      .sort({ createdAt: -1 })
      .select('planCode amount status createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get current subscription status
 * GET /api/payments/current-plan
 */
export const getCurrentPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    const status = getSubscriptionStatus(user);
    const maxProducts = user.plan ? plans[user.plan as PlanCode]?.maxProducts ?? null : null;
    const productsRemaining = maxProducts === null ? null : Math.max(0, maxProducts - user.productsAdded);

    res.status(200).json({
      success: true,
      data: {
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        isLifetime: user.isLifetime,
        status,
        maxProducts,
        productsAdded: user.productsAdded,
        productsRemaining,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

