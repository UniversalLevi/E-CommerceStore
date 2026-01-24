import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { Niche } from '../models/Niche';
import { ProductImportService } from '../services/ProductImportService';
import { createError } from '../middleware/errorHandler';

/**
 * Browse catalog products with filters
 * GET /api/store-dashboard/stores/:id/products/catalog
 */
export const browseCatalogProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const storeId = req.params.id;
    const {
      niche,
      search,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {
      active: true, // Only show active products
    };

    // Filter by niche (accepts slug or ObjectId)
    if (niche) {
      let nicheId = niche;
      if (!niche.toString().match(/^[0-9a-fA-F]{24}$/)) {
        const nicheDoc = await Niche.findOne({
          slug: niche.toString().toLowerCase(),
          deleted: false,
        }).lean();
        if (nicheDoc) {
          nicheId = nicheDoc._id;
        } else {
          throw createError('Niche not found', 404);
        }
      }
      filter.niche = nicheId;
    }

    // Search by title/description
    if (search && typeof search === 'string' && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Sort options
    let sortOption: any = { createdAt: -1 }; // Default: newest
    switch (sort) {
      case 'popularity':
        // Sort by imports + views (analytics)
        sortOption = { 'analytics.imports': -1, 'analytics.views': -1, createdAt: -1 };
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
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('niche', 'name slug icon')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    // Check which products are already imported
    const productIds = products.map((p: any) => p._id.toString());
    const { StoreProduct } = await import('../models/StoreProduct');
    const importedProducts = await StoreProduct.find({
      storeId,
      importedFrom: { $in: productIds },
    }).lean();

    const importedMap = new Map(
      importedProducts.map((ip: any) => [ip.importedFrom.toString(), true])
    );

    // Add import status to products
    const productsWithStatus = products.map((product: any) => ({
      ...product,
      isImported: importedMap.has(product._id.toString()),
    }));

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: productsWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to browse catalog products', 500));
  }
};

/**
 * Get catalog product details
 * GET /api/store-dashboard/stores/:id/products/catalog/:productId
 */
export const getCatalogProductDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: storeId, productId } = req.params;

    const product = await Product.findById(productId)
      .populate('niche', 'name slug icon description')
      .lean();

    if (!product) {
      throw createError('Product not found', 404);
    }

    // Check if already imported
    const { StoreProduct } = await import('../models/StoreProduct');
    const isImported = await ProductImportService.isProductImported(productId, storeId);

    // Get import validation info
    const validation = await ProductImportService.validateImport(productId, storeId);

    res.status(200).json({
      success: true,
      data: {
        ...product,
        isImported,
        canImport: validation.valid,
        importWarnings: validation.warnings || [],
      },
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to get product details', 500));
  }
};

/**
 * Import product from catalog
 * POST /api/store-dashboard/stores/:id/products/import
 */
export const importProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: storeId } = req.params;
    const { catalogProductId, basePrice, status, variantDimension, variants } = req.body;

    if (!catalogProductId) {
      throw createError('Catalog product ID is required', 400);
    }

    const options: any = {};
    if (basePrice !== undefined) {
      options.basePrice = Math.round(basePrice * 100); // Convert to paise
    }
    if (status) {
      options.status = status;
    }
    if (variantDimension) {
      options.variantDimension = variantDimension;
    }
    if (variants && Array.isArray(variants)) {
      options.variants = variants.map((v: any) => ({
        name: v.name,
        price: v.price ? Math.round(v.price * 100) : undefined, // Convert to paise
        inventory: v.inventory !== undefined ? v.inventory : null,
      }));
    }

    const storeProduct = await ProductImportService.importProductToStore(
      catalogProductId,
      storeId,
      options
    );

    res.status(201).json({
      success: true,
      data: storeProduct,
      message: 'Product imported successfully',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to import product', 500));
  }
};
