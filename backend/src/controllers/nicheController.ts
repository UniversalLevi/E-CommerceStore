import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Niche, INiche } from '../models/Niche';
import { Product } from '../models/Product';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { clearNicheCache } from '../middleware/cache';
import { toAbsoluteImageUrls } from '../utils/imageUrl';
import { CreateNicheInput, UpdateNicheInput } from '../validators/nicheValidator';

/**
 * Helper: Validate niche uniqueness (case-insensitive)
 */
async function validateNicheUniqueness(
  name: string,
  slug: string,
  excludeId?: string
): Promise<{ nameExists: boolean; slugExists: boolean }> {
  const nameQuery: any = { name: { $regex: new RegExp(`^${name}$`, 'i') } };
  const slugQuery: any = { slug: slug.toLowerCase() };

  if (excludeId) {
    nameQuery._id = { $ne: excludeId };
    slugQuery._id = { $ne: excludeId };
  }

  const [nameExists, slugExists] = await Promise.all([
    Niche.findOne(nameQuery).lean(),
    Niche.findOne(slugQuery).lean(),
  ]);

  return {
    nameExists: !!nameExists,
    slugExists: !!slugExists,
  };
}

/**
 * Helper: Update niche product counts
 * Exported for use in product controller
 */
export async function updateNicheProductCounts(nicheId: string) {
  const niche = await Niche.findById(nicheId);
  if (niche) {
    await (niche as any).updateProductCounts();
  }
}

/**
 * Helper: Ensure default niche exists
 */
async function ensureDefaultNicheExists() {
  const defaultNiche = await Niche.findOne({ isDefault: true }).lean();
  if (!defaultNiche) {
    await Niche.create({
      name: 'Uncategorized',
      slug: 'uncategorized',
      description: 'Products that have not been assigned to a specific niche',
      isDefault: true,
      active: true,
      order: 0,
      priority: 0,
      featured: false,
      showOnHomePage: false,
      defaultSortMode: 'newest',
    });
  }
}

/**
 * Helper: Log niche activity
 */
