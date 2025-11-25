import { z } from 'zod';

/**
 * Validation schema for Find Winning Product endpoint
 */
export const WinningProductSchema = z.object({
  nicheId: z.string().optional(),
  budgetRange: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
    })
    .optional(),
  mode: z.enum(['single', 'top3']).default('single'),
});

/**
 * Validation schema for Write Product Description endpoint
 */
export const WriteDescriptionSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  tone: z.enum(['persuasive', 'informative', 'seo']).default('persuasive'),
  length: z.enum(['short', 'long']).default('short'),
});

