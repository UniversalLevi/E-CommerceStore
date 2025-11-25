import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { config } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { logAuditWithRequest, logAudit } from '../utils/auditLogger';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // If account is deleted, hard delete it to allow re-registration
      if (existingUser.deletedAt) {
        console.log('Found deleted account, hard deleting to allow re-registration:', email);
        await User.findByIdAndDelete(existingUser._id);
      } else {
        // Account exists and is not deleted
        throw createError('Email already registered', 409);
      }
    }

    // Hash password with optimized rounds (10 -> 8 for better performance)
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'user',
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

    // Log registration (no user context yet, so use direct logAudit)
    await logAudit({
      userId: user._id as mongoose.Types.ObjectId,
      action: 'USER_REGISTER',
      success: true,
      details: {
        email: user.email,
        role: user.role,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

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
    const { email, password } = req.body;

    // Find user - ensure we get the password field
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found:', email);
      throw createError('Invalid email or password', 401);
    }

    // Check if account is deleted
    if (user.deletedAt) {
      console.log('Login failed: Account deleted:', email);
      throw createError('This account has been deleted.', 403);
    }

    // Check if account is active (but not deleted)
    if (!user.isActive) {
      throw createError('Account is disabled. Please contact support.', 403);
    }

    // Verify password
    console.log('🔐 Login attempt for user:', email);
    console.log('🔐 Stored password hash (first 20 chars):', user.password.substring(0, 20));
    console.log('🔐 Password changed at:', user.passwordChangedAt);
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Login failed: Password mismatch for user:', email);
      throw createError('Invalid email or password', 401);
    }
    
    console.log('✅ Login successful for user:', email);
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

    res.status(200).json({
      success: true,
      user: req.user,
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
    await sendPasswordResetEmail(user.email, resetUrl);
    
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

