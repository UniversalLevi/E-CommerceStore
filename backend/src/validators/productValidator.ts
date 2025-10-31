import { z } from 'zod';

export const createProductSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be a positive number'),
  category: z.string().min(2, 'Category is required'),
  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .min(1, 'At least one image is required'),
  active: z.boolean().optional(),
});

export const updateProductSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .optional(),
  price: z.number().positive('Price must be a positive number').optional(),
  category: z.string().min(2, 'Category is required').optional(),
  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .min(1, 'At least one image is required')
    .optional(),
  active: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

