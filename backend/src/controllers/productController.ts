import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Niche } from '../models/Niche';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { updateNicheProductCounts } from './nicheController';

// Get all active products (public)
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      category,
      active = 'true',
      niche,
      page = '1',
      limit = '24',
      sort,
    } = req.query;

    const filter: any = {};
    if (category) filter.category = category;
    if (active !== undefined) filter.active = active === 'true';

    // Handle niche filtering (accepts slug or ObjectId)
    if (niche) {
      let nicheId = niche;
      // Check if it's a slug (not a valid ObjectId format)
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

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    let sortOption: any = { createdAt: -1 }; // Default: newest
    const sortMode = sort || 'newest';

    switch (sortMode) {
      case 'popularity':
        // TODO: Implement popularity sorting
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
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('niche', 'name slug icon')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
      meta: {
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

// Get single product (public)
export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('niche', 'name slug icon description');

    if (!product) {
      throw createError('Product not found', 404);
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch product', 500));
  }
};

// Create product (admin only)
export const createProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const productData = req.body;

    // Validate niche exists
    if (productData.niche) {
      const niche = await Niche.findById(productData.niche).where({ deleted: false });
      if (!niche) {
        throw createError('Niche not found or has been deleted', 400);
      }
    }

    const product = await Product.create(productData);

    // Update niche counts (post-save hook handles this, but we can also call explicitly)
    if (product.niche) {
      await updateNicheProductCounts(product.niche.toString());
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to create product', 500));
  }
};

// Update product (admin only)
export const updateProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get existing product to track niche changes
    const existing = await Product.findById(id);
    if (!existing) {
      throw createError('Product not found', 404);
    }

    // Validate niche if being changed
    if (updates.niche && updates.niche !== existing.niche?.toString()) {
      const niche = await Niche.findById(updates.niche).where({ deleted: false });
      if (!niche) {
        throw createError('Niche not found or has been deleted', 400);
      }
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw createError('Product not found', 404);
    }

    // Update niche counts if niche changed
    if (updates.niche) {
      await updateNicheProductCounts(product.niche.toString());
      // Also update old niche if it changed
      if (existing.niche && existing.niche.toString() !== product.niche.toString()) {
        await updateNicheProductCounts(existing.niche.toString());
      }
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to update product', 500));
  }
};

// Delete product (admin only)
export const deleteProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      throw createError('Product not found', 404);
    }

    const nicheId = product.niche?.toString();

    await Product.findByIdAndDelete(id);

    // Update niche counts (post-delete hook handles this, but we can also call explicitly)
    if (nicheId) {
      await updateNicheProductCounts(nicheId);
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to delete product', 500));
  }
};

// Get product categories (public)
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's added products (protected)
export const getUserProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { storeUrl } = req.query;

    // Get user with stores
    const user = await User.findById(userId).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    // Filter stores if storeUrl is provided
    let userStores = user.stores || [];
    if (storeUrl) {
      userStores = userStores.filter(
        (store: any) => store.storeUrl === storeUrl
      );
    }

    // Get unique product IDs
    const productIds = Array.from(
      new Set(
        userStores
          .map((store: any) => {
            // Handle both ObjectId and string formats
            const pid = store.productId;
            return pid?.toString ? pid.toString() : pid;
          })
          .filter(Boolean)
      )
    );

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Fetch products with niche populated
    const products = await Product.find({
      _id: { $in: productIds },
    })
      .populate('niche', 'name slug icon')
      .lean();

    // Map products with store information
    const productsWithStores = products.map((product) => {
      const productIdStr = product._id.toString();
      const stores = userStores
        .filter((store: any) => {
          const storeProductId = store.productId?.toString
            ? store.productId.toString()
            : store.productId;
          return storeProductId === productIdStr;
        })
        .map((store: any) => ({
          storeUrl: store.storeUrl,
          addedAt: store.createdAt || new Date(),
        }));

      return {
        ...product,
        stores,
        addedAt: stores.length > 0 ? stores[0].addedAt : new Date(),
      };
    });

    // Sort by most recently added
    productsWithStores.sort((a, b) => {
      const dateA = new Date(a.addedAt).getTime();
      const dateB = new Date(b.addedAt).getTime();
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      data: productsWithStores,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch user products', 500));
  }
};

