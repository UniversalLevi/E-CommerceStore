import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Subscription } from '../models/Subscription';
import { plans, PlanCode } from '../config/plans';
import { config } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAuditWithRequest, logAudit } from '../utils/auditLogger';
import { createNotification } from '../utils/notifications';
import { bindReferralToUser } from '../services/referralTrackingService';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, mobile, country, password, referralCode } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      throw createError('Name is required', 400);
    }

    if (!email || !email.trim()) {
      throw createError('Email is required', 400);
    }

    if (!mobile || !mobile.trim()) {
      throw createError('Mobile number is required', 400);
    }

    if (!country || !country.trim()) {
      throw createError('Country is required', 400);
    }

    // Check if user already exists by email or mobile (check both)
    const existingUserByEmail = email ? await User.findOne({ email: email.trim().toLowerCase() }) : null;
    const existingUserByMobile = mobile ? await User.findOne({ mobile: mobile.trim() }) : null;

    // Handle deleted accounts - allow re-registration
    if (existingUserByEmail && existingUserByEmail.deletedAt) {
      console.log('Found deleted account by email, hard deleting to allow re-registration:', email);
      await User.findByIdAndDelete(existingUserByEmail._id);
    }
    if (existingUserByMobile && existingUserByMobile.deletedAt) {
      console.log('Found deleted account by mobile, hard deleting to allow re-registration:', mobile);
      await User.findByIdAndDelete(existingUserByMobile._id);
    }
    
    // Check again after cleanup
    const existingUserByEmailAfter = email ? await User.findOne({ email: email.trim().toLowerCase() }) : null;
    const existingUserByMobileAfter = mobile ? await User.findOne({ mobile: mobile.trim() }) : null;
    
    if (existingUserByEmailAfter && !existingUserByEmailAfter.deletedAt) {
      throw createError('Email already registered', 409);
    }
    if (existingUserByMobileAfter && !existingUserByMobileAfter.deletedAt) {
      throw createError('Mobile number already registered', 409);
    }

    // Hash password with optimized rounds (10 -> 8 for better performance)
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create user - all fields are required now
    const userData: Partial<IUser> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      country: country.trim(),
      password: hashedPassword,
      role: 'user',
      // Both email and mobile are provided, so no reminders needed
      emailLinkReminderSent: true,
      mobileLinkReminderSent: true,
    };

    let user;
    try {
      user = await User.create(userData);
    } catch (error: any) {
      // Handle duplicate key errors (race condition or index issues)
      if (error.code === 11000) {
        const duplicateField = error.keyPattern?.email ? 'email' : error.keyPattern?.mobile ? 'mobile' : 'field';
        throw createError(`${duplicateField === 'email' ? 'Email' : duplicateField === 'mobile' ? 'Mobile number' : 'Field'} already registered`, 409);
      }
      throw error;
    }

    // Bind referral if provided
    const refCode = referralCode || req.query.ref;
    if (refCode) {
      try {
        console.log(`[Registration] Attempting to bind referral code "${refCode}" to user ${user._id}`);
        const tracking = await bindReferralToUser({
          userId: user._id as mongoose.Types.ObjectId,
          referralCode: refCode as string,
          ipAddress: req.ip || req.socket.remoteAddress,
        });
        if (tracking) {
          console.log(`[Registration] Successfully bound referral ${tracking._id} to user ${user._id}`);
        } else {
          console.log(`[Registration] No referral tracking created for code "${refCode}"`);
        }
      } catch (error: any) {
        // Don't fail registration if referral binding fails, but log it
        console.error('[Registration] Failed to bind referral:', error.message || error);
        console.error('[Registration] Referral error stack:', error.stack);
      }
    } else {
      console.log(`[Registration] No referral code provided`);
    }

    // Generate JWT token with password change timestamp
    const jwtOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as any,
    };
    const token = jwt.sign(
      { 
        userId: user._id,
        passwordChangedAt: user.passwordChangedAt?.getTime() || 0
      },
      config.jwtSecret,
      jwtOptions
    );

    // Set HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 86400000, // 24 hours
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    // Log registration (no user context yet, so use direct logAudit)
    await logAudit({
      userId: user._id as mongoose.Types.ObjectId,
      action: 'USER_REGISTER',
      success: true,
      details: {
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // If mobile-only account, send notification to link email
    if (mobile && !email) {
      await createNotification({
        userId: user._id as mongoose.Types.ObjectId,
        type: 'system_update',
        title: 'Link Your Email for Account Security',
        message: 'For better account security and password recovery, please link an email address to your account.',
        link: '/settings',
        metadata: {
          reminderType: 'email_link',
        },
      });
    }

    // If email-only account, send notification to link mobile
    if (email && !mobile) {
      await createNotification({
        userId: user._id as mongoose.Types.ObjectId,
        type: 'system_update',
        title: 'Link Your Mobile Number',
        message: 'For better account security and verification, please link a mobile number to your account.',
        link: '/settings',
        metadata: {
          reminderType: 'mobile_link',
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, mobile, password } = req.body;

    // Validate that at least email or mobile is provided
    if (!email && !mobile) {
      throw createError('Either email or mobile number is required', 400);
    }

    // Find user by email or mobile - ensure we get the password field
    const user = email 
      ? await User.findOne({ email })
      : await User.findOne({ mobile });

    if (!user) {
      console.log('Login failed: User not found:', email || mobile);
      throw createError('Invalid credentials', 401);
    }

    // Check if account is deleted
    if (user.deletedAt) {
      console.log('Login failed: Account deleted:', email || mobile);
      throw createError('This account has been deleted.', 403);
    }

    // Check if account is active (but not deleted)
    if (!user.isActive) {
      throw createError('Account is disabled. Please contact support.', 403);
    }

    // Verify password
    const identifier = email || mobile;
    console.log('🔐 Login attempt for user:', identifier);
    console.log('🔐 Stored password hash (first 20 chars):', user.password.substring(0, 20));
    console.log('🔐 Password changed at:', user.passwordChangedAt);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Login failed: Password mismatch for user:', identifier);
      throw createError('Invalid credentials', 401);
    }
    
    console.log('✅ Login successful for user:', identifier);
    console.log('✅ Password changed at:', user.passwordChangedAt);

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await logAudit({
      userId: user._id as mongoose.Types.ObjectId,
      action: 'USER_LOGIN',
      success: true,
      details: {
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate JWT token with password change timestamp
    const jwtOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as any,
    };
    const token = jwt.sign(
      { 
        userId: user._id,
        passwordChangedAt: user.passwordChangedAt?.getTime() || 0
      },
      config.jwtSecret,
      jwtOptions
    );

    // Set HttpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      maxAge: 86400000, // 24 hours
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie('auth_token', { path: '/' });
    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    // Sync subscription status from Subscription model to User model
    // This ensures manually_granted subscriptions are recognized
    const activeSubscription = await Subscription.findOne({
      userId: (req.user as any)._id,
      status: { $in: ['active', 'trialing', 'manually_granted'] },
    }).sort({ createdAt: -1 }).lean();

    let user = req.user;
    let needsUpdate = false;

    if (activeSubscription) {
      const plan = plans[activeSubscription.planCode as PlanCode];
      const isLifetime = plan
        ? plan.isLifetime
        : activeSubscription.planCode === 'lifetime' || !activeSubscription.endDate;
      const planExpiresAt = plan
        ? (plan.isLifetime ? null : (activeSubscription.endDate || null))
        : (isLifetime ? null : (activeSubscription.endDate || null));

      const userPlanMatches = user.plan === activeSubscription.planCode;
      const userIsLifetimeMatches = user.isLifetime === isLifetime;
      const userExpiresAtMatches =
        (isLifetime && user.planExpiresAt === null) ||
        (!isLifetime && user.planExpiresAt && activeSubscription.endDate &&
          Math.abs(user.planExpiresAt.getTime() - activeSubscription.endDate.getTime()) < 1000);

      if (!userPlanMatches || !userIsLifetimeMatches || !userExpiresAtMatches) {
        const userDoc = await User.findById((req.user as any)._id);
        if (userDoc) {
          userDoc.plan = activeSubscription.planCode as PlanCode;
          userDoc.isLifetime = isLifetime;
          userDoc.planExpiresAt = planExpiresAt;
          await userDoc.save();

          user = userDoc.toObject();
          delete (user as any).password;
          needsUpdate = true;
        }
      }
    } else {
      // No active subscription found - check if user still has plan set (should be cleared)
      if (user.plan || user.isLifetime) {
        const userDoc = await User.findById((req.user as any)._id);
        if (userDoc) {
          userDoc.plan = null;
          userDoc.isLifetime = false;
          userDoc.planExpiresAt = null;
          await userDoc.save();
          
          user = userDoc.toObject();
          delete (user as any).password;
          needsUpdate = true;
        }
      }
    }

    res.status(200).json({
      success: true,
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw createError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw createError('New password must be at least 6 characters', 400);
    }

    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw createError('Current password is incorrect', 401);
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 8);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date(); // Track password change to invalidate old tokens
    await user.save();

    // Log password change
    await logAuditWithRequest(req, {
      userId: (req.user as any)._id,
      action: 'CHANGE_PASSWORD',
      success: true,
      details: {
        email: user.email,
        passwordChangedAt: user.passwordChangedAt,
      },
    });

    // Clear cookie (force re-login)
    res.clearCookie('auth_token', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('User not found', 404);
    }

    const userId = (req.user as any)._id;
    const user = await User.findById(userId);

    // Soft delete: set deletedAt field
    await User.findByIdAndUpdate(userId, {
      deletedAt: new Date(),
      isActive: false,
    });

    // Log account deletion
    await logAuditWithRequest(req, {
      userId: userId,
      action: 'DELETE_ACCOUNT',
      success: true,
      details: {
        email: user?.email,
        deletedAt: new Date(),
      },
    });

    // Clear cookie
    res.clearCookie('auth_token', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const linkEmail = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { email } = req.body;

    if (!email) {
      throw createError('Email is required', 400);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw createError('Invalid email format', 400);
    }

    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if email is already linked to another account (exclude deleted accounts)
    const existingUser = await User.findOne({ 
      email,
      $or: [
        { deletedAt: { $exists: false } },
        { deletedAt: null }
      ]
    });
    if (existingUser && (existingUser._id as mongoose.Types.ObjectId).toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      throw createError('Email is already linked to another account', 409);
    }

    // Check if user already has this email
    if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
      throw createError('This email is already linked to your account', 400);
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    // Set token, expiration (24 hours), and pending email
    user.emailVerificationToken = verificationTokenHash;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.pendingEmail = email.toLowerCase().trim();
    await user.save();

    // Send verification email
    const verifyUrl = `${config.corsOrigin || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const { sendEmailVerificationEmail } = await import('../utils/email');
    await sendEmailVerificationEmail(email, verifyUrl);

    // Create audit log
    await logAuditWithRequest(req, {
      userId: (req.user as any)._id,
      action: 'LINK_EMAIL',
      success: true,
      details: {
        email,
        hadMobile: !!user.mobile,
        verificationSent: true,
      },
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Email verification URL:', verifyUrl);
    }

    res.status(200).json({
      success: true,
      message: 'Verification email sent. Please check your email to verify and link your email address.',
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { verifyUrl }),
    });
  } catch (error) {
    next(error);
  }
};

export const linkMobile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { mobile } = req.body;

    if (!mobile) {
      throw createError('Mobile number is required', 400);
    }

    // Validate mobile format
    const mobileRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanMobile = mobile.replace(/\s/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      throw createError('Invalid mobile number format', 400);
    }

    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if mobile is already linked to another account (exclude deleted accounts)
    const existingUser = await User.findOne({ 
      mobile: cleanMobile,
      $or: [
        { deletedAt: { $exists: false } },
        { deletedAt: null }
      ]
    });
    if (existingUser && (existingUser._id as mongoose.Types.ObjectId).toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      throw createError('Mobile number is already linked to another account', 409);
    }

    // Check if user already has this mobile
    if (user.mobile && user.mobile === cleanMobile) {
      throw createError('This mobile number is already linked to your account', 400);
    }

    // Link mobile to account (no verification needed for mobile, just link directly)
    user.mobile = cleanMobile;
    user.mobileLinkedAt = new Date();
    user.mobileLinkReminderSent = true;
    await user.save();

    // Create audit log
    await logAuditWithRequest(req, {
      userId: (req.user as any)._id,
      action: 'LINK_MOBILE',
      success: true,
      details: {
        mobile: cleanMobile,
        hadEmail: !!user.email,
      },
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: 'Mobile number linked successfully',
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw createError('Verification token is required', 400);
    }

    // Hash the token to compare with stored hash
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid token
    const user = await User.findOne({
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      // Check if token exists but expired
      const expiredUser = await User.findOne({ emailVerificationToken: verificationTokenHash });
      if (expiredUser) {
        throw createError('Verification token has expired. Please request a new verification email.', 400);
      }
      throw createError('Invalid verification token', 400);
    }

    if (!user.pendingEmail) {
      throw createError('No pending email to verify', 400);
    }

    // Check if the pending email is already linked to another account (exclude deleted accounts)
    const existingUser = await User.findOne({ 
      email: user.pendingEmail,
      $or: [
        { deletedAt: { $exists: false } },
        { deletedAt: null }
      ]
    });
    if (existingUser && (existingUser._id as mongoose.Types.ObjectId).toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      // Clear verification token
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.pendingEmail = undefined;
      await user.save();
      throw createError('This email is already linked to another account', 409);
    }

    // Link email to account
    user.email = user.pendingEmail;
    user.emailLinkedAt = new Date();
    user.emailLinkReminderSent = true;
    
    // Clear verification token and pending email
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.pendingEmail = undefined;
    await user.save();

    // Create audit log
    await logAudit({
      userId: user._id as mongoose.Types.ObjectId,
      action: 'VERIFY_EMAIL',
      success: true,
      details: {
        email: user.email,
        hadMobile: !!user.mobile,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: 'Email verified and linked successfully',
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw createError('Email is required', 400);
    }

    const user = await User.findOne({ email });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send email with reset link
    const resetUrl = `${config.corsOrigin || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    // Import email service
    const { sendPasswordResetEmail } = await import('../utils/email');
    if (user.email) {
      await sendPasswordResetEmail(user.email, resetUrl);
    }
    
    // Log password reset request
    await logAudit({
      userId: user._id as mongoose.Types.ObjectId,
      action: 'FORGOT_PASSWORD',
      success: true,
      details: {
        email: user.email,
        resetTokenExpires: user.resetPasswordExpires,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset URL:', resetUrl);
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { resetUrl }),
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      throw createError('Token and password are required', 400);
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters', 400);
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    console.log('🔐 Password reset attempt - Token hash:', resetTokenHash.substring(0, 20) + '...');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      console.error('❌ Password reset failed - Invalid or expired token');
      // Check if token exists but expired
      const expiredUser = await User.findOne({ resetPasswordToken: resetTokenHash });
      if (expiredUser) {
        console.error('Token found but expired. Expires:', expiredUser.resetPasswordExpires);
      } else {
        console.error('Token not found in database');
      }
      throw createError('Invalid or expired reset token', 400);
    }
    
    console.log('✅ Found user for password reset:', user.email);

    // Update password
    const hashedPassword = await bcrypt.hash(password, 8);
    const oldPasswordHash = user.password; // Store for logging
    user.password = hashedPassword;
    user.passwordChangedAt = new Date(); // Track password change to invalidate old tokens
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Mark fields as modified to ensure they're saved
    user.markModified('password');
    user.markModified('passwordChangedAt');
    
    await user.save();

    // Log password reset completion
    await logAudit({
      userId: user._id as mongoose.Types.ObjectId,
      action: 'RESET_PASSWORD',
      success: true,
      details: {
        email: user.email,
        passwordChangedAt: user.passwordChangedAt,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    // Verify password was actually updated by re-fetching from DB
    const updatedUser = await User.findById(user._id).select('password passwordChangedAt email');
    if (!updatedUser) {
      throw createError('Failed to verify password update', 500);
    }
    
    // Verify the new password works with the updated hash
    const isNewPasswordValid = await bcrypt.compare(password, updatedUser.password);
    if (!isNewPasswordValid) {
      console.error('CRITICAL: Password was not properly updated in database!');
      console.error('User:', updatedUser.email);
      throw createError('Password update failed. Please try again.', 500);
    }
    
    // Verify password hash actually changed
    if (oldPasswordHash === updatedUser.password) {
      console.error('CRITICAL: Password hash did not change after reset!');
      console.error('User:', updatedUser.email);
      throw createError('Password was not updated. Please try again.', 500);
    }
    
    console.log('✅ Password reset successful for user:', updatedUser.email);
    console.log('✅ Password changed at:', updatedUser.passwordChangedAt);
    console.log('✅ Password hash changed:', oldPasswordHash.substring(0, 20), '->', updatedUser.password.substring(0, 20));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user onboarding data
 * PUT /api/user/onboarding
 */
export const updateOnboarding = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { nicheId, goal } = req.body;

    if (!nicheId) {
      throw createError('Niche ID is required', 400);
    }

    if (!goal || !['dropship', 'brand', 'start_small'].includes(goal)) {
      throw createError('Valid goal is required (dropship, brand, or start_small)', 400);
    }

    // Validate niche exists
    const { Niche } = await import('../models/Niche');
    const niche = await Niche.findById(nicheId).where({ deleted: false, active: true });
    if (!niche) {
      throw createError('Niche not found or inactive', 404);
    }

    // Update user onboarding
    const user = await User.findByIdAndUpdate(
      (req.user as any)._id,
      {
        onboarding: {
          nicheId: new mongoose.Types.ObjectId(nicheId),
          goal,
          answeredAt: new Date(),
        },
      },
      { new: true }
    ).select('-password');

    if (!user) {
      throw createError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding data saved successfully',
      data: {
        onboarding: user.onboarding,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

