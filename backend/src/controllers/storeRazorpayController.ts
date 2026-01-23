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

    // Check if account already exists
    const existingAccount = await RazorpayAccount.findOne({ userId: user._id });
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
    if (existingAccount) {
      existingAccount.status = 'pending';
      existingAccount.onboardingData = onboarding;
      await existingAccount.save();
    } else {
      const account = new RazorpayAccount({
        userId: user._id,
        storeId: store._id,
        razorpayAccountId: onboarding.accountId || 'pending',
        email: userEmail,
        status: 'pending',
        onboardingData: onboarding,
      });
      await account.save();
    }

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
