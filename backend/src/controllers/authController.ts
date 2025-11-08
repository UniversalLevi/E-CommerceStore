import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists (use lean for faster query)
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      throw createError('Email already registered', 409);
    }

    // Hash password with optimized rounds (10 -> 8 for better performance)
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: 'user',
    });

    // Generate JWT token
    const jwtOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as any,
    };
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, jwtOptions);

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

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw createError('Account is disabled. Please contact support.', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwtOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as any,
    };
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, jwtOptions);

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
    await user.save();

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

    // Soft delete: set deletedAt field
    await User.findByIdAndUpdate(userId, {
      deletedAt: new Date(),
      isActive: false,
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

