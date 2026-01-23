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

      return {
        name: store.name,
        slug: store.slug,
        currency: store.currency,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Store not found');
    }
  }

  /**
   * Get active products for storefront
   */
  async getActiveProducts(storeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const products = await StoreProduct.find({
      storeId,
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await StoreProduct.countDocuments({
      storeId,
      status: 'active',
    });

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
