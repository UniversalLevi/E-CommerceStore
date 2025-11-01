import { Response, NextFunction } from 'express';
import axios from 'axios';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { ConnectedStore } from '../models/ConnectedStore';
import { RateLimitService } from '../services/RateLimitService';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config/env';

/**
 * Setup Shopify store with basic configuration
 * - Ensures a theme is published
 * - Creates/updates homepage
 * - Sets up basic navigation
 */
async function setupShopifyStore(
  shop: string,
  accessToken: string,
  product: any
): Promise<void> {
  try {
    const headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    };
    const apiBase = `https://${shop}/admin/api/2024-01`;

    // 1. Get current themes and ensure one is published
    try {
      const themesResponse = await axios.get(`${apiBase}/themes.json`, { headers });
      const themes = themesResponse.data.themes || [];
      const publishedTheme = themes.find((t: any) => t.role === 'main');
      
      if (!publishedTheme && themes.length > 0) {
        // Publish the first available theme
        const firstTheme = themes[0];
        await axios.put(
          `${apiBase}/themes/${firstTheme.id}.json`,
          { theme: { role: 'main' } },
          { headers }
        );
        console.log('✅ Theme published');
      } else if (!publishedTheme) {
        console.log('⚠️  No themes found - store will use default theme');
      }
    } catch (error: any) {
      console.log('⚠️  Could not configure theme:', error.message);
      // Continue anyway - theme might already be set up
    }

    // 2. Create a simple homepage (or update existing)
    try {
      // Check if homepage exists
      const pagesResponse = await axios.get(`${apiBase}/pages.json`, { headers });
      const pages = pagesResponse.data.pages || [];
      const homepage = pages.find((p: any) => p.title === 'Home' || p.handle === 'homepage');

      const homepageContent = `
        <div style="text-align: center; padding: 40px 20px;">
          <h1>Welcome to Your New Store!</h1>
          <p style="font-size: 18px; color: #666;">
            Check out our featured product:
          </p>
          <div style="margin-top: 30px;">
            <h2>${product.title}</h2>
            <p>Price: $${product.variants[0].price}</p>
            <a href="/products/${product.handle}" 
               style="display: inline-block; padding: 12px 30px; background: #5469d4; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
              View Product
            </a>
          </div>
        </div>
      `;

      if (homepage) {
        await axios.put(
          `${apiBase}/pages/${homepage.id}.json`,
          { page: { body_html: homepageContent } },
          { headers }
        );
      } else {
        await axios.post(
          `${apiBase}/pages.json`,
          {
            page: {
              title: 'Home',
              body_html: homepageContent,
              published: true,
            },
          },
          { headers }
        );
      }
      console.log('✅ Homepage created/updated');
    } catch (error: any) {
      console.log('⚠️  Could not create homepage:', error.message);
    }

    console.log('✅ Store setup completed');
  } catch (error: any) {
    // Don't fail the whole operation if setup fails
    console.error('⚠️  Store setup encountered issues:', error.message);
    console.log('ℹ️  Product was created successfully. Store setup can be completed manually.');
  }
}

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

    const { productId, storeId } = req.body;

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      throw createError('Product ID is required', 400);
    }

    // Determine credentials source (multi-tenant or legacy)
    let shopifyAccessToken: string;
    let shopifyShop: string;
    let connectedStoreId: string | undefined;
    let isMultiTenant = false;

    if (process.env.MULTI_TENANT_STORES_ENABLED === 'true' && storeId) {
      // Use multi-tenant store credentials from context
      if (!req.store) {
        throw createError('Store context not loaded. Please provide valid storeId.', 400);
      }

      shopifyAccessToken = req.store.accessToken;
      shopifyShop = req.store.domain;
      connectedStoreId = req.store.id;
      isMultiTenant = true;

      console.log(`Using multi-tenant store: ${shopifyShop}`);
    } else {
      // Fallback to legacy single-store mode
      shopifyAccessToken = req.user.shopifyAccessToken || config.shopify.accessToken;
      shopifyShop = req.user.shopifyShop || config.shopify.shop;

      if (!shopifyAccessToken || !shopifyShop) {
        throw createError('Please connect your Shopify account first. Go to Dashboard and connect your store.', 400);
      }

      console.log(`Using legacy store: ${shopifyShop}`);
    }

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Prepare product data for Shopify
    // Note: Images are omitted for trial accounts - they require a paid plan
    const shopifyProduct = {
      product: {
        title: product.title,
        body_html: product.description || product.title,
        vendor: 'Auto Store Builder',
        product_type: product.category || 'General',
        variants: [
          {
            price: product.price.toString(),
            inventory_management: null,
            inventory_policy: 'continue',
          },
        ],
        // Skip images for trial accounts - they require a paid Shopify plan
        // images: product.images.map((url) => ({ src: url })),
        status: 'active',
      },
    };

    let shopifyResponse;
    let createdProduct;
    
    try {
      // Try to create product in Shopify
      shopifyResponse = await axios.post(
        `https://${shopifyShop}/admin/api/2024-01/products.json`,
        shopifyProduct,
        {
          headers: {
            'X-Shopify-Access-Token': shopifyAccessToken,
            'Content-Type': 'application/json',
          },
        }
      );
      
      createdProduct = shopifyResponse.data.product;

      // Update rate limit from response headers (multi-tenant only)
      if (isMultiTenant && connectedStoreId && shopifyResponse.headers) {
        await RateLimitService.updateFromHeaders(connectedStoreId, shopifyResponse.headers);
      }
      
      // Setup store configuration (theme, homepage, etc.)
      await setupShopifyStore(shopifyShop, shopifyAccessToken, createdProduct);
      
      // If product has images and creation succeeded, try adding images separately
      // (This will fail on trial accounts, but product is already created)
      if (product.images && product.images.length > 0 && createdProduct.id) {
        try {
          await axios.put(
            `https://${shopifyShop}/admin/api/2024-01/products/${createdProduct.id}.json`,
            {
              product: {
                id: createdProduct.id,
                images: product.images.filter(url => url && url.trim()).map((url) => ({ src: url })),
              },
            },
            {
              headers: {
                'X-Shopify-Access-Token': shopifyAccessToken,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (imageError: any) {
          // Images failed (likely trial account), but product was created successfully
          console.log('Note: Could not add images to product (trial accounts require paid plan). Product created without images.');
        }
      }
    } catch (error: any) {
      // If the initial creation failed, provide helpful error message
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        if (errorMessages.some((msg: any) => 
          typeof msg === 'string' && (msg.includes('trial') || msg.includes('file') || msg.includes('plan'))
        )) {
          throw createError(
            'Your Shopify account is on a trial plan. Image uploads require a paid plan. Product creation attempted without images.',
            402
          );
        }
      }
      throw error;
    }

    // Store URL (customer-facing)
    const cleanShop = shopifyShop.replace('.myshopify.com', '');
    const storeUrl = `https://${cleanShop}.myshopify.com`;

    // Admin URL for the created product
    const adminUrl = `https://${shopifyShop}/admin/products/${createdProduct.id}`;

    // Save store info to user record (for backward compatibility)
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

    // Update connected store's last sync time if using multi-tenant
    if (isMultiTenant && connectedStoreId) {
      await ConnectedStore.findByIdAndUpdate(connectedStoreId, {
        lastSyncAt: new Date(),
        lastActivityAt: new Date(),
      });
    }

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

// Get all stores for the authenticated user
export const getUserStores = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const user = await User.findById(req.user._id).select('stores');

    res.status(200).json({
      success: true,
      count: user?.stores?.length || 0,
      data: user?.stores || [],
    });
  } catch (error) {
    next(error);
  }
};
