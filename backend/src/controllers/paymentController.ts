import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { User, getSubscriptionStatus } from '../models/User';
import { Payment } from '../models/Payment';
import { Subscription } from '../models/Subscription';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { Order } from '../models/Order';
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
    
    // Set planName for easy queries
    payment.planName = plan.name;
    await payment.save();

    // Update user subscription with upgrade/extension rules
    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    const now = new Date();
    const isUpgrade = user.plan && user.plan !== planCode;
    const isRenewal = user.plan === planCode;

    // Calculate end date
    let endDate: Date | null = null;
    if (plan.isLifetime) {
      endDate = null;
    } else if (isRenewal && user.planExpiresAt && user.planExpiresAt > now) {
      // Extend from current expiry
      endDate = new Date(user.planExpiresAt.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
    } else {
      // New subscription or expired - start from now
      endDate = plan.durationDays
        ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
        : null;
    }

    // Upgrade Logic: If upgrading, override with new plan (don't extend)
    // Extension Logic: If renewing same plan or expired, extend from now or current expiry
    if (isUpgrade) {
      // Upgrading - override with new plan and reset productsAdded to give full benefit of new plan
      user.plan = planCode;
      user.productsAdded = 0; // Reset to 0 so user gets full benefit of new plan limit
      if (plan.isLifetime) {
        user.planExpiresAt = null;
        user.isLifetime = true;
      } else {
        user.planExpiresAt = endDate;
        user.isLifetime = false;
      }
    } else if (isRenewal) {
      // Renewing same plan - extend from current expiry if active, otherwise from now
      user.planExpiresAt = endDate;
      user.isLifetime = plan.isLifetime;
    } else {
      // New subscription
      user.plan = planCode;
      user.planExpiresAt = endDate;
      user.isLifetime = plan.isLifetime;
    }

    // Note: productsAdded is reset to 0 on upgrade to give full benefit of new plan
    await user.save();

    // Create or update Subscription record
    let subscription = await Subscription.findOne({
      userId: (req.user as any)._id,
      status: { $in: ['active', 'manually_granted'] },
    });

    if (subscription) {
      // Update existing subscription
      if (isUpgrade) {
        subscription.planCode = planCode as PlanCode;
        subscription.amountPaid = plan.price;
        subscription.history.push({
          action: 'payment_received',
          timestamp: now,
          notes: `Payment received - plan upgraded to ${plan.name}`,
        });
      } else {
        subscription.history.push({
          action: isRenewal ? 'auto_renewal' : 'payment_received',
          timestamp: now,
          notes: isRenewal
            ? `Payment received - subscription renewed`
            : `Payment received - new subscription`,
        });
      }
      subscription.endDate = endDate;
      subscription.razorpayPaymentId = razorpay_payment_id;
      await subscription.save();
    } else {
      // Create new subscription
      subscription = await Subscription.create({
        userId: (req.user as any)._id,
        planCode: planCode as PlanCode,
        status: 'active',
        startDate: now,
        endDate: endDate,
        amountPaid: plan.price,
        source: 'razorpay',
        razorpayPaymentId: razorpay_payment_id,
        history: [
          {
            action: 'subscription_activated',
            timestamp: now,
            notes: `Subscription activated via payment`,
          },
        ],
      });
    }

    // Link payment to subscription
    payment.subscriptionId = subscription._id as mongoose.Types.ObjectId;
    await payment.save();

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

      // Check if this is a wallet topup (receipt starts with 'wtp_')
      const isWalletTopup = order.receipt && order.receipt.startsWith('wtp_');

      if (isWalletTopup) {
        // Handle wallet topup via webhook
        await handleWalletTopupWebhook(payment, order);
        res.status(200).json({ success: true, message: 'Wallet topup processed' });
        return;
      }

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
      paymentRecord.planName = plan.name;
      await paymentRecord.save();

      // Update user subscription (same logic as verify endpoint)
      const user = await User.findById(paymentRecord.userId);
      if (user) {
        const now = new Date();
        const isUpgrade = user.plan && user.plan !== paymentRecord.planCode;
        const isRenewal = user.plan === paymentRecord.planCode;

        // Calculate end date
        let endDate: Date | null = null;
        if (plan.isLifetime) {
          endDate = null;
        } else if (isRenewal && user.planExpiresAt && user.planExpiresAt > now) {
          endDate = new Date(user.planExpiresAt.getTime() + plan.durationDays! * 24 * 60 * 60 * 1000);
        } else {
          endDate = plan.durationDays
            ? new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
            : null;
        }

        if (isUpgrade) {
          user.plan = paymentRecord.planCode;
          user.productsAdded = 0;
          if (plan.isLifetime) {
            user.planExpiresAt = null;
            user.isLifetime = true;
          } else {
            user.planExpiresAt = endDate;
            user.isLifetime = false;
          }
        } else if (isRenewal) {
          user.planExpiresAt = endDate;
          user.isLifetime = plan.isLifetime;
        } else {
          user.plan = paymentRecord.planCode;
          user.planExpiresAt = endDate;
          user.isLifetime = plan.isLifetime;
        }

        await user.save();

        // Create or update Subscription record
        let subscription = await Subscription.findOne({
          userId: paymentRecord.userId,
          status: { $in: ['active', 'manually_granted'] },
        });

        if (subscription) {
          if (isUpgrade) {
            subscription.planCode = paymentRecord.planCode as PlanCode;
            subscription.amountPaid = plan.price;
            subscription.history.push({
              action: 'payment_received',
              timestamp: now,
              notes: `Payment received via webhook - plan upgraded to ${plan.name}`,
            });
          } else {
            subscription.history.push({
              action: isRenewal ? 'auto_renewal' : 'payment_received',
              timestamp: now,
              notes: isRenewal
                ? `Payment received via webhook - subscription renewed`
                : `Payment received via webhook - new subscription`,
            });
          }
          subscription.endDate = endDate;
          subscription.razorpayPaymentId = payment.id;
          await subscription.save();
        } else {
          subscription = await Subscription.create({
            userId: paymentRecord.userId,
            planCode: paymentRecord.planCode as PlanCode,
            status: 'active',
            startDate: now,
            endDate: endDate,
            amountPaid: plan.price,
            source: 'razorpay',
            razorpayPaymentId: payment.id,
            history: [
              {
                action: 'subscription_activated',
                timestamp: now,
                notes: `Subscription activated via webhook`,
              },
            ],
          });
        }

        // Link payment to subscription
        paymentRecord.subscriptionId = subscription._id as mongoose.Types.ObjectId;
        await paymentRecord.save();
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

    // Handle subscription events
    if (eventType === 'subscription.activated') {
      const subscription = payload.subscription.entity;
      // Update subscription record if exists
      const subRecord = await Subscription.findOne({
        razorpaySubscriptionId: subscription.id,
      });
      if (subRecord) {
        subRecord.status = 'active';
        subRecord.history.push({
          action: 'subscription_activated',
          timestamp: new Date(),
          notes: 'Subscription activated via Razorpay',
        });
        await subRecord.save();
      }
    }

    if (eventType === 'subscription.charged') {
      const subscription = payload.subscription.entity;
      const payment = payload.payment.entity;
      
      const subRecord = await Subscription.findOne({
        razorpaySubscriptionId: subscription.id,
      });
      if (subRecord) {
        subRecord.razorpayPaymentId = payment.id;
        subRecord.history.push({
          action: 'auto_renewal',
          timestamp: new Date(),
          notes: `Auto-renewal payment received`,
        });
        await subRecord.save();
      }
    }

    if (eventType === 'subscription.cancelled') {
      const subscription = payload.subscription.entity;
      const subRecord = await Subscription.findOne({
        razorpaySubscriptionId: subscription.id,
      });
      if (subRecord) {
        subRecord.status = 'cancelled';
        subRecord.history.push({
          action: 'subscription_cancelled',
          timestamp: new Date(),
          notes: 'Subscription cancelled via Razorpay',
        });
        await subRecord.save();
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

/**
 * Handle wallet topup via webhook
 * This is called when a payment.captured event is received for a wallet topup
 */
async function handleWalletTopupWebhook(payment: any, order: any): Promise<void> {
  try {
    // Extract userId from receipt: wtp_<userId_last12>_<timestamp>
    const receipt = order.receipt;
    const paymentId = payment.id;
    const amount = order.amount; // in paise

    // Check idempotency - prevent double-credit
    const existingTx = await WalletTransaction.findOne({ referenceId: paymentId });
    if (existingTx) {
      console.log('Wallet topup already processed for payment:', paymentId);
      return;
    }

    // Find the user's wallet - we need to find the wallet that was used to create this order
    // Since we store receipt as wtp_<userId_last12>_<timestamp>, we need to find wallet by partial match
    const userIdPartial = receipt.split('_')[1]; // Get the userId portion
    
    // Find wallets and match by last 12 chars of userId
    const wallets = await Wallet.find({}).populate('userId', '_id');
    let targetWallet = null;
    
    for (const wallet of wallets) {
      const walletUserId = (wallet.userId as any)._id?.toString() || wallet.userId.toString();
      if (walletUserId.slice(-12) === userIdPartial) {
        targetWallet = wallet;
        break;
      }
    }

    if (!targetWallet) {
      console.error('Wallet not found for receipt:', receipt);
      return;
    }

    const userId = targetWallet.userId;
    const balanceBefore = targetWallet.balance;
    const balanceAfter = balanceBefore + amount;

    // Update wallet balance atomically
    await Wallet.findByIdAndUpdate(
      targetWallet._id,
      { $inc: { balance: amount } },
      { new: true }
    );

    // Create transaction record
    await WalletTransaction.create({
      walletId: targetWallet._id,
      userId,
      amount,
      type: 'credit',
      reason: 'Topup - Razorpay',
      referenceId: paymentId,
      balanceBefore,
      balanceAfter,
      metadata: {
        razorpayOrderId: order.id,
        razorpayPaymentId: paymentId,
        source: 'webhook',
      },
    });

    // Create notification for user
    await createNotification({
      userId,
      type: 'system_update',
      title: 'Wallet Topped Up',
      message: `₹${(amount / 100).toLocaleString('en-IN')} has been added to your wallet.`,
      link: '/dashboard/wallet',
      metadata: {
        amount,
        paymentId,
      },
    });

    // Auto-resume awaiting orders
    await autoResumeAwaitingOrders(userId, balanceAfter);

    console.log('Wallet topup processed via webhook:', {
      userId: userId.toString(),
      amount,
      newBalance: balanceAfter,
    });
  } catch (error) {
    console.error('Error processing wallet topup webhook:', error);
    // Don't throw - we still want to return 200 to Razorpay
  }
}

/**
 * Auto-resume orders that are awaiting wallet balance
 * Called after a successful wallet topup
 */
async function autoResumeAwaitingOrders(
  userId: mongoose.Types.ObjectId,
  currentBalance: number
): Promise<void> {
  try {
    // Find orders that are awaiting wallet for this user
    const awaitingOrders = await Order.find({
      userId,
      zenStatus: 'awaiting_wallet',
    }).sort({ createdAt: 1 }); // Process oldest first

    for (const order of awaitingOrders) {
      const requiredAmount = order.productCost + order.shippingCost + order.serviceFee;

      if (currentBalance >= requiredAmount) {
        // We have enough balance - this will be processed by the fulfill-via-zen endpoint
        // For now, just log that orders are ready to be resumed
        console.log('Order ready to be auto-resumed:', {
          orderId: order._id,
          shopifyOrderName: order.shopifyOrderName,
          requiredAmount,
          currentBalance,
        });

        // Note: The actual fulfillment will be handled when user clicks fulfill button
        // or through a separate auto-fulfill job. We don't auto-deduct here to avoid
        // unintended charges - user should explicitly trigger fulfillment.
      }
    }
  } catch (error) {
    console.error('Error checking awaiting orders:', error);
  }
}

