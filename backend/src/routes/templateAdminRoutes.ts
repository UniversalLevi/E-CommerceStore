import { Router } from 'express';
import Joi from 'joi';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  adminListTemplates,
  adminGetTemplate,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate,
  adminDuplicateTemplate,
  adminReadFile,
  adminSaveFile,
  adminCreateFile,
  adminDeleteFile,
  adminGenerateCode,
  adminGenerateTheme,
} from '../controllers/templateController';
import {
  createTemplateSchema,
  updateTemplateSchema,
  duplicateTemplateSchema,
  createFileSchema,
  saveFileSchema,
  generateCodeSchema,
  validateBody,
} from '../validators/templateValidator';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/templates
 * @desc    List all templates (including inactive and deleted)
 * @access  Admin
 */
router.get('/', adminListTemplates);

/**
 * @route   POST /api/admin/templates
 * @desc    Create a new template
 * @access  Admin
 */
router.post('/', validateBody(createTemplateSchema), adminCreateTemplate);

/**
 * @route   GET /api/admin/templates/:id
 * @desc    Get template details with file tree
 * @access  Admin
 */
router.get('/:id', adminGetTemplate);

/**
 * @route   PUT /api/admin/templates/:id
 * @desc    Update template metadata
 * @access  Admin
 */
router.put('/:id', validateBody(updateTemplateSchema), adminUpdateTemplate);

/**
 * @route   DELETE /api/admin/templates/:id
 * @desc    Soft delete or permanently delete template
 * @access  Admin
 * @query   permanent - If "true", permanently deletes the template
 */
router.delete('/:id', adminDeleteTemplate);

/**
 * @route   POST /api/admin/templates/:id/duplicate
 * @desc    Duplicate a template
 * @access  Admin
 */
router.post('/:id/duplicate', validateBody(duplicateTemplateSchema), adminDuplicateTemplate);

/**
 * @route   GET /api/admin/templates/:id/files/*
 * @desc    Read file content from template
 * @access  Admin
 */
router.get('/:id/files/*', adminReadFile);

/**
 * @route   PUT /api/admin/templates/:id/files/*
 * @desc    Save file content to template
 * @access  Admin
 */
router.put('/:id/files/*', validateBody(saveFileSchema), adminSaveFile);

/**
 * @route   POST /api/admin/templates/:id/files
 * @desc    Create a new file in template
 * @access  Admin
 */
router.post('/:id/files', validateBody(createFileSchema), adminCreateFile);

/**
 * @route   DELETE /api/admin/templates/:id/files/*
 * @desc    Delete a file from template
 * @access  Admin
 */
router.delete('/:id/files/*', adminDeleteFile);

/**
 * @route   POST /api/admin/templates/:id/generate-code
 * @desc    Generate code using AI
 * @access  Admin
 */
router.post('/:id/generate-code', validateBody(generateCodeSchema), adminGenerateCode);

/**
 * @route   POST /api/admin/templates/:id/generate-theme
 * @desc    Generate complete theme using AI
 * @access  Admin
 */
router.post('/:id/generate-theme', validateBody(Joi.object({
  prompt: Joi.string().required().min(20).max(2000).trim().messages({
    'string.empty': 'Prompt is required',
    'string.min': 'Prompt must be at least 20 characters',
    'string.max': 'Prompt cannot exceed 2000 characters',
  }),
})), adminGenerateTheme);

export default router;

