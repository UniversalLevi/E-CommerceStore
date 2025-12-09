import { Router } from 'express';
import Joi from 'joi';
import { authenticateToken } from '../middleware/auth';
import {
  listTemplates,
  getTemplate,
  applyTemplate,
  setDefaultTheme,
  getStoreThemes,
} from '../controllers/templateController';
import {
  applyTemplateSchema,
  validateBody,
} from '../validators/templateValidator';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/templates
 * @desc    List all active templates
 * @access  Private
 */
router.get('/', listTemplates);

/**
 * @route   GET /api/templates/:id
 * @desc    Get template preview info
 * @access  Private
 */
router.get('/:id', getTemplate);

/**
 * @route   POST /api/templates/:id/apply
 * @desc    Apply template to user's store
 * @access  Private
 */
router.post('/:id/apply', validateBody(applyTemplateSchema), applyTemplate);

/**
 * @route   GET /api/templates/store-themes/:storeId
 * @desc    Get all themes from a store
 * @access  Private
 */
router.get('/store-themes/:storeId', getStoreThemes);

/**
 * @route   POST /api/templates/set-default-theme
 * @desc    Set a theme as the default/main theme
 * @access  Private
 */
router.post('/set-default-theme', validateBody(Joi.object({
  storeId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'any.required': 'Store ID is required',
      'string.pattern.base': 'Invalid store ID format',
    }),
  themeId: Joi.number()
    .required()
    .messages({
      'any.required': 'Theme ID is required',
      'number.base': 'Theme ID must be a number',
    }),
})), setDefaultTheme);

export default router;

