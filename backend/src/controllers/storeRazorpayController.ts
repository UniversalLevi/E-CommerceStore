import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { RazorpayAccount } from '../models/RazorpayAccount';
import { razorpayConnectService } from '../services/RazorpayConnectService';
import { razorpayService } from '../services/RazorpayService';
import { createError } from '../middleware/errorHandler';
import { User } from '../models/User';

/**
 * Initiate Razorpay Connect onboarding
 * POST /api/store-dashboard/stores/:id/razorpay/connect
 */
export const initiateRazorpayConnect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const store = (req as any).store;
    const user = req.user as any;

    // Check if account already exists for this store
    const existingAccount = await RazorpayAccount.findOne({ 
      storeId: store._id 
    });
    
    if (existingAccount && existingAccount.status === 'active') {
      throw createError('Razorpay account is already connected', 400);
    }

    // Get user email for onboarding
    const userEmail = user.email || user.mobile || 'user@example.com';
    const userPhone = user.mobile || '+919999999999';

    // Create onboarding link
    const redirectUrl = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/dashboard/store/settings?razorpay=connected`;
    const onboarding = await razorpayConnectService.createOnboardingLink({
      email: userEmail,
      phone: userPhone,
      legalBusinessName: store.name,
      businessType: 'individual', // Default for MVP
      redirectUrl,
    });

    // Create or update RazorpayAccount record
    // Use findOneAndUpdate with upsert to handle race conditions
    let accountId = onboarding.accountId;
    
    // If no accountId from Razorpay, only set it if account doesn't exist yet
    if (!accountId) {
      if (!existingAccount || !existingAccount.razorpayAccountId) {
        accountId = `pending_${store._id}_${Date.now()}`;
      } else {
        // Keep existing accountId if account already exists
        accountId = existingAccount.razorpayAccountId;
      }
    }
    
    const updateData: any = {
      userId: user._id,
      storeId: store._id,
      email: userEmail,
      status: 'pending',
      onboardingData: onboarding,
    };
    
    // Only update razorpayAccountId if we have a new one
    if (onboarding.accountId || !existingAccount?.razorpayAccountId) {
      updateData.razorpayAccountId = accountId;
    }
    
    const account = await RazorpayAccount.findOneAndUpdate(
      { storeId: store._id },
      updateData,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Update store status
    store.razorpayAccountStatus = 'pending';
    await store.save();

    res.status(200).json({
      success: true,
      data: {
        onboardingUrl: onboarding.onboardingUrl,
        accountId: onboarding.accountId,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get Razorpay connection status
 * GET /api/store-dashboard/stores/:id/razorpay/status
 */
export const getRazorpayStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const user = req.user as any;

    const account = await RazorpayAccount.findOne({
      userId: user._id,
      storeId: store._id,
    });

    res.status(200).json({
      success: true,
      data: {
        accountStatus: account?.status || 'not_connected',
        storeStatus: store.razorpayAccountStatus,
        accountId: account?.razorpayAccountId,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Manually set Razorpay account ID (for manual onboarding)
 * POST /api/store-dashboard/stores/:id/razorpay/set-account
 */
export const setRazorpayAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const store = (req as any).store;
    const user = req.user as any;
    const { accountId } = req.body;

    if (!accountId || typeof accountId !== 'string') {
      throw createError('Account ID is required', 400);
    }

    // Verify account with Razorpay (optional - might fail if Connect not enabled)
    let accountStatus = 'active'; // Default to active if account ID is provided
    try {
      const verifiedAccount = await razorpayConnectService.verifyAccount(accountId);
      if (verifiedAccount) {
        accountStatus = verifiedAccount.status || 'active';
      }
    } catch (verifyError: any) {
      // If verification fails, still allow setting the account ID
      // User might have completed onboarding but API verification isn't available
      // We'll set status to 'active' since they provided a valid-looking account ID
      console.warn('Could not verify account via API, but proceeding with active status:', verifyError?.message || verifyError);
      // Account ID format validation: should start with 'acc_' for Razorpay Connect accounts
      if (accountId.startsWith('acc_')) {
        accountStatus = 'active';
      } else {
        // If it doesn't look like a valid account ID, keep as pending
        accountStatus = 'pending';
      }
    }

    // Update or create account record
    const account = await RazorpayAccount.findOneAndUpdate(
      { storeId: store._id },
      {
        userId: user._id,
        storeId: store._id,
        razorpayAccountId: accountId,
        email: user.email || user.mobile || 'user@example.com',
        status: accountStatus,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    // Update store status
    store.razorpayAccountStatus = accountStatus;
    await store.save();

    res.status(200).json({
      success: true,
      message: 'Razorpay account ID set successfully',
      data: {
        accountId: account.razorpayAccountId,
        status: account.status,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
