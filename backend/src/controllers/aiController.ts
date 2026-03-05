import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Niche } from '../models/Niche';
import { ProductScoringService, UserPreferences } from '../services/ProductScoringService';
import { generateProductRationale, generateProductDescription } from '../services/OpenAIService';
import { WinningProductSchema, WriteDescriptionSchema } from '../validators/aiValidator';
import mongoose from 'mongoose';

function pickRandomTop<T>(items: T[], poolSize: number, count: number): T[] {
  if (!items.length || count <= 0) {
    return [];
  }
  const effectivePoolSize = Math.min(poolSize, items.length);
  const pool = items.slice(0, effectivePoolSize);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/**
 * Find Winning Product
 * POST /api/ai/find-winning-product
 */
export const findWinningProduct = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input with Zod
    const parsed = WinningProductSchema.parse(req.body);

    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Get user with onboarding data
    const user = await User.findById((req.user as any)._id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if onboarding niche exists - MANDATORY
    const nicheId = parsed.nicheId || user.onboarding?.nicheId;
    if (!nicheId) {
      throw createError(
        'Please complete onboarding and select a niche first. Niche selection is required for product recommendations.',
        400
      );
    }

    // Validate niche exists
    const niche = await Niche.findById(nicheId).where({ deleted: false, active: true });
    if (!niche) {
      throw createError('Selected niche not found or inactive', 404);
    }

    // Build user preferences
    const userPref: UserPreferences = {
      nicheId: new mongoose.Types.ObjectId(nicheId),
      goal: user.onboarding?.goal || 'dropship',
    };

    // Fetch products (by niche or all if no niche filter)
    const productFilter: any = {
      active: true,
      niche: nicheId,
    };

    // Apply budget filter if provided
    if (parsed.budgetRange?.min !== null && parsed.budgetRange?.min !== undefined) {
      productFilter.price = { ...productFilter.price, $gte: parsed.budgetRange.min };
    }
    if (parsed.budgetRange?.max !== null && parsed.budgetRange?.max !== undefined) {
      productFilter.price = { ...productFilter.price, $lte: parsed.budgetRange.max };
    }

    const products = await Product.find(productFilter).populate('niche').lean();

    if (products.length === 0) {
      // Fallback: try without niche filter
      const allProducts = await Product.find({ active: true }).populate('niche').limit(10).lean();
      if (allProducts.length === 0) {
        throw createError('No products available', 404);
      }

      // Return high-scoring products across all niches with some randomness
      const scored = allProducts.map((product) => {
        const result = ProductScoringService.scoreProduct(product as any, userPref, product.niche as any);
        return { product, ...result };
      });

      scored.sort((a, b) => b.score - a.score);
      const topCount = parsed.mode === 'top3' ? 3 : 1;
      const crossNichePoolSize = parsed.mode === 'top3' ? 10 : 5;
      const topProducts = pickRandomTop(scored, crossNichePoolSize, topCount);

      const recommendations = await Promise.all(
        topProducts.map(async ({ product, score, confidence, breakdown }) => {
          const rationale = await generateProductRationale(
            product as any,
            userPref,
            score,
            product.niche as any
          );

          return {
            productId: product._id.toString(),
            product: {
              _id: product._id,
              title: product.title,
              description: product.description,
              price: product.price,
              images: product.images,
              niche: product.niche,
            },
            score,
            confidence,
            rationale,
            breakdown,
            actionLinks: {
              import: `/api/products/${product._id}/import`,
              writeDescription: `/api/ai/write-product-description?productId=${product._id}`,
            },
            note: 'No products found in your selected niche. Showing top products across all niches.',
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: parsed.mode === 'top3' ? recommendations : recommendations[0],
        crossNiche: true,
      });
    }

    // Score all products
    const scored = products.map((product) => {
      const result = ProductScoringService.scoreProduct(product as any, userPref, niche);
      return { product, ...result };
    });

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Get high-scoring products with some randomness so the user doesn't always see the exact same items
    const topCount = parsed.mode === 'top3' ? 3 : 1;
    const poolSize = parsed.mode === 'top3' ? 15 : 7;
    const topProducts = pickRandomTop(scored, poolSize, topCount);

    // Generate rationales
    const recommendations = await Promise.all(
      topProducts.map(async ({ product, score, confidence, breakdown }) => {
        const rationale = await generateProductRationale(product as any, userPref, score, niche);

        return {
          productId: product._id.toString(),
          product: {
            _id: product._id,
            title: product.title,
            description: product.description,
            price: product.price,
            images: product.images,
            niche: product.niche,
            costPrice: product.costPrice,
            tags: product.tags,
            supplierLink: product.supplierLink,
          },
          score,
          confidence,
          rationale,
          breakdown,
          actionLinks: {
            import: `/api/products/${product._id}/import`,
            writeDescription: `/api/ai/write-product-description?productId=${product._id}`,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: parsed.mode === 'top3' ? recommendations : recommendations[0],
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return next(createError(`Invalid request data: ${errorMessages}`, 400));
    }
    next(error);
  }
};

/**
 * Write Product Description
 * POST /api/ai/write-product-description
 */
export const writeProductDescription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate input with Zod
    const parsed = WriteDescriptionSchema.parse(req.body);

    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    // Fetch product
    const product = await Product.findById(parsed.productId).populate('niche');
    if (!product) {
      throw createError('Product not found', 404);
    }

    // Check if product is active
    if (!product.active) {
      throw createError('Product is not active', 400);
    }

    // Generate description
    const description = await generateProductDescription(
      product,
      parsed.tone,
      parsed.length,
      product.niche as any
    );

    res.status(200).json({
      success: true,
      data: description,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return next(createError(`Invalid request data: ${errorMessages}`, 400));
    }
    next(error);
  }
};

