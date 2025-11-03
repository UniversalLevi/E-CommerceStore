import { Response, NextFunction } from 'express';
import axios from 'axios';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';

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

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      throw createError('Valid Product ID is required', 400);
    }

    // Get Shopify credentials - prefer user's OAuth credentials, fallback to .env custom app
    const shopifyAccessToken = req.user.shopifyAccessToken || config.shopify.accessToken;
    const shopifyShop = req.user.shopifyShop || config.shopify.shop;

    if (!shopifyAccessToken || !shopifyShop) {
      throw createError('Please connect your Shopify account first or configure SHOPIFY_ACCESS_TOKEN in .env', 400);
    }

    console.log('🛍️ Creating store with product:', productId);
    console.log('📦 Using shop:', shopifyShop);

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Prepare product data for Shopify (without images initially for trial accounts)
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
        // Don't include images initially (trial account issue)
        // images: product.images.map((url) => ({ src: url })),
        status: 'active',
      },
    };

    console.log('📤 Sending product to Shopify...');

    // Add product to Shopify store using Admin API
    const shopifyResponse = await axios.post(
      `https://${shopifyShop}/admin/api/2025-10/products.json`,
      shopifyProduct,
      {
        headers: {
          'X-Shopify-Access-Token': shopifyAccessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const createdProduct = shopifyResponse.data.product;
    console.log('✅ Product created in Shopify:', createdProduct.id);

    // Try to add images if any (separate request to handle trial account limitations)
    if (product.images && product.images.length > 0) {
      try {
        console.log('🖼️ Attempting to add images...');
        await axios.put(
          `https://${shopifyShop}/admin/api/2025-10/products/${createdProduct.id}.json`,
          {
            product: {
              id: createdProduct.id,
              images: product.images.map((url) => ({ src: url })),
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': shopifyAccessToken,
              'Content-Type': 'application/json',
            },
          }
        );
        console.log('✅ Images added successfully');
      } catch (imageError: any) {
        console.log('⚠️ Could not add images (trial account limitation):', imageError.response?.data?.errors);
        // Don't fail the entire operation if images can't be added
      }
    }

    // Store URL (customer-facing)
    const cleanShop = shopifyShop.replace('.myshopify.com', '');
    const storeUrl = `https://${cleanShop}.myshopify.com`;

    // Admin URL for the created product
    const adminUrl = `https://${shopifyShop}/admin/products/${createdProduct.id}`;

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
    console.error('❌ Store creation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    // Handle Shopify API errors
    if (error.response?.status === 401) {
      return next(
        createError(
          'Shopify authentication failed. Please check your credentials or reconnect your account.',
          401
        )
      );
    } else if (error.response?.status === 429) {
      return next(createError('Rate limit exceeded. Please try again later.', 429));
    } else if (error.response?.status === 422) {
      const errorMsg = JSON.stringify(error.response.data.errors || error.response.data);
      return next(
        createError(
          `Shopify validation error: ${errorMsg}`,
          422
        )
      );
    } else if (error.response?.data?.errors) {
      return next(
        createError(
          `Shopify API error: ${JSON.stringify(error.response.data.errors)}`,
          error.response.status || 500
        )
      );
    } else {
      return next(error);
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

