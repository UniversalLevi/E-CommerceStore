import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email format'),
  mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format'),
  country: z.string().min(2, 'Country is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  referralCode: z.string().optional(), // Optional referral code for affiliate tracking
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format').optional(),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => data.email || data.mobile, {
  message: 'Either email or mobile number is required',
  path: ['email'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const linkMobileSchema = z.object({
  mobile: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number format'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LinkMobileInput = z.infer<typeof linkMobileSchema>;