async function logNicheActivity(
  action: string,
  nicheId: string,
  userId: string,
  metadata?: any
) {
  try {
    await AuditLog.create({
      userId: userId as any,
      action: action as any,
      success: true,
      details: {
        nicheId,
        ...metadata,
      },
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Failed to log niche activity:', error);
  }
}

/**
 * Public: Get all active niches
 * GET /api/niches
 */
export const getAllNiches = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { featured, showOnHomePage, active = 'true', sort } = req.query;

    const query: any = {
      deleted: false,
    };

    if (active === 'true') {
      query.active = true;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (showOnHomePage === 'true') {
      query.showOnHomePage = true;
    }

    let sortOption: any = { order: 1 };
    if (sort === 'priority') {
      sortOption = { priority: -1, order: 1 };
    }

    const niches = await Niche.find(query)
      .select('-hiddenProductCount -totalProductCount -deletedBy -deletedReason')
      .sort(sortOption)
      .lean();

    // Add productCount (using activeProductCount)
    const nichesWithCounts = niches.map((niche) => ({
      ...niche,
      productCount: niche.activeProductCount || 0,
    }));

    res.json({
      success: true,
      data: nichesWithCounts,
    });
  } catch (error: any) {
    next(createError(error.message || 'Failed to fetch niches', 500));
  }
};

/**
 * Public: Get niche by slug
 * GET /api/niches/:slug
 */
export const getNicheBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;

    const niche = await Niche.findOne({
      slug: slug.toLowerCase(),
      active: true,
      deleted: false,
    })
      .select('-hiddenProductCount -totalProductCount -deletedBy -deletedReason')
      .lean();

    if (!niche) {
      throw createError('Niche not found', 404);
    }

    res.json({
      success: true,
      data: {
        ...niche,
        productCount: niche.activeProductCount || 0,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch niche', 500));
  }
};

/**
 * Public: Get products in niche (paginated)
 * GET /api/niches/:slug/products
 */
export const getNicheProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { slug } = req.params;
    const {
      page = '1',
      limit = '24',
      active = 'true',
      category,
      sort,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    // Find niche
    const niche = await Niche.findOne({
      slug: slug.toLowerCase(),
      active: true,
      deleted: false,
    }).lean();

    if (!niche) {
      throw createError('Niche not found', 404);
    }

    // Build product query
    const productQuery: any = {
      niche: niche._id,
    };

    if (active === 'true') {
      productQuery.active = true;
    }

    if (category) {
      productQuery.category = category;
    }

    // Sort options
    let sortOption: any = { createdAt: -1 }; // Default: newest
    const sortMode = sort || niche.defaultSortMode || 'newest';

    switch (sortMode) {
      case 'popularity':
        // TODO: Implement popularity sorting (could use view count, sales, etc.)
        sortOption = { createdAt: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'price_low_to_high':
        sortOption = { price: 1 };
        break;
      case 'price_high_to_low':
        sortOption = { price: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Get products with pagination
    const skip = (pageNum - 1) * limitNum;
    const [products, total] = await Promise.all([
      Product.find(productQuery)
        .populate('niche', 'name slug icon')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(productQuery),
    ]);

    const pages = Math.ceil(total / limitNum);

    const data = products.map((p: any) => ({
      ...p,
      images: toAbsoluteImageUrls(p.images),
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
      meta: {
        niche: {
          _id: niche._id,
          name: niche.name,
          slug: niche.slug,
          description: niche.description,
          icon: niche.icon,
        },
        lastUpdatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch products', 500));
  }
};

/**
 * Admin: Get all niches (including deleted)
 * GET /api/admin/niches
 */
export const getAllNichesAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { search, deleted, active, createdBy } = req.query;

    const query: any = {};

    if (deleted !== 'true') {
      query.deleted = false;
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    let niches = await Niche.find(query)
      .populate('createdBy', 'email')
      .populate('updatedBy', 'email')
      .populate('deletedBy', 'email')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // Search by name, slug, or synonyms
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      niches = niches.filter(
        (niche) =>
          niche.name.toLowerCase().includes(searchTerm) ||
          niche.slug.toLowerCase().includes(searchTerm) ||
          niche.synonyms.some((syn) => syn.toLowerCase().includes(searchTerm))
      );
    }

    res.json({
      success: true,
      data: niches,
    });
  } catch (error: any) {
    next(createError(error.message || 'Failed to fetch niches', 500));
  }
};

/**
 * Admin: Create niche
 * POST /api/admin/niches
 */
export const createNiche = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const data: CreateNicheInput = req.body;

    // Auto-generate slug if not provided
    if (!data.slug && data.name) {
      data.slug = (Niche as any).generateSlug(data.name);
    }

    // Validate uniqueness
    const { nameExists, slugExists } = await validateNicheUniqueness(
      data.name,
      data.slug || (Niche as any).generateSlug(data.name)
    );

    if (nameExists) {
      throw createError('Niche name already exists', 400);
    }

    if (slugExists) {
      throw createError('Niche slug already exists', 400);
    }

    // Create niche
    const niche = await Niche.create({
      ...data,
      slug: data.slug?.toLowerCase() || (Niche as any).generateSlug(data.name),
      createdBy: (req.user as any)._id,
    });

    // Clear cache
    clearNicheCache();

    // Log activity
    await logNicheActivity('CREATE_NICHE', (niche._id as any).toString(), (req.user as any)._id.toString(), {
      name: niche.name,
      slug: niche.slug,
    });

    res.status(201).json({
      success: true,
      data: niche,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to create niche', 500));
  }
};

/**
 * Admin: Update niche
 * PUT /api/admin/niches/:id
 */
export const updateNiche = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;
    const data: UpdateNicheInput = req.body;

    const existing = await Niche.findById(id);
    if (!existing) {
      throw createError('Niche not found', 404);
    }

    // Prevent modifications to default niche
    if (existing.isDefault) {
      const protectedFields = ['name', 'slug', 'active', 'deleted', 'isDefault'];
      for (const field of protectedFields) {
        if (data[field as keyof UpdateNicheInput] !== undefined) {
          throw createError(`Cannot modify ${field} of default niche`, 400);
        }
      }
    }

    // Prevent slug change if products exist
    if (data.slug && data.slug !== existing.slug && existing.totalProductCount > 0) {
      throw createError(
        'Cannot change slug when products exist. This would break URLs.',
        400
      );
    }

    // Validate uniqueness if name or slug changed
    if (data.name || data.slug) {
      const newName = data.name || existing.name;
      const newSlug = (data.slug || existing.slug)?.toLowerCase();

      const { nameExists, slugExists } = await validateNicheUniqueness(
        newName,
        newSlug,
        id
      );

      if (nameExists && data.name && data.name !== existing.name) {
        throw createError('Niche name already exists', 400);
      }

      if (slugExists && data.slug && data.slug !== existing.slug) {
        throw createError('Niche slug already exists', 400);
      }
    }

    // Update niche
    const updated = await Niche.findByIdAndUpdate(
      id,
      {
        ...data,
        updatedBy: (req.user as any)._id,
        ...(data.slug && { slug: data.slug.toLowerCase() }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw createError('Niche not found', 404);
    }

    // Clear cache
    clearNicheCache();

    // Log activity
    await logNicheActivity('UPDATE_NICHE', id, (req.user as any)._id.toString(), {
      changes: Object.keys(data),
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to update niche', 500));
  }
};

/**
 * Admin: Soft delete niche
 * DELETE /api/admin/niches/:id
 */
export const deleteNiche = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;
    const { reason } = req.body;

    const niche = await Niche.findById(id);
    if (!niche) {
      throw createError('Niche not found', 404);
    }

    // Prevent deleting default niche
    if (niche.isDefault) {
      throw createError('Cannot delete default niche', 400);
    }

    // Prevent deleting if has products
    if (niche.totalProductCount > 0) {
      throw createError(
        'Cannot delete niche with products. Move products to another niche first.',
        400
      );
    }

    // Prevent deleting last active niche
    const activeCount = await Niche.countDocuments({
      active: true,
      deleted: false,
      _id: { $ne: id },
    });

    if (activeCount === 0) {
      throw createError(
        'Cannot delete last active niche. At least one active niche must exist.',
        400
      );
    }

    // Soft delete
    niche.deleted = true;
    niche.deletedAt = new Date();
    niche.deletedBy = (req.user as any)._id;
    niche.deletedReason = reason;
    await niche.save();

    // Clear cache
    clearNicheCache();

    // Log activity
    await logNicheActivity('DELETE_NICHE', id, (req.user as any)._id.toString(), {
      name: niche.name,
      reason,
    });

    res.json({
      success: true,
      message: 'Niche deleted successfully',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to delete niche', 500));
  }
};

/**
 * Admin: Restore deleted niche
 * POST /api/admin/niches/:id/restore
 */
export const restoreNiche = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;

    const niche = await Niche.findById(id);
    if (!niche) {
      throw createError('Niche not found', 404);
    }

    if (!niche.deleted) {
      throw createError('Niche is not deleted', 400);
    }

    // Restore
    niche.deleted = false;
    niche.deletedAt = undefined;
    niche.deletedBy = undefined;
    niche.deletedReason = undefined;
    niche.updatedBy = (req.user as any)._id;
    await niche.save();

    // Clear cache
    clearNicheCache();

    // Log activity
    await logNicheActivity('RESTORE_NICHE', id, (req.user as any)._id.toString(), {
      name: niche.name,
    });

    res.json({
      success: true,
      data: niche,
      message: 'Niche restored successfully',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to restore niche', 500));
  }
};

