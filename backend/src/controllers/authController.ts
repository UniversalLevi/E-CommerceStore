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

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Generate JWT token
    const jwtOptions: SignOptions = {
      expiresIn: config.jwtExpiresIn as any,
    };
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, jwtOptions);

    // Remove password from response
    const userResponse = user.toObject();
    delete (userResponse as any).password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
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

