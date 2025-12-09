import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Template, ITemplate } from '../models/Template';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';
import * as templateService from '../services/templateService';
import * as shopifyThemeService from '../services/shopifyThemeService';
import { generateTemplateCode, generateCompleteTheme } from '../services/OpenAIService';
import { decrypt } from '../utils/encryption';

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * List all templates (admin)
 * GET /api/admin/templates
 */
export const adminListTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { includeDeleted = 'false', category } = req.query;
    
    const query: any = {};
    
    if (includeDeleted !== 'true') {
      query.isDeleted = false;
    }
    
    if (category) {
      query.category = category;
    }
    
    const templates = await Template.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single template details (admin)
 * GET /api/admin/templates/:id
 */
export const adminGetTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findById(id)
      .populate('createdBy', 'name email')
      .lean();
    
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Get file tree
    const fileTree = await templateService.getFileTree(template.slug);
    
    // Validate template
    const validation = await templateService.validateTemplate(template.slug);
    
    res.json({
      success: true,
      data: {
        ...template,
        fileTree,
        validation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new template (admin)
 * POST /api/admin/templates
 */
export const adminCreateTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { name, slug, description, category = 'custom', previewImage = '' } = req.body;
    
    // Validate slug
    if (!templateService.validateSlug(slug)) {
      throw createError('Invalid slug. Use only lowercase letters, numbers, and hyphens.', 400);
    }
    
    // Check if slug already exists
    const existingTemplate = await Template.findOne({ slug });
    if (existingTemplate) {
      throw createError('A template with this slug already exists', 400);
    }
    
    // Create filesystem structure
    const metadata: templateService.TemplateMetadata = {
      id: slug,
      name,
      description,
      category,
      version: '1.0.0',
      author: req.user.name || req.user.email || 'Admin',
      previewImage,
      features: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    
    await templateService.createTemplate(slug, metadata);
    
    // Create database record
    const template = await Template.create({
      name,
      slug,
      description,
      category,
      previewImage,
      isActive: false, // Start as inactive until files are added
      isDeleted: false,
      createdBy: (req.user as any)._id,
    });
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'CREATE_TEMPLATE',
      success: true,
      details: {
        templateId: template._id,
        templateName: name,
        slug,
      },
      ipAddress: req.ip,
    });
    
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update template metadata (admin)
 * PUT /api/admin/templates/:id
 */
export const adminUpdateTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { name, description, category, previewImage, isActive } = req.body;
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Update fields
    if (name !== undefined) template.name = name;
    if (description !== undefined) template.description = description;
    if (category !== undefined) template.category = category;
    if (previewImage !== undefined) template.previewImage = previewImage;
    if (isActive !== undefined) template.isActive = isActive;
    
    await template.save();
    
    // Update filesystem metadata
    const fsMetadata = await templateService.getTemplateMetadata(template.slug);
    if (fsMetadata) {
      fsMetadata.name = template.name;
      fsMetadata.description = template.description;
      fsMetadata.category = template.category;
      fsMetadata.previewImage = template.previewImage;
      fsMetadata.updatedAt = new Date().toISOString().split('T')[0];
      await templateService.saveTemplateMetadata(template.slug, fsMetadata);
    }
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'UPDATE_TEMPLATE',
      success: true,
      details: {
        templateId: template._id,
        updates: Object.keys(req.body),
      },
      ipAddress: req.ip,
    });
    
    res.json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete template (admin)
 * DELETE /api/admin/templates/:id
 */
