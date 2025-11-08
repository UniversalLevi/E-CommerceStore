import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().trim().min(1, 'Password required'),
});

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().trim().min(6, 'Password must be at least 6 characters'),
});

export const storeConnectionSchema = z.object({
  storeName: z.string().trim().min(1, 'Store name required'),
  shopDomain: z.string().trim().regex(/^[a-z0-9-]+\.myshopify\.com$/, 'Invalid domain format'),
  accessToken: z.string().trim().min(1, 'Access token required'),
  apiKey: z.string().trim().optional(),
  apiSecret: z.string().trim().optional(),
  environment: z.enum(['development', 'production']).default('production'),
  isDefault: z.boolean().default(false),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().trim().min(1, 'Current password required'),
    newPassword: z.string().trim().min(6, 'Must be at least 6 characters'),
    confirmPassword: z.string().trim(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

