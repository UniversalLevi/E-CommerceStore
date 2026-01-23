import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StoreProduct } from '../models/StoreProduct';
import { Store } from '../models/Store';
import { createError } from '../middleware/errorHandler';
import { createProductSchema, updateProductSchema } from '../validators/storeDashboardValidator';

const MAX_PRODUCTS_PER_STORE = parseInt(process.env.MAX_PRODUCTS_PER_STORE || '50', 10);

/**
 * Create product
 * POST /api/store-dashboard/stores/:id/products
 */
export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const storeId = store._id;

    // Check product limit
    const productCount = await StoreProduct.countDocuments({ storeId });
    if (productCount >= MAX_PRODUCTS_PER_STORE) {
      throw createError(
        `Maximum ${MAX_PRODUCTS_PER_STORE} products allowed per store`,
        400
      );
    }

    // Validate images count
    if (value.images && value.images.length > 5) {
      throw createError('Maximum 5 images allowed per product', 400);
    }

    // Validate variant dimension (only one allowed)
    if (value.variantDimension && value.variants && value.variants.length > 0) {
      // Variants are valid
    }

    const product = new StoreProduct({
      storeId,
      title: value.title,
      description: value.description || '',
      basePrice: value.basePrice,
      status: value.status || 'draft',
      images: value.images || [],
      variantDimension: value.variantDimension || undefined,
      variants: value.variants || [],
      inventoryTracking: value.inventoryTracking || false,
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * List products
 * GET /api/store-dashboard/stores/:id/products
 */
export const listProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query: any = { storeId };
    if (status) {
      query.status = status;
    }

    const products = await StoreProduct.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string, 10))
      .lean();

    const total = await StoreProduct.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total,
          pages: Math.ceil(total / parseInt(limit as string, 10)),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get product details
 * GET /api/store-dashboard/stores/:id/products/:productId
 */
export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const productId = req.params.productId;

    const product = await StoreProduct.findOne({ _id: productId, storeId });
    if (!product) {
      throw createError('Product not found', 404);
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update product
 * PUT /api/store-dashboard/stores/:id/products/:productId
 */
export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const storeId = store._id;
    const productId = req.params.productId;

    const product = await StoreProduct.findOne({ _id: productId, storeId });
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Validate images count
    if (value.images && value.images.length > 5) {
      throw createError('Maximum 5 images allowed per product', 400);
    }

    // Update fields
    if (value.title !== undefined) product.title = value.title;
    if (value.description !== undefined) product.description = value.description;
    if (value.basePrice !== undefined) product.basePrice = value.basePrice;
    if (value.status !== undefined) product.status = value.status;
    if (value.images !== undefined) product.images = value.images;
    if (value.variantDimension !== undefined) product.variantDimension = value.variantDimension;
    if (value.variants !== undefined) product.variants = value.variants;
    if (value.inventoryTracking !== undefined) product.inventoryTracking = value.inventoryTracking;

    await product.save();

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete product
 * DELETE /api/store-dashboard/stores/:id/products/:productId
 */
export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const productId = req.params.productId;

    const product = await StoreProduct.findOne({ _id: productId, storeId });
    if (!product) {
      throw createError('Product not found', 404);
    }

    await StoreProduct.deleteOne({ _id: productId });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};