export const adminDeleteTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { permanent = 'false' } = req.query;
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    if (permanent === 'true') {
      // Permanent delete - remove from filesystem and DB
      await templateService.deleteTemplate(template.slug);
      await Template.findByIdAndDelete(id);
      
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'PERMANENT_DELETE_TEMPLATE',
        success: true,
        details: {
          templateId: id,
          templateName: template.name,
          slug: template.slug,
        },
        ipAddress: req.ip,
      });
      
      res.json({
        success: true,
        message: 'Template permanently deleted',
      });
    } else {
      // Soft delete
      template.isDeleted = true;
      template.isActive = false;
      await template.save();
      
      await AuditLog.create({
        userId: (req.user as any)._id,
        action: 'DELETE_TEMPLATE',
        success: true,
        details: {
          templateId: id,
          templateName: template.name,
        },
        ipAddress: req.ip,
      });
      
      res.json({
        success: true,
        message: 'Template deleted',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Duplicate template (admin)
 * POST /api/admin/templates/:id/duplicate
 */
export const adminDuplicateTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { newSlug, newName } = req.body;
    
    if (!newSlug || !templateService.validateSlug(newSlug)) {
      throw createError('Invalid new slug', 400);
    }
    
    const sourceTemplate = await Template.findById(id);
    if (!sourceTemplate) {
      throw createError('Source template not found', 404);
    }
    
    // Check if new slug exists
    const existing = await Template.findOne({ slug: newSlug });
    if (existing) {
      throw createError('A template with this slug already exists', 400);
    }
    
    // Duplicate filesystem
    await templateService.duplicateTemplate(sourceTemplate.slug, newSlug);
    
    // Create new DB record
    const newTemplate = await Template.create({
      name: newName || `${sourceTemplate.name} (Copy)`,
      slug: newSlug,
      description: sourceTemplate.description,
      category: sourceTemplate.category,
      previewImage: sourceTemplate.previewImage,
      isActive: false,
      isDeleted: false,
      createdBy: (req.user as any)._id,
    });
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'DUPLICATE_TEMPLATE',
      success: true,
      details: {
        sourceTemplateId: id,
        newTemplateId: newTemplate._id,
        newSlug,
      },
      ipAddress: req.ip,
    });
    
    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: newTemplate,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Read file content (admin)
 * GET /api/admin/templates/:id/files/*
 */
export const adminReadFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const filePath = req.params[0]; // Wildcard path
    
    if (!filePath || !templateService.validateFilePath(filePath)) {
      throw createError('Invalid file path', 400);
    }
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    const content = await templateService.readTemplateFile(template.slug, filePath);
    
    res.json({
      success: true,
      data: {
        path: filePath,
        content,
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return next(createError('File not found', 404));
    }
    next(error);
  }
};

/**
 * Save file content (admin)
 * PUT /api/admin/templates/:id/files/*
 */
export const adminSaveFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const filePath = req.params[0]; // Wildcard path
    const { content } = req.body;
    
    if (!filePath || !templateService.validateFilePath(filePath)) {
      throw createError('Invalid file path', 400);
    }
    
    if (content === undefined) {
      throw createError('Content is required', 400);
    }
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    await templateService.writeTemplateFile(template.slug, filePath, content);
    
    // Update template's updatedAt
    template.updatedAt = new Date();
    await template.save();
    
    res.json({
      success: true,
      message: 'File saved successfully',
      data: {
        path: filePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new file (admin)
 * POST /api/admin/templates/:id/files
 */
export const adminCreateFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { filePath, content = '' } = req.body;
    
    if (!filePath || !templateService.validateFilePath(filePath)) {
      throw createError('Invalid file path', 400);
    }
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Check if file already exists
    try {
      await templateService.readTemplateFile(template.slug, filePath);
      throw createError('File already exists', 400);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    await templateService.writeTemplateFile(template.slug, filePath, content);
    
    res.status(201).json({
      success: true,
      message: 'File created successfully',
      data: {
        path: filePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete file (admin)
 * DELETE /api/admin/templates/:id/files/*
 */
export const adminDeleteFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const filePath = req.params[0]; // Wildcard path
    
    if (!filePath || !templateService.validateFilePath(filePath)) {
      throw createError('Invalid file path', 400);
    }
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    await templateService.deleteTemplateFile(template.slug, filePath);
    
    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return next(createError('File not found', 404));
    }
    next(error);
  }
};

/**
 * Generate code using AI (admin)
 * POST /api/admin/templates/:id/generate-code
 */
export const adminGenerateCode = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { prompt, codeType, filePath, existingCode } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw createError('Prompt is required', 400);
    }
    
    if (!codeType || !['liquid', 'json', 'css', 'js'].includes(codeType)) {
      throw createError('Invalid code type. Must be: liquid, json, css, or js', 400);
    }
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Generate code using AI
    const generatedCode = await generateTemplateCode(prompt, codeType, {
      templateName: template.name,
      existingCode,
      filePath,
    });
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'UPDATE_TEMPLATE',
      success: true,
      details: {
        templateId: id,
        action: 'AI_CODE_GENERATION',
        codeType,
        filePath,
      },
      ipAddress: req.ip,
    });
    
    res.json({
      success: true,
      data: {
        code: generatedCode,
        codeType,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate complete theme with AI (admin)
 * POST /api/admin/templates/:id/generate-theme
 */
export const adminGenerateTheme = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw createError('Prompt is required', 400);
    }
    
    if (prompt.length < 20) {
      throw createError('Prompt must be at least 20 characters', 400);
    }
    
    const template = await Template.findById(id);
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Generate complete theme using AI
    let themeFiles;
    try {
      themeFiles = await generateCompleteTheme(prompt, template.name);
    } catch (error: any) {
      console.error('[Theme Generation] AI generation failed:', error);
      throw createError(
        error.message || 'Failed to generate theme with AI. Please check your OpenAI API key and try again.',
        500
      );
    }
    
    // Write all files to the template
    const filesCreated: string[] = [];
    const errors: string[] = [];
    
    // Write layout
    if (themeFiles.layout && themeFiles.layout.content && themeFiles.layout.content.trim()) {
      try {
        await templateService.writeTemplateFile(template.slug, themeFiles.layout.path, themeFiles.layout.content);
        filesCreated.push(themeFiles.layout.path);
        console.log(`[Theme Generation] Created ${themeFiles.layout.path}`);
      } catch (error: any) {
        const errorMsg = `Failed to create ${themeFiles.layout.path}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`[Theme Generation] ${errorMsg}`);
      }
    } else {
      errors.push('Layout file was empty or missing content');
    }
    
    // Write sections
    for (const section of themeFiles.sections) {
      if (section.content && section.content.trim()) {
        try {
          await templateService.writeTemplateFile(template.slug, section.path, section.content);
          filesCreated.push(section.path);
          console.log(`[Theme Generation] Created ${section.path}`);
        } catch (error: any) {
          const errorMsg = `Failed to create ${section.path}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`[Theme Generation] ${errorMsg}`);
        }
      } else {
        errors.push(`Section ${section.path} was empty or missing content`);
      }
    }
    
    // Write templates
    for (const templateFile of themeFiles.templates) {
      if (templateFile.content && templateFile.content.trim()) {
        try {
          await templateService.writeTemplateFile(template.slug, templateFile.path, templateFile.content);
          filesCreated.push(templateFile.path);
          console.log(`[Theme Generation] Created ${templateFile.path}`);
        } catch (error: any) {
          const errorMsg = `Failed to create ${templateFile.path}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`[Theme Generation] ${errorMsg}`);
        }
      } else {
        errors.push(`Template ${templateFile.path} was empty or missing content`);
      }
    }
    
    // Write assets
    for (const asset of themeFiles.assets) {
      if (asset.content && asset.content.trim()) {
        try {
          await templateService.writeTemplateFile(template.slug, asset.path, asset.content);
          filesCreated.push(asset.path);
          console.log(`[Theme Generation] Created ${asset.path}`);
        } catch (error: any) {
          const errorMsg = `Failed to create ${asset.path}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`[Theme Generation] ${errorMsg}`);
        }
      } else {
        errors.push(`Asset ${asset.path} was empty or missing content`);
      }
    }
    
    // Write config
    for (const config of themeFiles.config) {
      if (config.content && config.content.trim()) {
        try {
          await templateService.writeTemplateFile(template.slug, config.path, config.content);
          filesCreated.push(config.path);
          console.log(`[Theme Generation] Created ${config.path}`);
        } catch (error: any) {
          const errorMsg = `Failed to create ${config.path}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`[Theme Generation] ${errorMsg}`);
        }
      } else {
        errors.push(`Config ${config.path} was empty or missing content`);
      }
    }
    
    // Write pages
    for (const page of themeFiles.pages) {
      if (page.content && page.content.trim()) {
        try {
          await templateService.writeTemplateFile(template.slug, page.path, page.content);
          filesCreated.push(page.path);
          console.log(`[Theme Generation] Created ${page.path}`);
        } catch (error: any) {
          const errorMsg = `Failed to create ${page.path}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`[Theme Generation] ${errorMsg}`);
        }
      } else {
        errors.push(`Page ${page.path} was empty or missing content`);
      }
    }
    
    console.log(`[Theme Generation] Total files created: ${filesCreated.length}, Errors: ${errors.length}`);
    
    // Update template's updatedAt
    template.updatedAt = new Date();
    await template.save();
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'UPDATE_TEMPLATE',
      success: filesCreated.length > 0,
      details: {
        templateId: id,
        action: 'AI_THEME_GENERATION',
        filesCreated: filesCreated.length,
        errors: errors.length,
      },
      ipAddress: req.ip,
    });
    
    console.log(`[Theme Generation] Summary: ${filesCreated.length} files created, ${errors.length} errors`);
    
    if (filesCreated.length === 0) {
      const errorMessage = errors.length > 0 
        ? `No files were generated. Errors: ${errors.join('; ')}`
        : 'No files were generated. The AI response may have been empty or invalid.';
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
        message: 'Theme generation failed. Please try again with a more detailed prompt.',
        data: {
          filesCreated: 0,
          files: [],
          errors: errors.length > 0 ? errors : ['No files were generated from the AI response'],
        },
      });
    }
    
    res.json({
      success: true,
      message: `Theme generated successfully. ${filesCreated.length} file${filesCreated.length !== 1 ? 's' : ''} created.${errors.length > 0 ? ` ${errors.length} error(s) occurred.` : ''}`,
      data: {
        filesCreated: filesCreated.length,
        files: filesCreated,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('[Theme Generation Error]', error);
    // If it's already a createError, pass it through
    if (error.statusCode) {
      return next(error);
    }
    // Otherwise, wrap it
    next(createError(
      error.message || 'An unexpected error occurred during theme generation',
      500
    ));
  }
};

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Get all themes from a store
 * GET /api/templates/store-themes/:storeId
 */
export const getStoreThemes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { storeId } = req.params;
    
    // Get store connection
    const storeConnection = await StoreConnection.findById(storeId);
    
    if (!storeConnection) {
      throw createError('Store connection not found', 404);
    }
    
    // Verify ownership or admin
    const isOwner = storeConnection.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }
    
    if (storeConnection.status !== 'active') {
      throw createError('Store connection is not active. Please test the connection first.', 400);
    }
    
    // Get all themes from the store
    const themes = await shopifyThemeService.getThemes(storeConnection);
    
    res.json({
      success: true,
      data: themes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List active templates (user)
 * GET /api/templates
 */
export const listTemplates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category } = req.query;
    
    const query: any = {
      isActive: true,
      isDeleted: false,
    };
    
    if (category) {
      query.category = category;
    }
    
    const templates = await Template.find(query)
      .select('name slug description previewImage category appliedCount createdAt')
      .sort({ appliedCount: -1, createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      count: templates.length,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get template preview info (user)
 * GET /api/templates/:id
 */
export const getTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    })
      .select('name slug description previewImage category appliedCount metadata createdAt')
      .lean();
    
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Get preview of what will be applied
    const preview = await shopifyThemeService.previewTemplateApplication(template.slug);
    
    res.json({
      success: true,
      data: {
        ...template,
        preview,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Apply template to user's store
 * POST /api/templates/:id/apply
 */
export const applyTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { storeId } = req.body;
    
    // Get template
    const template = await Template.findOne({
      _id: id,
      isActive: true,
      isDeleted: false,
    });
    
    if (!template) {
      throw createError('Template not found', 404);
    }
    
    // Get store connection
    let storeConnection;
    
    if (storeId) {
      storeConnection = await StoreConnection.findById(storeId);
      
      if (!storeConnection) {
        throw createError('Store connection not found', 404);
      }
      
      // Verify ownership or admin
      const isOwner = storeConnection.owner.toString() === (req.user as any)._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        throw createError('You do not have access to this store', 403);
      }
    } else {
      // Use default store
      storeConnection = await StoreConnection.findOne({
        owner: (req.user as any)._id,
        isDefault: true,
        status: 'active',
      });
      
      if (!storeConnection) {
        throw createError('No default store connected. Please connect a store first.', 400);
      }
    }
    
    if (storeConnection.status !== 'active') {
      throw createError('Store connection is not active. Please test the connection first.', 400);
    }
    
    // Apply template
    const result = await shopifyThemeService.applyTemplate(storeConnection, template.slug);
    
    // Increment applied count
    await Template.findByIdAndUpdate(id, {
      $inc: { appliedCount: 1 },
    });
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: storeConnection._id,
      action: 'APPLY_TEMPLATE',
      success: result.success,
      errorMessage: result.errors.length > 0 ? result.errors.join('; ') : undefined,
      details: {
        templateId: id,
        templateName: template.name,
        themeId: result.themeId,
        assetsUploaded: result.assetsUploaded,
        pagesCreated: result.pagesCreated,
      },
      ipAddress: req.ip,
    });
    
    // Create notification
    await createNotification({
      userId: (req.user as any)._id,
      type: 'template_applied',
      title: 'Template Applied',
      message: result.success
        ? `Template "${template.name}" has been successfully applied to your store "${storeConnection.storeName}".`
        : `Template "${template.name}" was applied with some errors. Please check your store.`,
      link: `/dashboard/stores/${(storeConnection as any)._id}`,
      metadata: {
        templateId: id.toString(),
        templateName: template.name,
        storeId: (storeConnection as any)._id.toString(),
        storeName: storeConnection.storeName,
      },
    });
    
    const storeUrl = `https://${storeConnection.shopDomain.replace('.myshopify.com', '')}.myshopify.com`;
    
    res.json({
      success: true,
      message: result.success
        ? 'Template applied successfully'
        : 'Template applied with some errors',
      data: {
        ...result,
        storeUrl,
        adminUrl: `https://${storeConnection.shopDomain}/admin/themes/${result.themeId}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set a theme as the default/main theme
 * POST /api/templates/set-default-theme
 */
export const setDefaultTheme = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { storeId, themeId } = req.body;
    
    if (!storeId) {
      throw createError('Store ID is required', 400);
    }
    
    if (!themeId || typeof themeId !== 'number') {
      throw createError('Theme ID is required and must be a number', 400);
    }
    
    // Get store connection
    let storeConnection;
    
    if (storeId) {
      storeConnection = await StoreConnection.findById(storeId);
      
      if (!storeConnection) {
        throw createError('Store connection not found', 404);
      }
      
      // Verify ownership or admin
      const isOwner = storeConnection.owner.toString() === (req.user as any)._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        throw createError('You do not have access to this store', 403);
      }
    } else {
      // Use default store
      storeConnection = await StoreConnection.findOne({
        owner: (req.user as any)._id,
        isDefault: true,
        status: 'active',
      });
      
      if (!storeConnection) {
        throw createError('No default store connected. Please connect a store first.', 400);
      }
    }
    
    if (storeConnection.status !== 'active') {
      throw createError('Store connection is not active. Please test the connection first.', 400);
    }
    
    // Set theme as main
    console.log(`[Set Default Theme Controller] Setting theme ${themeId} as main for store ${storeConnection.storeName}`);
    const updatedTheme = await shopifyThemeService.setThemeAsMain(storeConnection, themeId);
    console.log(`[Set Default Theme Controller] Theme updated: ${updatedTheme.name}, role: ${updatedTheme.role}`);
    
    // Verify one more time
    const finalThemes = await shopifyThemeService.getThemes(storeConnection);
    const finalMainTheme = finalThemes.find(theme => theme.role === 'main');
    console.log(`[Set Default Theme Controller] Final verification - Main theme: ${finalMainTheme?.id} (${finalMainTheme?.name})`);
    
    if (finalMainTheme?.id !== themeId) {
      console.error(`[Set Default Theme Controller] WARNING: Theme change verification failed. Expected ${themeId}, got ${finalMainTheme?.id}`);
    }
    
    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: storeConnection._id,
      action: 'SET_DEFAULT_THEME',
      success: finalMainTheme?.id === themeId,
      details: {
        themeId,
        themeName: updatedTheme.name,
        storeName: storeConnection.storeName,
        verifiedMainThemeId: finalMainTheme?.id,
        verificationPassed: finalMainTheme?.id === themeId,
      },
      ipAddress: req.ip,
    });
    
    // Create notification
    await createNotification({
      userId: (req.user as any)._id,
      type: 'system_update',
      title: 'Default Theme Changed',
      message: `Theme "${updatedTheme.name}" has been set as the default theme for your store "${storeConnection.storeName}".`,
      link: `/dashboard/stores/${(storeConnection as any)._id}`,
      metadata: {
        storeId: (storeConnection as any)._id.toString(),
        storeName: storeConnection.storeName,
        themeId: themeId.toString(),
        themeName: updatedTheme.name,
      },
    });
    
    const storeUrl = `https://${storeConnection.shopDomain.replace('.myshopify.com', '')}.myshopify.com`;
    
    res.json({
      success: true,
      message: `Theme "${updatedTheme.name}" has been set as the default theme`,
      data: {
        themeId: updatedTheme.id,
        themeName: updatedTheme.name,
        storeUrl,
        adminUrl: `https://${storeConnection.shopDomain}/admin/themes/${updatedTheme.id}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

