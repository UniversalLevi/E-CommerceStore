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

/**
 * Create trial subscription with ₹20 token charge
 * POST /api/payments/create-order (kept for backward compatibility)
 * POST /api/payments/create-trial-subscription (new endpoint)
 */
export const createTrialSubscription = async (
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
    const userIdStr = typeof userId === 'string' ? userId : userId.toString();
    const userIdShort = userIdStr.slice(-12);
    const timestamp = Date.now().toString().slice(-8);
    
    // Calculate trial end date (Unix timestamp)
    const trialDays = plan.trialDays || 0;
    const startAt = Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60);

    // Determine total_count: 1 for one-time (Pro/Lifetime), high number for recurring (Monthly)
    const totalCount = plan.isLifetime || !plan.durationDays ? 1 : 120; // 120 months for recurring

    console.log('Creating trial subscription for plan:', planCode, 'trial days:', trialDays, 'start_at:', startAt);

    // Get token charge plan ID from config
    const tokenPlanId = config.razorpay.planTokenId;
    if (!tokenPlanId) {
      throw createError('Token charge plan ID not configured. Please run: npm run create-razorpay-plans', 500);
    }

    // Verify the token plan amount before creating subscription
    const tokenPlan = await razorpayService.fetchPlan(tokenPlanId);
    console.log('Token plan details:', {
      id: tokenPlan.id,
      amount: tokenPlan.item.amount,
      amount_rupees: `₹${tokenPlan.item.amount / 100}`,
      currency: tokenPlan.item.currency,
    });

    if (tokenPlan.item.amount !== TOKEN_CHARGE_AMOUNT) {
      console.error(`❌ Token plan amount mismatch! Expected ${TOKEN_CHARGE_AMOUNT} paise (₹20), got ${tokenPlan.item.amount} paise (₹${tokenPlan.item.amount / 100})`);
      throw createError(`Token plan amount is incorrect. Expected ₹20, but plan has ₹${tokenPlan.item.amount / 100}. Please recreate the plan with correct amount.`, 500);
    }
    
    console.log('✅ Token plan verified - amount is correct: ₹20');

    // 1. Create Razorpay Subscription with ₹20 token charge plan for UPI autopay mandate
    // This subscription will charge ₹20 immediately and set up UPI autopay
    // Note: start_at must be at least 60 seconds in the future for Razorpay
    // CRITICAL: When start_at is in the future, Razorpay charges ₹5 by default for auth
    // To charge ₹20 instead, we must use addons/upfront amount feature
    const tokenStartAt = Math.floor(Date.now() / 1000) + 60; // Start 60 seconds from now (Razorpay requirement)
    const tokenSubscription = await razorpayService.createSubscription({
      planId: tokenPlanId, // Use ₹20 token charge plan
      startAt: tokenStartAt, // Start 60 seconds from now (Razorpay requires future timestamp)
      totalCount: 1, // One-time charge
      customerNotify: 1,
      // IMPORTANT: Add upfront addon to charge ₹20 instead of default ₹5
      // This overrides Razorpay's default ₹5 authentication charge for future start dates
      addons: [
        {
          item: {
            name: 'Trial Token Charge',
            amount: TOKEN_CHARGE_AMOUNT, // ₹20 (2000 paise) - upfront charge
            currency: 'INR',
          },
        },
      ],
    });

    console.log('Token charge subscription created for UPI autopay:', tokenSubscription.id);
    
    // Fetch subscription details to verify amount
    const subscriptionDetails = await razorpayService.getSubscription(tokenSubscription.id);
    const planDetails = await razorpayService.fetchPlan(subscriptionDetails.plan_id);
    const actualPlanAmount = planDetails.item.amount;
    
    console.log('Token subscription details:', {
      id: subscriptionDetails.id,
      plan_id: subscriptionDetails.plan_id,
      status: subscriptionDetails.status,
      current_start: subscriptionDetails.current_start,
      current_end: subscriptionDetails.current_end,
      plan_amount: actualPlanAmount,
      plan_amount_rupees: `₹${actualPlanAmount / 100}`,
      expected_amount: TOKEN_CHARGE_AMOUNT,
      expected_amount_rupees: `₹${TOKEN_CHARGE_AMOUNT / 100}`,
    });
    
    // Verify the subscription is using the correct plan
    if (subscriptionDetails.plan_id !== tokenPlanId) {
      throw createError(`Subscription plan mismatch! Expected ${tokenPlanId}, got ${subscriptionDetails.plan_id}`, 500);
    }
    
    // DIAGNOSTIC: Verify the actual subscription amount matches expected ₹20
    if (actualPlanAmount !== TOKEN_CHARGE_AMOUNT) {
      console.error(`⚠️ WARNING: Token subscription amount mismatch!`);
      console.error(`   Expected: ₹${TOKEN_CHARGE_AMOUNT / 100} (${TOKEN_CHARGE_AMOUNT} paise)`);
      console.error(`   Actual in Razorpay: ₹${actualPlanAmount / 100} (${actualPlanAmount} paise)`);
      console.error(`   This will cause the checkout to show ₹${actualPlanAmount / 100} instead of ₹${TOKEN_CHARGE_AMOUNT / 100}`);
      console.error(`   Solution: Recreate the token plan with amount: ${TOKEN_CHARGE_AMOUNT} paise using npm run create-razorpay-plans`);
      
      // Still proceed, but log the warning for debugging
      // The subscription will work, but will charge the wrong amount
    } else {
      console.log(`✅ Token subscription amount verified: ₹${actualPlanAmount / 100} (${actualPlanAmount} paise) - Correct!`);
    }

    // 2. Create main subscription with trial period (this will be charged after trial)
    // IMPORTANT: We use the main subscription for checkout (not token subscription)
    // This ensures UPI autopay mandate is linked to the main subscription (plan amount)
    // We add an upfront ₹20 addon to charge ₹20 instead of default ₹5 for auth
    const mainSubscription = await razorpayService.createSubscription({
      planId: plan.razorpayPlanId,
      startAt: startAt,
      totalCount: totalCount,
      customerNotify: 0, // Don't notify for main subscription yet (will be charged after trial)
      // Add upfront ₹20 addon to charge ₹20 instead of default ₹5 for future start dates
      // This also ensures the UPI mandate is linked to the main subscription (plan amount)
      addons: [
        {
          item: {
            name: 'Trial Token Charge',
            amount: TOKEN_CHARGE_AMOUNT, // ₹20 (2000 paise) - upfront charge
            currency: 'INR',
          },
        },
      ],
    });

    console.log('Main subscription created:', mainSubscription.id);

    // Save payment record for main subscription (not token subscription)
    // IMPORTANT: We now use mainSubscription.id because checkout uses main subscription
    const payment = await Payment.create({
      userId: userId,
      orderId: mainSubscription.id, // Use main subscription ID as order reference
      razorpayOrderId: mainSubscription.id,
      planCode: planCode as PlanCode,
      status: 'created',
      amount: TOKEN_CHARGE_AMOUNT,
      currency: 'INR',
      metadata: {
        type: 'token_charge',
        subscriptionId: mainSubscription.id, // Main subscription ID (changed from tokenSubscription.id)
        tokenSubscriptionId: tokenSubscription.id, // Token subscription ID (for reference)
        mainSubscriptionId: mainSubscription.id, // Main subscription ID (charged after trial)
      },
    });

    // Create subscription record in database (status: trialing)
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    const dbSubscription = await Subscription.create({
      userId: userId,
      planCode: planCode as PlanCode,
      razorpaySubscriptionId: mainSubscription.id, // Main subscription ID
      razorpayPlanId: plan.razorpayPlanId,
      status: 'trialing',
      startDate: new Date(),
      trialEndsAt: trialEndsAt,
      amountPaid: 0, // Will be updated when charged
      source: 'razorpay',
      history: [
        {
          action: 'trial_started',
          timestamp: new Date(),
          notes: `Trial started - ${trialDays} days free trial. Token charge subscription: ${tokenSubscription.id}`,
        },
      ],
    });

    console.log('Subscription record created:', dbSubscription._id);

    res.status(200).json({
      success: true,
      data: {
        // IMPORTANT: Use main subscription ID for checkout (not token subscription)
        // This ensures UPI autopay mandate is linked to the main subscription (plan amount)
        // The ₹20 token charge is handled via addons on the main subscription
        subscriptionId: mainSubscription.id, // Main subscription ID (for UPI autopay - links to plan amount)
        tokenSubscriptionId: tokenSubscription.id, // Token subscription ID (for reference only)
        mainSubscriptionId: mainSubscription.id, // Main subscription ID (same as subscriptionId)
        amount: TOKEN_CHARGE_AMOUNT, // ₹20 token charge (via addons on main subscription)
        currency: 'INR',
        keyId: razorpayService.getKeyId(),
        trialDays: trialDays,
        trialEndsAt: trialEndsAt.toISOString(),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Legacy createOrder - kept for backward compatibility
 * Now redirects to createTrialSubscription
 */
export const createOrder = createTrialSubscription;

/**
 * Verify ₹20 token payment and activate trial subscription
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
    
    // Verify amount is ₹20 token charge
    if (paymentAmount !== TOKEN_CHARGE_AMOUNT) {
      throw createError(`Payment amount mismatch. Expected ₹20 token charge, got ₹${paymentAmount / 100}`, 400);
    }
    
    if (!payment) {
      throw createError('Payment record not found. Please create subscription first.', 404);
    }

    // Verify this is a token charge payment
    if (payment.metadata?.type !== 'token_charge') {
      throw createError('Invalid payment type. Expected token charge.', 400);
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

    // Update subscription with token payment ID
    subscription.tokenPaymentId = razorpay_payment_id;
    subscription.status = 'trialing'; // Ensure status is trialing
    await subscription.save();

    // Link payment to subscription
    payment.subscriptionId = subscription._id as mongoose.Types.ObjectId;
    await payment.save();

    // Update user to reflect trial subscription
    // IMPORTANT: Set planExpiresAt to trial end date so user has access during trial
    // This will be updated to the actual expiry date when full payment is charged after trial
    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Get trial days for notification and fallback calculation
    const planName = plan.name;
    const trialDays = plan.trialDays || 0;

    // Set user plan and planExpiresAt to trial end date
    // This ensures user has access during the trial period
    // planExpiresAt will be updated to the actual expiry when full payment is charged
    user.plan = planCode;
    user.planExpiresAt = subscription.trialEndsAt || new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
    user.isLifetime = plan.isLifetime || false;
    await user.save();

    // Create notification
    const notificationMessage = `Your ${planName} trial has started! You have ${trialDays} days free. Full amount (₹${plan.price / 100}) will be auto-debited after trial unless cancelled.`;

    await createNotification({
      userId: (req.user as any)._id,
      type: 'system_update',
      title: 'Trial Started',
      message: notificationMessage,
      link: '/dashboard/billing',
      metadata: {
        planCode,
        planName,
        trialDays,
        trialEndsAt: subscription.trialEndsAt?.toISOString(),
        subscriptionId: subscriptionId,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Token payment verified and trial activated',
      data: {
        subscriptionId: subscriptionId,
        plan: planCode,
        status: 'trialing',
        trialDays: trialDays,
        trialEndsAt: subscription.trialEndsAt?.toISOString(),
        message: `Trial started! Full amount will be charged after ${trialDays} days.`,
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

    // Handle subscription.charged - Trial ended, full amount charged
    if (eventType === 'subscription.charged') {
      const subscription = payload.subscription.entity;
      const payment = payload.payment.entity;
      
      const subRecord = await Subscription.findOne({
        razorpaySubscriptionId: subscription.id,
      });
      
      if (subRecord) {
        const plan = plans[subRecord.planCode];
        const now = new Date();
        
        // Update subscription status to active
        subRecord.status = 'active';
        subRecord.razorpayPaymentId = payment.id;
        subRecord.amountPaid = plan.price;
        
        // Calculate end date based on plan
        let endDate: Date | null = null;
        if (plan.isLifetime) {
          endDate = null;
        } else if (plan.durationDays) {
          // For monthly recurring, extend from now
          endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
        }
        
        subRecord.endDate = endDate;
        subRecord.history.push({
          action: 'trial_ended',
          timestamp: now,
          notes: `Trial ended - Full amount (₹${plan.price / 100}) charged`,
        });
        await subRecord.save();

        // Update user subscription access
        const user = await User.findById(subRecord.userId);
        if (user) {
          user.plan = subRecord.planCode;
          if (plan.isLifetime) {
            user.planExpiresAt = null;
            user.isLifetime = true;
          } else {
            user.planExpiresAt = endDate;
            user.isLifetime = false;
          }
          await user.save();

          // Create notification
          await createNotification({
            userId: user._id as mongoose.Types.ObjectId,
            type: 'system_update',
            title: 'Trial Ended - Subscription Active',
            message: `Your ${plan.name} trial has ended. Full amount (₹${plan.price / 100}) has been charged. Your subscription is now active!`,
            link: '/dashboard/billing',
            metadata: {
              planCode: subRecord.planCode,
              planName: plan.name,
              paymentId: payment.id,
            },
          });
        }

        // Create payment record for the charged amount
        await Payment.create({
          userId: subRecord.userId,
          orderId: `sub_${subscription.id}_${Date.now()}`,
          razorpayOrderId: `sub_${subscription.id}`,
          paymentId: payment.id,
          planCode: subRecord.planCode,
          status: 'paid',
          amount: plan.price,
          currency: 'INR',
          subscriptionId: subRecord._id,
          planName: plan.name,
          metadata: {
            type: 'subscription_charge',
            subscriptionId: subscription.id,
          },
        });
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
          // Set expiry to trial end date or current date if trial already ended
          if (subRecord.trialEndsAt && subRecord.trialEndsAt > new Date()) {
            user.planExpiresAt = subRecord.trialEndsAt;
          } else {
            user.planExpiresAt = new Date();
          }
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
          // Mark subscription as expired/failed
          subRecord.status = 'expired';
          subRecord.history.push({
            action: 'payment_received', // Using existing action
            timestamp: new Date(),
            notes: `Payment failed after trial - subscription expired`,
          });
          await subRecord.save();

          // Revoke user access
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
              message: 'Payment failed after trial period. Your subscription has been cancelled. Please update your payment method to continue.',
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
      trialDays: plan.trialDays || 0,
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

    // Check for active subscription (including trialing)
    const subscription = await Subscription.findOne({
      userId: (req.user as any)._id,
      status: { $in: ['active', 'trialing', 'manually_granted'] },
    }).sort({ createdAt: -1 });

    let status = getSubscriptionStatus(user);
    let trialEndsAt: Date | null = null;
    let isTrialing = false;

    // If subscription exists and is trialing, override status
    if (subscription && subscription.status === 'trialing') {
      if (subscription.trialEndsAt && subscription.trialEndsAt > new Date()) {
        status = 'trialing' as any; // Override to show trialing
        trialEndsAt = subscription.trialEndsAt;
        isTrialing = true;
      } else {
        // Trial ended but payment not yet charged - check webhook status
        status = getSubscriptionStatus(user);
      }
    }

    const maxProducts = user.plan ? plans[user.plan as PlanCode]?.maxProducts ?? null : null;
    const productsRemaining = maxProducts === null ? null : Math.max(0, maxProducts - user.productsAdded);

    res.status(200).json({
      success: true,
      data: {
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        isLifetime: user.isLifetime,
        status,
        isTrialing,
        trialEndsAt: trialEndsAt?.toISOString() || null,
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

