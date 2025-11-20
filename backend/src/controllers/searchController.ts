import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Niche } from '../models/Niche';
import { createError } from '../middleware/errorHandler';

/**
 * Global search across products and niches
 * GET /api/search
 */
export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q, type, page = '1', limit = '20' } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      throw createError('Search query is required', 400);
    }

    const query = q.trim();
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const results: {
      products: any[];
      niches: any[];
      total: number;
    } = {
      products: [],
      niches: [],
      total: 0,
    };

    // Search products
    if (!type || type === 'products' || type === 'all') {
      const productQuery = {
        $and: [
          { active: true },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
            ],
          },
        ],
      };

      const [products, productCount] = await Promise.all([
        Product.find(productQuery)
          .populate('niche', 'name slug icon')
          .sort({ createdAt: -1 })
          .skip(type === 'products' ? skip : 0)
          .limit(type === 'products' ? limitNum : 5)
          .lean(),
        Product.countDocuments(productQuery),
      ]);

      results.products = products;
      if (type === 'products' || type === 'all') {
        results.total += productCount;
      }
    }

    // Search niches
    if (!type || type === 'niches' || type === 'all') {
      const nicheQuery = {
        $and: [
          { active: true, deleted: false },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { synonyms: { $in: [new RegExp(query, 'i')] } },
            ],
          },
        ],
      };

      const [niches, nicheCount] = await Promise.all([
        Niche.find(nicheQuery)
          .sort({ priority: -1, order: 1 })
          .skip(type === 'niches' ? skip : 0)
          .limit(type === 'niches' ? limitNum : 5)
          .lean(),
        Niche.countDocuments(nicheQuery),
      ]);

      results.niches = niches;
      if (type === 'niches' || type === 'all') {
        results.total += nicheCount;
      }
    }

    const pages = Math.ceil(results.total / limitNum);

    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: results.total,
        pages,
      },
      query,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to perform search', 500));
  }
};

