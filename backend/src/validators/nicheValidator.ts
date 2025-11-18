import { z } from 'zod';

// Schema for creating a new niche
export const createNicheSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(), // Auto-generated if not provided
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  richDescription: z
    .string()
    .trim()
    .optional(), // HTML/markdown
  image: z
    .string()
    .url('Image must be a valid URL')
    .optional()
    .or(z.literal('')),
  icon: z
    .string()
    .max(10, 'Icon cannot exceed 10 characters')
    .optional(),
  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order cannot be negative')
    .default(0),
  priority: z
    .number()
    .int('Priority must be an integer')
    .min(0, 'Priority cannot be negative')
    .default(0),
  featured: z
    .boolean()
    .default(false),
  showOnHomePage: z
    .boolean()
    .default(false),
  synonyms: z
    .array(z.string().trim())
    .default([]),
  metaTitle: z
    .string()
    .max(60, 'Meta title cannot exceed 60 characters')
    .trim()
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description cannot exceed 160 characters')
    .trim()
    .optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Theme color must be a valid hex color (e.g., #FF5733)')
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Text color must be a valid hex color (e.g., #FFFFFF)')
    .optional(),
  defaultSortMode: z
    .enum(['popularity', 'newest', 'price_low_to_high', 'price_high_to_low'])
    .default('newest'),
});

// Schema for updating a niche
export const updateNicheSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  richDescription: z
    .string()
    .trim()
    .optional(),
  image: z
    .string()
    .url('Image must be a valid URL')
    .optional()
    .or(z.literal('')),
  icon: z
    .string()
    .max(10, 'Icon cannot exceed 10 characters')
    .optional(),
  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order cannot be negative')
    .optional(),
  priority: z
    .number()
    .int('Priority must be an integer')
    .min(0, 'Priority cannot be negative')
    .optional(),
  featured: z
    .boolean()
    .optional(),
  showOnHomePage: z
    .boolean()
    .optional(),
  active: z
    .boolean()
    .optional(),
  synonyms: z
    .array(z.string().trim())
    .optional(),
  metaTitle: z
    .string()
    .max(60, 'Meta title cannot exceed 60 characters')
    .trim()
    .optional(),
  metaDescription: z
    .string()
    .max(160, 'Meta description cannot exceed 160 characters')
    .trim()
    .optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Theme color must be a valid hex color (e.g., #FF5733)')
    .optional(),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Text color must be a valid hex color (e.g., #FFFFFF)')
    .optional(),
  defaultSortMode: z
    .enum(['popularity', 'newest', 'price_low_to_high', 'price_high_to_low'])
    .optional(),
  deletedReason: z
    .string()
    .max(500, 'Deleted reason cannot exceed 500 characters')
    .trim()
    .optional(), // For soft delete
});

export type CreateNicheInput = z.infer<typeof createNicheSchema>;
export type UpdateNicheInput = z.infer<typeof updateNicheSchema>;




