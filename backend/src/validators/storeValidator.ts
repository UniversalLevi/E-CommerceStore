import { z } from 'zod';

// Schema for creating a new store connection
export const createStoreSchema = z.object({
  storeName: z
    .string()
    .min(1, 'Store name is required')
    .max(100, 'Store name must be less than 100 characters')
    .trim(),
  shopDomain: z
    .string()
    .min(1, 'Shop domain is required')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
      'Shop domain must be in format: storename.myshopify.com'
    )
    .trim()
    .toLowerCase(),
  accessToken: z
    .string()
    .min(1, 'Access token is required')
    .trim(),
  apiKey: z
    .string()
    .trim()
    .optional(),
  apiSecret: z
    .string()
    .trim()
    .optional(),
  environment: z
    .enum(['development', 'production'])
    .optional()
    .default('production'),
  isDefault: z
    .boolean()
    .optional()
    .default(false),
});

// Schema for updating a store connection
export const updateStoreSchema = z.object({
  storeName: z
    .string()
    .min(1, 'Store name is required')
    .max(100, 'Store name must be less than 100 characters')
    .trim()
    .optional(),
  accessToken: z
    .string()
    .min(1, 'Access token is required')
    .trim()
    .optional(),
  apiKey: z
    .string()
    .trim()
    .optional()
    .nullable(),
  apiSecret: z
    .string()
    .trim()
    .optional()
    .nullable(),
  environment: z
    .enum(['development', 'production'])
    .optional(),
  isDefault: z
    .boolean()
    .optional(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
