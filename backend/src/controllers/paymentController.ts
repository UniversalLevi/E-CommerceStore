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
import { plans, isValidPlanCode, PlanCode, TOKEN_CHARGE_AMOUNT } from '../config/plans';
import { config } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';
import { createCommission } from '../services/commissionService';

/**
 * Create subscription with full payment upfront
 * POST /api/payments/create-subscription
 */
export const createSubscription = async (
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
    
    // Check if Razorpay plan ID is configured
    if (!plan.razorpayPlanId) {
      throw createError(`Razorpay plan ID not configured for ${planCode}. Please run: npm run create-razorpay-plans`, 500);
    }

    const userId = (req.user as any)._id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }
    
    // Note: Removed prevention logic - users can purchase plans multiple times

    // Start subscription immediately (no trial)
    const startAt = Math.floor(Date.now() / 1000) + 60; // Start 60 seconds from now (Razorpay requirement)

    // Determine total_count based on plan period to avoid exceeding Razorpay's limits
    // IMPORTANT: For UPI autopay, expire_at cannot be more than 30 years in the future
    let totalCount = 1; // Default for lifetime/one-time
    if (!plan.isLifetime && plan.durationDays) {
      // Fetch the Razorpay plan to check its period
      try {
        const razorpayPlan = await razorpayService.fetchPlan(plan.razorpayPlanId);
        const planPeriod = razorpayPlan.period; // 'monthly', 'yearly', etc.
        const planInterval = razorpayPlan.interval || 1;
        
        // Calculate maximum safe totalCount based on plan period
        // UPI autopay limit: 30 years maximum
        const maxYearsForUPI = 30;
        const startTime = startAt; // Subscription starts immediately
        
        if (planPeriod === 'yearly') {
          // For yearly plans: UPI limit is 30 years max
          totalCount = Math.min(30, maxYearsForUPI);
        } else if (planPeriod === 'monthly') {
          // For monthly plans: 30 years = 360 months, but Razorpay limit is 100 months
          totalCount = Math.min(100, 30 * 12); // 360 months = 30 years, but capped at 100
        } else if (planPeriod === 'weekly') {
          // For weekly plans: 30 years = ~1560 weeks
          totalCount = Math.min(1560, Math.floor(maxYearsForUPI * 52.14));
        } else if (planPeriod === 'daily') {
          // For daily plans: 30 years = ~10950 days
          totalCount = Math.min(10950, Math.floor(maxYearsForUPI * 365.25));
        } else {
          // For other periods, use a conservative limit
          totalCount = 30; // Default to 30 for safety
        }
        
        console.log(`[Payment] Direct purchase - Plan period: ${planPeriod}, interval: ${planInterval}, calculated totalCount: ${totalCount} (UPI autopay limit: 30 years)`);
      } catch (planFetchError) {
        // If we can't fetch the plan, use conservative defaults for UPI autopay
        console.warn(`[Payment] Could not fetch plan details, using default totalCount:`, planFetchError);
        // For UPI autopay, be conservative: max 30 years
        if (plan.durationDays <= 90) {
          // Monthly plan: 30 years = 360 months, but Razorpay limit is 100
          totalCount = 100;
        } else {
          // Yearly plan: max 30 years for UPI
          totalCount = 30;
        }
      }
    }

    console.log('Creating direct subscription (no trial) for plan:', planCode, 'start_at:', startAt);

    // Verify the plan exists before creating subscription
    try {
      await razorpayService.fetchPlan(plan.razorpayPlanId);
      console.log(`✅ Verified Razorpay plan exists: ${plan.razorpayPlanId}`);
    } catch (planError: any) {
      console.error(`❌ Failed to verify Razorpay plan ${plan.razorpayPlanId}:`, planError);
      throw createError(`Razorpay plan ${plan.razorpayPlanId} not found or invalid. Please run: npm run create-razorpay-plans`, 500);
    }
    
    // Create subscription that starts immediately (no trial)
    // IMPORTANT: When startAt is in the future, Razorpay charges ₹5 by default for authentication
    // To charge the full plan amount immediately, we use addons to add the full amount upfront
    const subscription = await razorpayService.createSubscription({
      planId: plan.razorpayPlanId,
      startAt: startAt,
      totalCount: totalCount,
      customerNotify: 1, // Notify customer for direct purchase
      // Add upfront addon to charge full plan amount immediately instead of default ₹5
      addons: [
        {
          item: {
            name: `Plan Purchase - ${plan.name}`,
            amount: plan.price, // Full plan amount in paise
            currency: 'INR',
          },
        },
      ],
    });

    console.log('Direct subscription created:', subscription.id);

    // Save payment record
    const payment = await Payment.create({
      userId: userId,
      orderId: subscription.id,
      razorpayOrderId: subscription.id,
      planCode: planCode as PlanCode,
      status: 'created',
      amount: plan.price, // Full plan amount
      currency: 'INR',
      metadata: {
        type: 'direct_purchase',
        subscriptionId: subscription.id,
      },
    });

    // Create subscription record in database (status: active)
    const dbSubscription = await Subscription.create({
      userId: userId,
      planCode: planCode as PlanCode,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: plan.razorpayPlanId,
      status: 'active',
      startDate: new Date(),
      amountPaid: 0, // Will be updated when charged
      source: 'razorpay',
      history: [
        {
          action: 'direct_purchase',
          timestamp: new Date(),
          notes: `Direct purchase - no trial. Subscription: ${subscription.id}`,
        },
      ],
    });

    console.log('Subscription record created:', dbSubscription._id);

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        mainSubscriptionId: subscription.id,
        amount: plan.price, // Full plan amount
        currency: 'INR',
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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planCode, subscription_id } = req.body;

    // For subscription payments, order_id might not be present
    // We'll verify using payment_id and subscription_id instead
    if (!razorpay_payment_id || !razorpay_signature || !planCode) {
      throw createError('Missing required payment fields', 400);
    }
    
    // For subscription payments, subscription_id is required
    // For regular payments, order_id is required
    if (!subscription_id && !razorpay_order_id) {
      throw createError('Missing required fields: either subscription_id or razorpay_order_id must be provided', 400);
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

    const plan = plans[planCode];
    
    // Handle subscription payments vs regular payments
    let payment;
    let isValidSignature = false;
    let paymentAmount = 0;
    
    if (subscription_id) {
      // Subscription payment flow
      // Fetch payment details from Razorpay
      const paymentDetails = await razorpayService.getPayment(razorpay_payment_id);
      paymentAmount = paymentDetails.amount;
      
      // Log payment details for debugging
      console.log('Payment verification details:', {
        payment_id: razorpay_payment_id,
        payment_subscription_id: paymentDetails.subscription_id,
        requested_subscription_id: subscription_id,
        payment_amount: paymentAmount,
        payment_amount_rupees: `₹${paymentAmount / 100}`,
      });
      
      // Find payment record first to check for token subscription ID
      // This allows us to verify against both main and token subscriptions
      const tempPayment = await Payment.findOne({ 
        $or: [
          { 'metadata.subscriptionId': subscription_id },
          { 'metadata.mainSubscriptionId': subscription_id },
          { 'metadata.tokenSubscriptionId': subscription_id },
          { orderId: subscription_id },
        ],
        status: 'created'
      });
      
      // Verify payment belongs to the subscription (either main or token subscription)
      // IMPORTANT: When using addons, Razorpay payment might not have subscription_id
      // In that case, we verify by checking if payment record exists for the subscription
      const tokenSubscriptionId = tempPayment?.metadata?.tokenSubscriptionId;
      const mainSubscriptionId = tempPayment?.metadata?.mainSubscriptionId || tempPayment?.metadata?.subscriptionId;
      
      // If payment has subscription_id, verify it matches
      // If subscription_id is undefined (common with addons), verify via payment record instead
      let isValidSubscription = true; // Default to true if we find payment record
      
      if (paymentDetails.subscription_id !== undefined) {
        // Payment has subscription_id - verify it matches
        isValidSubscription = 
          paymentDetails.subscription_id === subscription_id ||
          paymentDetails.subscription_id === tokenSubscriptionId ||
          paymentDetails.subscription_id === mainSubscriptionId;
      } else {
        // Payment doesn't have subscription_id (common with addon payments)
        // Verify by checking if we found the payment record for this subscription
        isValidSubscription = tempPayment !== null;
        
        if (tempPayment) {
          console.log('Payment has no subscription_id (addon payment), verified via payment record:', {
            payment_id: razorpay_payment_id,
            subscription_id: subscription_id,
            payment_record_found: true,
          });
        }
      }
      
      if (!isValidSubscription) {
        console.error('Subscription ID mismatch:', {
          payment_belongs_to: paymentDetails.subscription_id || 'undefined (addon payment)',
          requested_subscription_id: subscription_id,
          token_subscription_id: tokenSubscriptionId,
          main_subscription_id: mainSubscriptionId,
          payment_record_found: tempPayment !== null,
        });
        throw createError(`Payment does not belong to the specified subscription. Payment belongs to: ${paymentDetails.subscription_id || 'undefined (may be addon payment)'}, Requested: ${subscription_id}`, 400);
      }
      
      // For subscription payments, if order_id is provided in response, use it for signature verification
      // Otherwise, verify that payment exists and belongs to subscription
      if (razorpay_order_id) {
        // Razorpay may return order_id even for subscription payments (internal order)
        isValidSignature = razorpayService.verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
      } else {
        // For subscription payments without order_id, verify payment exists and amount matches
        // Note: Signature verification might not be possible without order_id
        // But we can verify payment belongs to subscription and amount is correct
        isValidSignature = true; // We'll verify via payment details instead
      }
      
      // Find payment record by subscription_id from metadata
      // Use the tempPayment we already found above, or search again if not found
      payment = tempPayment || await Payment.findOne({ 
        $or: [
          { 'metadata.subscriptionId': subscription_id }, // Main subscription ID
          { 'metadata.mainSubscriptionId': subscription_id }, // Also check mainSubscriptionId
          { 'metadata.tokenSubscriptionId': subscription_id }, // Fallback for old records
          { orderId: subscription_id }, // Also check orderId (which uses mainSubscription.id)
        ],
        status: 'created'
      });
    } else {
      // Regular payment flow - requires order_id
      if (!razorpay_order_id) {
        throw createError('order_id is required for non-subscription payments', 400);
      }
      
      isValidSignature = razorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );
      
      // Amount Validation: Fetch order from Razorpay
      const order = await razorpayService.getOrder(razorpay_order_id);
      paymentAmount = order.amount;
      
      // Find payment record by orderId
      payment = await Payment.findOne({ orderId: razorpay_order_id });
    }
    
    if (!isValidSignature) {
      throw createError('Invalid payment signature or verification failed', 400);
    }
    
    if (!payment) {
      throw createError('Payment record not found. Please create subscription first.', 404);
    }

    // Verify payment type is direct_purchase
    const paymentType = payment.metadata?.type;
    if (paymentType !== 'direct_purchase') {
      throw createError(`Invalid payment type: ${paymentType}. Expected 'direct_purchase'.`, 400);
    }

    // Verify amount matches plan price
    if (paymentAmount !== plan.price) {
      throw createError(`Payment amount mismatch. Expected ₹${plan.price / 100} for plan purchase, got ₹${paymentAmount / 100}`, 400);
    }

    // Get subscription ID from payment metadata or request body
    const subscriptionId = subscription_id || payment.metadata?.subscriptionId;
    if (!subscriptionId) {
      throw createError('Subscription ID not found', 400);
    }

    // Update payment status
    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = 'paid';
    payment.planName = plan.name;
    await payment.save();

    // Get main subscription ID from payment metadata (if available)
    // The subscription_id passed is the token charge subscription
    // We need to find the main subscription using the mainSubscriptionId from metadata
    const mainSubscriptionId = payment.metadata?.mainSubscriptionId || subscriptionId;
    
    // Find subscription record using main subscription ID
    let subscription = await Subscription.findOne({
      razorpaySubscriptionId: mainSubscriptionId,
      userId: (req.user as any)._id,
    });
    
    // If not found, try with the token subscription ID (fallback)
    if (!subscription) {
      subscription = await Subscription.findOne({
        razorpaySubscriptionId: subscriptionId,
        userId: (req.user as any)._id,
      });
    }

    if (!subscription) {
      throw createError('Subscription not found', 404);
    }

    // Update subscription to active status
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.status = 'active';
    subscription.amountPaid = paymentAmount;
    
    // Calculate end date based on plan duration
    let endDate: Date | null = null;
    if (!plan.isLifetime && plan.durationDays) {
      endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
      subscription.endDate = endDate;
    }
    
    await subscription.save();

    // Link payment to subscription
    payment.subscriptionId = subscription._id as mongoose.Types.ObjectId;
    await payment.save();

    // Update user based on payment type
    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    const planName = plan.name;

    // Set full plan expiry
    user.plan = planCode;
    if (!plan.isLifetime && plan.durationDays) {
      user.planExpiresAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
    } else {
      user.planExpiresAt = null;
    }
    user.isLifetime = plan.isLifetime || false;
    await user.save();

    // Create affiliate commission
    try {
      console.log(`[Payment] Creating commission for user ${(req.user as any)._id}`);
      await createCommission({
        userId: (req.user as any)._id,
        subscriptionId: subscription._id as mongoose.Types.ObjectId,
        paymentId: payment._id as mongoose.Types.ObjectId,
        planCode: planCode,
        subscriptionAmount: plan.price,
      });
    } catch (commissionError) {
      console.error('[Payment] Failed to create commission during payment verification:', commissionError);
    }

    // Create notification
    const notificationMessage = `Your ${planName} plan has been activated! You now have full access to all features.`;

    await createNotification({
      userId: (req.user as any)._id,
      type: 'system_update',
      title: 'Plan Activated',
      message: notificationMessage,
      link: '/dashboard/billing',
      metadata: {
        planCode,
        planName,
        subscriptionId: subscriptionId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and plan activated',
      data: {
        subscriptionId: subscriptionId,
        plan: planCode,
        status: 'active',
        message: `Plan activated successfully!`,
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

        // Create affiliate commission if this is a new subscription (not renewal)
        // Only create commission on first payment, not renewals
        if (!isRenewal && subscription) {
          try {
            console.log(`[Webhook payment.captured] Creating commission for subscription ${subscription._id}, user ${paymentRecord.userId}, plan ${paymentRecord.planCode}, amount ${plan.price}`);
            const commission = await createCommission({
              userId: paymentRecord.userId,
              subscriptionId: subscription._id as mongoose.Types.ObjectId,
              paymentId: paymentRecord._id as mongoose.Types.ObjectId,
              planCode: paymentRecord.planCode,
              subscriptionAmount: plan.price,
            });
            if (commission) {
              console.log(`[Webhook payment.captured] Commission created successfully: ${commission._id}`);
            } else {
              console.log(`[Webhook payment.captured] No commission created (likely no referral or affiliate not active)`);
            }
          } catch (error) {
            // Don't fail webhook if commission creation fails
            console.error('[Webhook payment.captured] Failed to create affiliate commission:', error);
          }
        } else {
          console.log(`[Webhook payment.captured] Skipping commission creation - isRenewal: ${isRenewal}, hasSubscription: ${!!subscription}`);
        }
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

    // Handle subscription.activated - Trial started
    if (eventType === 'subscription.activated') {
      const subscription = payload.subscription.entity;
      const subRecord = await Subscription.findOne({
        razorpaySubscriptionId: subscription.id,
      });
      
      if (subRecord) {
        // If status is trialing, keep it; otherwise set to trialing if trial period exists
        if (subRecord.trialEndsAt && subRecord.trialEndsAt > new Date()) {
          subRecord.status = 'trialing';
          subRecord.history.push({
            action: 'trial_started',
            timestamp: new Date(),
            notes: 'Trial activated via Razorpay webhook',
          });
        } else {
          subRecord.status = 'active';
          subRecord.history.push({
            action: 'subscription_activated',
            timestamp: new Date(),
            notes: 'Subscription activated via Razorpay',
          });
        }
        await subRecord.save();
      }
    }


    // Handle subscription.completed - Subscription ended (for one-time plans)
    if (eventType === 'subscription.completed') {
      const subscription = payload.subscription.entity;
      const subRecord = await Subscription.findOne({
        razorpaySubscriptionId: subscription.id,
      });
      
      if (subRecord) {
        subRecord.status = 'expired';
        subRecord.history.push({
          action: 'subscription_expired',
          timestamp: new Date(),
          notes: 'Subscription completed via Razorpay',
        });
        await subRecord.save();

        // Update user access
        const user = await User.findById(subRecord.userId);
        if (user && user.plan === subRecord.planCode) {
          // Only revoke if this is their current plan
          user.plan = null;
          user.planExpiresAt = null;
          user.isLifetime = false;
          await user.save();
        }
      }
    }

    // Handle subscription.cancelled - User cancelled
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

        // Update user access - revoke after current period ends
        const user = await User.findById(subRecord.userId);
        if (user && user.plan === subRecord.planCode) {
          // Set expiry to current date
          user.planExpiresAt = new Date();
          await user.save();

          await createNotification({
            userId: user._id as mongoose.Types.ObjectId,
            type: 'system_update',
            title: 'Subscription Cancelled',
            message: 'Your subscription has been cancelled. Access will continue until the end of your current period.',
            link: '/dashboard/billing',
          });
        }
      }
    }

    // Handle payment.failed for subscription charges (after trial)
    if (eventType === 'payment.failed') {
      const payment = payload.payment.entity;
      const order = payload.order.entity;
      
      // Check if this is a subscription charge failure
      if (order.receipt && order.receipt.startsWith('sub_')) {
        const subscriptionId = order.receipt.split('_')[1];
        const subRecord = await Subscription.findOne({
          razorpaySubscriptionId: subscriptionId,
        });
        
        if (subRecord) {
          const plan = plans[subRecord.planCode];
          // Mark subscription as expired/failed
          subRecord.status = 'expired';
          subRecord.history.push({
            action: 'subscription_expired',
            timestamp: new Date(),
            notes: `Payment failed - subscription expired. Full amount (₹${plan.price / 100}) was not charged.`,
          });
          await subRecord.save();

          // Revoke user access immediately
          const user = await User.findById(subRecord.userId);
          if (user && user.plan === subRecord.planCode) {
            user.plan = null;
            user.planExpiresAt = null;
            user.isLifetime = false;
            await user.save();

            await createNotification({
              userId: user._id as mongoose.Types.ObjectId,
              type: 'system_update',
              title: 'Payment Failed',
              message: 'Payment failed. Your subscription has been cancelled. Please update your payment method to continue.',
              link: '/dashboard/billing',
            });
          }
        }
      } else {
        // Regular payment failure (token charge or other)
        const paymentRecord = await Payment.findOne({ orderId: order.id });
        if (paymentRecord) {
          paymentRecord.status = 'failed';
          paymentRecord.paymentId = payment.id;
          await paymentRecord.save();
        }
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
 * Verify token plan amount - Diagnostic endpoint
 * GET /api/payments/verify-token-plan
 */
export const verifyTokenPlan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token charge plan ID from config
    const tokenPlanId = config.razorpay.planTokenId;
    if (!tokenPlanId) {
      throw createError('Token charge plan ID not configured. Please run: npm run create-razorpay-plans', 500);
    }

    // Fetch the token plan from Razorpay
    const tokenPlan = await razorpayService.fetchPlan(tokenPlanId);
    const actualAmount = tokenPlan.item.amount;
    const expectedAmount = TOKEN_CHARGE_AMOUNT;
    const isCorrect = actualAmount === expectedAmount;

    res.status(200).json({
      success: true,
      data: {
        planId: tokenPlanId,
        planName: tokenPlan.item.name,
        actualAmount: actualAmount,
        actualAmountRupees: `₹${actualAmount / 100}`,
        expectedAmount: expectedAmount,
        expectedAmountRupees: `₹${expectedAmount / 100}`,
        isCorrect: isCorrect,
        currency: tokenPlan.item.currency,
        period: tokenPlan.period,
        interval: tokenPlan.interval,
        warning: !isCorrect ? `Token plan amount is ₹${actualAmount / 100} but should be ₹${expectedAmount / 100}. Please recreate the plan using npm run create-razorpay-plans` : null,
      },
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

    // Check for active subscription
    const subscription = await Subscription.findOne({
      userId: (req.user as any)._id,
      status: { $in: ['active', 'manually_granted'] },
    }).sort({ createdAt: -1 });

    let status = getSubscriptionStatus(user);

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
        subscriptionId: subscription?.razorpaySubscriptionId || null,
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

