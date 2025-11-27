import { z } from 'zod';
import { isValidPlanCode } from '../config/plans';

export const grantSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planCode: z.string().refine(
    (val) => isValidPlanCode(val),
    { message: 'Invalid plan code' }
  ),
  daysValid: z.number().int().positive().optional(),
  endDate: z.string().optional(),
  adminNote: z.string().optional(),
}).refine(
  (data) => data.daysValid || data.endDate || true, // At least one or use plan default
  { message: 'Either daysValid or endDate should be provided, or plan default will be used' }
);

export const revokeSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  planCode: z.string().refine(
    (val) => isValidPlanCode(val),
    { message: 'Invalid plan code' }
  ).optional(),
  extendDays: z.number().int().positive().optional(),
  adminNote: z.string().optional(),
}).refine(
  (data) => data.planCode || data.extendDays,
  { message: 'Either planCode or extendDays must be provided' }
);

