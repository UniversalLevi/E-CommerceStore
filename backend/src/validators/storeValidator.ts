import { z } from 'zod';

export const createStoreSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

