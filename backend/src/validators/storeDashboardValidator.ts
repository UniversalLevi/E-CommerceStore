import Joi from 'joi';

// Store creation/update validation
export const createStoreSchema = Joi.object({
  name: Joi.string().required().trim().min(3).max(100),
  slug: Joi.string()
    .optional()
    .trim()
    .lowercase()
    .min(3)
    .max(50)
    .pattern(/^[a-z0-9-]+$/)
    .messages({
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  currency: Joi.string().valid('INR', 'USD', 'EUR', 'GBP').default('INR'),
});

export const updateStoreSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).optional(),
  settings: Joi.object({
    testMode: Joi.boolean().optional(),
    emailNotifications: Joi.object({
      orderConfirmation: Joi.boolean().optional(),
      newOrderNotification: Joi.boolean().optional(),
      paymentStatus: Joi.boolean().optional(),
      fulfillmentStatus: Joi.boolean().optional(),
    }).optional(),
  }).optional(),
});

// Product validation
export const createProductSchema = Joi.object({
  title: Joi.string().required().trim().min(3).max(200),
  description: Joi.string().trim().optional().allow(''),
  basePrice: Joi.number().required().min(0),
  status: Joi.string().valid('draft', 'active').default('draft'),
  images: Joi.array()
    .items(Joi.string().uri())
    .max(5)
    .messages({
      'array.max': 'Maximum 5 images allowed per product',
    }),
  variantDimension: Joi.string().trim().max(50).optional().allow(''),
  variants: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required().trim(),
        price: Joi.number().min(0).optional(),
        inventory: Joi.number().min(0).allow(null).optional(),
      })
    )
    .optional()
    .default([]),
  inventoryTracking: Joi.boolean().default(false),
});

export const updateProductSchema = createProductSchema;

// Order validation
export const createOrderSchema = Joi.object({
  customer: Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().required().email().lowercase().trim(),
    phone: Joi.string().required().trim(),
  }).required(),
  shippingAddress: Joi.object({
    name: Joi.string().required().trim(),
    address1: Joi.string().required().trim(),
    address2: Joi.string().trim().optional().allow(''),
    city: Joi.string().required().trim(),
    state: Joi.string().required().trim(),
    zip: Joi.string().required().trim(),
    country: Joi.string().required().trim(),
    phone: Joi.string().required().trim(),
  }).required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required().messages({
          'string.empty': 'Product ID is required',
          'any.required': 'Product ID is required',
        }),
        variant: Joi.string().optional().allow('', null).messages({
          'string.base': 'Variant must be a string',
        }),
        quantity: Joi.number().required().min(1).messages({
          'number.base': 'Quantity must be a number',
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Quantity is required',
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required',
    }),
  shipping: Joi.number().min(0).default(0),
});

export const updateFulfillmentSchema = Joi.object({
  fulfillmentStatus: Joi.string()
    .valid('pending', 'fulfilled', 'cancelled', 'shipped')
    .required(),
});

export const bulkFulfillmentSchema = Joi.object({
  orderIds: Joi.array().items(Joi.string().required()).min(1).required(),
  fulfillmentStatus: Joi.string()
    .valid('pending', 'fulfilled', 'cancelled', 'shipped')
    .required(),
});

export const orderNoteSchema = Joi.object({
  text: Joi.string().required().trim().min(1).max(1000),
});

// Slug validation helper
export function validateSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}
