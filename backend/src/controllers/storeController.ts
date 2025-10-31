import { Response, NextFunction } from 'express';
import axios from 'axios';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

// Create a new Shopify store with selected product
export const createStore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { productId } = req.body;

    if (!productId) {
      throw createError('Product ID is required', 400);
    }

    // Check if user has connected Shopify
    if (!req.user.shopifyAccessToken || !req.user.shopifyShop) {
      throw createError('Please connect your Shopify account first', 400);
    }

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Prepare product data for Shopify
    const shopifyProduct = {
      product: {
        title: product.title,
        body_html: product.description,
        vendor: 'Auto Store Builder',
        product_type: product.category,
        variants: [
          {
            price: product.price.toString(),
            inventory_management: null,
            inventory_policy: 'continue',
          },
        ],
        images: product.images.map((url) => ({ src: url })),
        status: 'active',
      },
    };

    // Add product to Shopify store using Admin API
    const shopifyResponse = await axios.post(
      `https://${req.user.shopifyShop}/admin/api/2024-01/products.json`,
      shopifyProduct,
      {
        headers: {
          'X-Shopify-Access-Token': req.user.shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const createdProduct = shopifyResponse.data.product;

    // Store URL (customer-facing)
    const storeUrl = `https://${req.user.shopifyShop.replace(
      '.myshopify.com',
      ''
    )}.myshopify.com`;

    // Admin URL for the created product
    const adminUrl = `https://${req.user.shopifyShop}/admin/products/${createdProduct.id}`;

    // Save store info to user record
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        stores: {
          storeUrl: storeUrl,
          productId: product._id,
          productName: product.title,
          createdAt: new Date(),
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Store created successfully with product',
      data: {
        storeUrl,
        adminUrl,
        productUrl: `${storeUrl}/products/${createdProduct.handle}`,
        productId: createdProduct.id,
        product: {
          title: product.title,
          price: product.price,
          images: product.images,
        },
      },
    });
  } catch (error: any) {
    console.error('Store creation error:', error.response?.data || error.message);
    
    // Handle Shopify API errors
    if (error.response?.status === 401) {
      next(
        createError(
          'Shopify authentication failed. Please reconnect your account.',
          401
        )
      );
    } else if (error.response?.status === 429) {
      next(createError('Rate limit exceeded. Please try again later.', 429));
    } else if (error.response?.data) {
      next(
        createError(
          `Shopify API error: ${JSON.stringify(error.response.data.errors)}`,
          error.response.status
        )
      );
    } else {
      next(error);
    }
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

    const user = await User.findById(req.user._id).populate(
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

