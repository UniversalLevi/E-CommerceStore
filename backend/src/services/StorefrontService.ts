import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { StoreOrder } from '../models/StoreOrder';

class StorefrontService {
  /**
   * Validate store slug and check if store is active
   */
  async validateStore(slug: string): Promise<{ valid: boolean; store?: any; error?: string }> {
    try {
      const store = await Store.findOne({ slug: slug.toLowerCase() });

      if (!store) {
        return { valid: false, error: 'Store not found' };
      }

      if (store.status !== 'active') {
        return { valid: false, error: 'Store is not active', store };
      }

      // Payment connection is optional - store can be active without it
      // Only check payment status when creating orders

      return { valid: true, store };
    } catch (error: any) {
      console.error('Error validating store:', error);
      return { valid: false, error: 'Error validating store' };
    }
  }

  /**
   * Get store public info (for storefront)
   * Payment connection is optional - store can be accessed without it
   */
  async getStorePublicInfo(slug: string) {
    try {
      const store = await Store.findOne({ slug: slug.toLowerCase() });

      if (!store) {
        throw new Error('Store not found');
      }

      if (store.status !== 'active') {
        throw new Error('Store is not active');
      }

      // Ensure theme is always present (default to modern; must match storefront layout fallback)
      const settings = store.settings || {};
      if (!settings.theme || !settings.theme.name) {
        settings.theme = {
          name: 'modern',
          customizations: {},
        };
      }

      return {
        name: store.name,
        slug: store.slug,
        currency: store.currency,
        settings,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Store not found');
    }
  }

  /**
   * Get active products for storefront
   */
  async getActiveProducts(
    storeId: string,
    page: number = 1,
    limit: number = 20,
    options?: {
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      variantDimension?: string;
      tags?: string[] | string;
      sort?: 'price_asc' | 'price_desc' | 'newest' | 'oldest';
    }
  ) {
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      storeId,
      status: 'active',
    };

    // Search filter
    if (options?.search && options.search.trim()) {
      const searchRegex = { $regex: options.search.trim(), $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // Price filters
    if (options?.minPrice !== undefined || options?.maxPrice !== undefined) {
      query.basePrice = {};
      if (options.minPrice !== undefined) {
        query.basePrice.$gte = options.minPrice;
      }
      if (options.maxPrice !== undefined) {
        query.basePrice.$lte = options.maxPrice;
      }
    }

    // Variant dimension filter
    if (options?.variantDimension) {
      query.variantDimension = options.variantDimension;
    }

    // Tags filter (metadata.tags: match any of the provided tags)
    if (options?.tags && (Array.isArray(options.tags) ? options.tags.length > 0 : String(options.tags).trim())) {
      const tagList = Array.isArray(options.tags)
        ? options.tags.map((t) => String(t).trim()).filter(Boolean)
        : (options.tags as string).split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        query['metadata.tags'] = { $in: tagList };
      }
    }

    // Sort options
    let sortOption: any = { createdAt: -1 }; // Default: newest first
    if (options?.sort) {
      switch (options.sort) {
        case 'price_asc':
          sortOption = { basePrice: 1 };
          break;
        case 'price_desc':
          sortOption = { basePrice: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
      }
    }

    const products = await StoreProduct.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await StoreProduct.countDocuments(query);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get available filter options (tags, variant dimensions) for store products
   */
  async getProductFilterOptions(storeId: string): Promise<{ tags: string[]; variantDimensions: string[] }> {
    const products = await StoreProduct.find({ storeId, status: 'active' })
      .select('metadata.tags variantDimension')
      .lean();

    const tagSet = new Set<string>();
    const variantSet = new Set<string>();
    for (const p of products) {
      const tags = (p as any).metadata?.tags;
      if (Array.isArray(tags)) {
        tags.forEach((t: string) => {
          const v = String(t).trim();
          if (v) tagSet.add(v);
        });
      }
      const vd = (p as any).variantDimension;
      if (vd && String(vd).trim()) variantSet.add(String(vd).trim());
    }
    return {
      tags: Array.from(tagSet).sort(),
      variantDimensions: Array.from(variantSet).sort(),
    };
  }

  /**
   * Get product details for storefront
   */
  async getProductDetails(storeId: string, productId: string) {
    const product = await StoreProduct.findOne({
      _id: productId,
      storeId,
      status: 'active',
    }).lean();

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Check order rate limit for store
   */
  async checkOrderRateLimit(storeId: string): Promise<{ allowed: boolean; remaining?: number }> {
    const maxOrdersPerDay = parseInt(process.env.MAX_ORDERS_PER_DAY_PER_STORE || '100', 10);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ordersToday = await StoreOrder.countDocuments({
      storeId,
      createdAt: { $gte: startOfDay },
    });

    if (ordersToday >= maxOrdersPerDay) {
      return { allowed: false };
    }

    return {
      allowed: true,
      remaining: maxOrdersPerDay - ordersToday,
    };
  }
}

export const storefrontService = new StorefrontService();
