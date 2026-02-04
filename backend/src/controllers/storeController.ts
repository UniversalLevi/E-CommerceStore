import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Store } from '../models/Store';
import { StoreProduct } from '../models/StoreProduct';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { requirePaidPlan, checkProductLimit } from '../middleware/subscription';
import { createNotification } from '../utils/notifications';

// Add product to internal store
export const createStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { productId, storeId, customDescription } = req.body;

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      throw createError('Valid Product ID is required', 400);
    }

    console.log('🛍️ Adding product to store:', productId);

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Get store (either specified or user's store)
    let store;

    if (storeId) {
      // Use specified store
      store = await Store.findById(storeId);
      
      if (!store) {
        throw createError('Store not found', 404);
      }

      // Verify ownership or admin
      const isOwner = store.owner.toString() === (req.user as any)._id.toString();
      const isAdmin = req.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        throw createError('You do not have access to this store', 403);
      }
    } else {
      // Use user's store (one store per user)
      store = await Store.findOne({
        owner: (req.user as any)._id,
      });

      if (!store) {
        throw createError(
          'No store found. Please create a store first.',
          400
        );
      }
    }

    // Check store status
    if (store.status !== 'active') {
      throw createError(
        `Store is ${store.status}. Please activate your store first.`,
        400
      );
    }

    console.log('📦 Using store:', store.name);
    console.log('🔗 Store slug:', store.slug);

    // Use custom description if provided, otherwise use product description
    const productDescription = customDescription || product.description;
    
    // Convert product price from rupees to paise
    const basePriceInPaise = Math.round(product.price * 100);

    // Create store product
    const storeProduct = await StoreProduct.create({
      storeId: store._id,
      title: product.title,
      description: productDescription,
      basePrice: basePriceInPaise,
      status: 'active',
      images: product.images.slice(0, 5), // Max 5 images
      importedFrom: product._id,
      importedAt: new Date(),
      metadata: {
        nicheId: product.niche,
        tags: product.tags || [],
        supplierLink: product.supplierLink,
      },
    });

    console.log('✅ Product created in store:', storeProduct._id);

    // Increment productsAdded counter
    await User.findByIdAndUpdate((req.user as any)._id, {
      $inc: { productsAdded: 1 },
    });

    // Create notification
    await createNotification({
      userId: (req.user as any)._id,
      type: 'product_added',
      title: 'Product Added Successfully',
      message: `"${product.title}" has been successfully added to your store "${store.name}".`,
      link: `/products/${(product as any)._id}`,
      metadata: {
        productId: (product as any)._id.toString(),
        productTitle: product.title,
        storeId: (store as any)._id.toString(),
        storeName: store.name,
        storeProductId: (storeProduct as any)._id.toString(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product added to store successfully',
      data: {
        storeId: store._id,
        storeName: store.name,
        storeSlug: store.slug,
        productId: (storeProduct as any)._id,
        product: {
          title: product.title,
          price: product.price,
          images: product.images,
        },
        usedStore: {
          id: store._id,
          name: store.name,
          slug: store.slug,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Product addition error:', {
      message: error.message,
    });
    return next(error);
  }
};

// Get user's created stores
export const getUserStores = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const user = await User.findById((req.user as any)._id).populate(
      'stores.productId'
    );

    res.status(200).json({
      success: true,
      count: user?.stores.length || 0,
      data: user?.stores || [],
    });
  } catch (error) {
    next(error);
  }
};
