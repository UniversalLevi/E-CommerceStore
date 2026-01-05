import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { WhatsAppProductDraft, IWhatsAppProductDraft, DraftStatus } from '../models/WhatsAppProductDraft';
import { Product } from '../models/Product';
import { Niche } from '../models/Niche';
import mongoose from 'mongoose';

/**
 * List all WhatsApp product drafts
 * GET /api/admin/whatsapp-drafts
 */
export const listDrafts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      status,
      needs_review,
      page = '1',
      limit = '20',
      sort = '-createdAt',
    } = req.query;

    const query: any = {};

    // Filter by status
    if (status && typeof status === 'string') {
      const validStatuses: DraftStatus[] = ['incoming', 'enriched', 'approved', 'rejected'];
      if (validStatuses.includes(status as DraftStatus)) {
        query.status = status;
      }
    }

    // Filter by needs_review
    if (needs_review === 'true') {
      query.needs_review = true;
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build sort object
    const sortField = (sort as string).startsWith('-') ? (sort as string).slice(1) : sort;
    const sortOrder = (sort as string).startsWith('-') ? -1 : 1;
    const sortObj: any = { [sortField as string]: sortOrder };

    const [drafts, total] = await Promise.all([
      WhatsAppProductDraft.find(query)
        .populate('detected_niche', 'name icon')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WhatsAppProductDraft.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: drafts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single draft by ID
 * GET /api/admin/whatsapp-drafts/:id
 */
export const getDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid draft ID', 400);
    }

    const draft = await WhatsAppProductDraft.findById(id)
      .populate('detected_niche', 'name icon description')
      .lean();

    if (!draft) {
      throw createError('Draft not found', 404);
    }

    // Also get all available niches for editing
    const niches = await Niche.find({ active: true, deleted: false })
      .select('name icon')
      .lean();

    res.json({
      success: true,
      data: draft,
      niches,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a draft
 * PUT /api/admin/whatsapp-drafts/:id
 */
export const updateDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid draft ID', 400);
    }

    const draft = await WhatsAppProductDraft.findById(id);
    if (!draft) {
      throw createError('Draft not found', 404);
    }

    // Prevent updating approved/rejected drafts
    if (draft.status === 'approved' || draft.status === 'rejected') {
      throw createError('Cannot update a draft that has been approved or rejected', 400);
    }

    // Allowed fields to update
    const allowedUpdates = [
      'ai_name',
      'ai_description',
      'cost_price',
      'profit_margin',
      'shipping_fee',
      'detected_niche',
      'needs_review',
    ];

    const updateData: any = {};
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        if (field === 'detected_niche') {
          if (mongoose.Types.ObjectId.isValid(updates[field])) {
            updateData[field] = new mongoose.Types.ObjectId(updates[field]);
          }
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    // Recalculate final price if pricing fields changed
    const costPrice = updateData.cost_price ?? draft.cost_price;
    const profitMargin = updateData.profit_margin ?? draft.profit_margin;
    const shippingFee = updateData.shipping_fee ?? draft.shipping_fee;
    updateData.final_price = costPrice + profitMargin + shippingFee;

    const updatedDraft = await WhatsAppProductDraft.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('detected_niche', 'name icon');

    res.json({
      success: true,
      data: updatedDraft,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a draft and create a Product
 * POST /api/admin/whatsapp-drafts/:id/approve
 */
export const approveDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid draft ID', 400);
    }

    const draft = await WhatsAppProductDraft.findById(id);
    if (!draft) {
      throw createError('Draft not found', 404);
    }

    if (draft.status === 'approved') {
      throw createError('Draft has already been approved', 400);
    }

    if (draft.status === 'rejected') {
      throw createError('Cannot approve a rejected draft', 400);
    }

    // Validate required fields
    if (!draft.ai_name && !draft.original_name) {
      throw createError('Product name is required', 400);
    }

    if (!draft.detected_niche) {
      throw createError('Product niche is required. Please assign a niche before approving.', 400);
    }

    // Verify niche exists
    const niche = await Niche.findById(draft.detected_niche);
    if (!niche || niche.deleted) {
      throw createError('Selected niche not found or has been deleted', 400);
    }

    // Collect all images (original + AI generated)
    const images: string[] = [];
    if (draft.original_image_url) {
      images.push(draft.original_image_url);
    }
    if (draft.generated_image_urls && draft.generated_image_urls.length > 0) {
      images.push(...draft.generated_image_urls);
    }

    if (images.length === 0) {
      throw createError('At least one product image is required', 400);
    }

    // Create the Product
    const product = new Product({
      title: draft.ai_name || draft.original_name,
      description: draft.ai_description || `High-quality ${draft.original_name}. Order now!`,
      images,
      basePrice: draft.cost_price,
      profit: draft.profit_margin,
      shippingPrice: draft.shipping_fee,
      price: draft.final_price,
      niche: draft.detected_niche,
      active: true,
      costPrice: draft.cost_price,
      tags: [],
    });

    await product.save();

    // Mark draft as approved
    draft.status = 'approved';
    await draft.save();

    res.json({
      success: true,
      message: 'Draft approved and product created successfully',
      data: {
        draft: draft.toObject(),
        product: product.toObject(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject/delete a draft
 * DELETE /api/admin/whatsapp-drafts/:id
 */
export const deleteDraft = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { soft = 'true' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid draft ID', 400);
    }

    const draft = await WhatsAppProductDraft.findById(id);
    if (!draft) {
      throw createError('Draft not found', 404);
    }

    if (draft.status === 'approved') {
      throw createError('Cannot delete an approved draft. The product has already been created.', 400);
    }

    if (soft === 'true') {
      // Soft delete - mark as rejected
      draft.status = 'rejected';
      await draft.save();

      res.json({
        success: true,
        message: 'Draft rejected successfully',
      });
    } else {
      // Hard delete
      await WhatsAppProductDraft.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Draft deleted permanently',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get draft statistics
 * GET /api/admin/whatsapp-drafts/stats
 */
export const getDraftStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [statusCounts, needsReviewCount, recentDrafts] = await Promise.all([
      WhatsAppProductDraft.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      WhatsAppProductDraft.countDocuments({ needs_review: true, status: { $nin: ['approved', 'rejected'] } }),
      WhatsAppProductDraft.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('original_name ai_name status createdAt')
        .lean(),
    ]);

    const stats = {
      incoming: 0,
      enriched: 0,
      approved: 0,
      rejected: 0,
    };

    for (const item of statusCounts) {
      if (item._id in stats) {
        stats[item._id as keyof typeof stats] = item.count;
      }
    }

    res.json({
      success: true,
      data: {
        ...stats,
        total: stats.incoming + stats.enriched + stats.approved + stats.rejected,
        pending_review: needsReviewCount,
        recent: recentDrafts,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk approve drafts
 * POST /api/admin/whatsapp-drafts/bulk-approve
 */
export const bulkApproveDrafts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw createError('Draft IDs array is required', 400);
    }

    const results: { id: string; success: boolean; error?: string; productId?: string }[] = [];

    for (const id of ids) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          results.push({ id, success: false, error: 'Invalid ID' });
          continue;
        }

        const draft = await WhatsAppProductDraft.findById(id);
        if (!draft) {
          results.push({ id, success: false, error: 'Not found' });
          continue;
        }

        if (draft.status !== 'enriched') {
          results.push({ id, success: false, error: `Invalid status: ${draft.status}` });
          continue;
        }

        if (!draft.detected_niche) {
          results.push({ id, success: false, error: 'Niche not assigned' });
          continue;
        }

        // Create product
        const images = [draft.original_image_url, ...draft.generated_image_urls].filter(Boolean);
        
        const product = new Product({
          title: draft.ai_name || draft.original_name,
          description: draft.ai_description || `High-quality ${draft.original_name}. Order now!`,
          images,
          basePrice: draft.cost_price,
          profit: draft.profit_margin,
          shippingPrice: draft.shipping_fee,
          price: draft.final_price,
          niche: draft.detected_niche,
          active: true,
          costPrice: draft.cost_price,
        });

        await product.save();
        draft.status = 'approved';
        await draft.save();

        results.push({ id, success: true, productId: (product._id as any).toString() });
      } catch (error: any) {
        results.push({ id, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Approved ${successCount} drafts, ${failCount} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

