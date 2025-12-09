import Joi from 'joi';

// Slug pattern: lowercase letters, numbers, and hyphens only
const slugPattern = /^[a-z0-9-]+$/;

// Category enum values
const categories = ['minimal', 'modern', 'luxury', 'bold', 'custom'];

/**
 * Validate template creation request
 */
export const createTemplateSchema = Joi.object({
  name: Joi.string()
    .required()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.empty': 'Template name is required',
      'string.min': 'Template name must be at least 2 characters',
      'string.max': 'Template name cannot exceed 100 characters',
    }),
  slug: Joi.string()
    .required()
    .min(2)
    .max(50)
    .lowercase()
    .trim()
    .pattern(slugPattern)
    .messages({
      'string.empty': 'Template slug is required',
      'string.min': 'Slug must be at least 2 characters',
      'string.max': 'Slug cannot exceed 50 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  description: Joi.string()
    .required()
    .min(10)
    .max(500)
    .trim()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 500 characters',
    }),
  category: Joi.string()
    .valid(...categories)
    .default('custom')
    .messages({
      'any.only': `Category must be one of: ${categories.join(', ')}`,
    }),
  previewImage: Joi.string()
    .uri({ allowRelative: true })
    .allow('')
    .default('')
    .messages({
      'string.uri': 'Preview image must be a valid URL',
    }),
});

/**
 * Validate template update request
 */
export const updateTemplateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Template name must be at least 2 characters',
      'string.max': 'Template name cannot exceed 100 characters',
    }),
  description: Joi.string()
    .min(10)
    .max(500)
    .trim()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description cannot exceed 500 characters',
    }),
  category: Joi.string()
    .valid(...categories)
    .messages({
      'any.only': `Category must be one of: ${categories.join(', ')}`,
    }),
  previewImage: Joi.string()
    .uri({ allowRelative: true })
    .allow('')
    .messages({
      'string.uri': 'Preview image must be a valid URL',
    }),
  isActive: Joi.boolean(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validate duplicate template request
 */
export const duplicateTemplateSchema = Joi.object({
  newSlug: Joi.string()
    .required()
    .min(2)
    .max(50)
    .lowercase()
    .trim()
    .pattern(slugPattern)
    .messages({
      'string.empty': 'New slug is required',
      'string.min': 'Slug must be at least 2 characters',
      'string.max': 'Slug cannot exceed 50 characters',
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  newName: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters',
    }),
});

/**
 * Validate create file request
 */
export const createFileSchema = Joi.object({
  filePath: Joi.string()
    .required()
    .max(200)
    .pattern(/^[a-zA-Z0-9-_./]+$/)
    .custom((value, helpers) => {
      // Prevent directory traversal
      if (value.includes('..')) {
        return helpers.error('string.invalid');
      }
      return value;
    })
    .messages({
      'string.empty': 'File path is required',
      'string.max': 'File path cannot exceed 200 characters',
      'string.pattern.base': 'File path contains invalid characters',
      'string.invalid': 'Invalid file path',
    }),
  content: Joi.string()
    .allow('')
    .default('')
    .max(1000000) // 1MB max
    .messages({
      'string.max': 'File content is too large',
    }),
});

/**
 * Validate save file request
 */
export const saveFileSchema = Joi.object({
  content: Joi.string()
    .required()
    .allow('')
    .max(1000000) // 1MB max
    .messages({
      'any.required': 'Content is required',
      'string.max': 'File content is too large',
    }),
});

/**
 * Validate apply template request
 */
export const applyTemplateSchema = Joi.object({
  storeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid store ID format',
    }),
});

/**
 * Validate generate code request
 */
export const generateCodeSchema = Joi.object({
  prompt: Joi.string()
    .required()
    .min(10)
    .max(1000)
    .trim()
    .messages({
      'string.empty': 'Prompt is required',
      'string.min': 'Prompt must be at least 10 characters',
      'string.max': 'Prompt cannot exceed 1000 characters',
    }),
  codeType: Joi.string()
    .required()
    .valid('liquid', 'json', 'css', 'js')
    .messages({
      'any.required': 'Code type is required',
      'any.only': 'Code type must be one of: liquid, json, css, js',
    }),
  filePath: Joi.string()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'File path cannot exceed 200 characters',
    }),
  existingCode: Joi.string()
    .max(50000)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Existing code is too large',
    }),
});

/**
 * Validate MongoDB ObjectId
 */
export const objectIdSchema = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format',
  });

/**
 * Middleware to validate request body
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }
    
    req.body = value;
    next();
  };
}

/**
 * Middleware to validate params
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }
    
    req.params = value;
    next();
  };
}

