import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { Niche } from '../models/Niche';
import { asyncHandler } from '../utils/asyncHandler';

interface ProductAnalyticsSummary {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalBasePrice: number; // Sum of all base prices (cost)
  totalSellingPrice: number; // Sum of all selling prices
  totalProfit: number; // Sum of all profits
  totalShippingRevenue: number; // Sum of all shipping prices
  averageProfitMargin: number; // Average profit percentage
  averageProductPrice: number;
  totalViews: number;
  totalImports: number;
  totalConversions: number;
  conversionRate: number;
}

interface NicheRevenue {
  nicheId: string;
  nicheName: string;
  nicheIcon: string;
  productCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalBasePrice: number;
  averageProfitMargin: number;
}

interface TopProduct {
  _id: string;
  title: string;
  price: number;
  basePrice: number;
  profit: number;
  shippingPrice: number;
  profitMargin: number;
  views: number;
  imports: number;
  conversions: number;
  conversionRate: number;
  niche: {
    _id: string;
    name: string;
    icon: string;
  } | null;
  images: string[];
  active: boolean;
  createdAt: Date;
}

interface ProfitDistribution {
  range: string;
  count: number;
  minMargin: number;
  maxMargin: number;
}

// Get product analytics summary
export const getProductAnalyticsSummary = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get all products with populated niche
    const products = await Product.find({}).populate('niche', 'name icon').lean();

    const activeProducts = products.filter((p) => p.active);
    const inactiveProducts = products.filter((p) => !p.active);

    // Calculate totals
    let totalBasePrice = 0;
    let totalSellingPrice = 0;
    let totalProfit = 0;
    let totalShippingRevenue = 0;
    let totalViews = 0;
    let totalImports = 0;
    let totalConversions = 0;

    products.forEach((product) => {
      totalBasePrice += product.basePrice || 0;
      totalSellingPrice += product.price || 0;
      totalProfit += product.profit || 0;
      totalShippingRevenue += product.shippingPrice || 0;
      totalViews += product.analytics?.views || 0;
      totalImports += product.analytics?.imports || 0;
      totalConversions += product.analytics?.conversions || 0;
    });

    // Calculate averages
    const averageProfitMargin =
      totalBasePrice > 0 ? (totalProfit / totalBasePrice) * 100 : 0;
    const averageProductPrice =
      products.length > 0 ? totalSellingPrice / products.length : 0;
    const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

    const summary: ProductAnalyticsSummary = {
      totalProducts: products.length,
      activeProducts: activeProducts.length,
      inactiveProducts: inactiveProducts.length,
      totalBasePrice,
      totalSellingPrice,
      totalProfit,
      totalShippingRevenue,
      averageProfitMargin,
      averageProductPrice,
      totalViews,
      totalImports,
      totalConversions,
      conversionRate,
    };

    res.json({
      success: true,
      data: summary,
    });
  }
);

// Get revenue breakdown by niche
export const getRevenueByNiche = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const nicheData = await Product.aggregate([
      {
        $lookup: {
          from: 'niches',
          localField: 'niche',
          foreignField: '_id',
          as: 'nicheInfo',
        },
      },
      {
        $unwind: {
          path: '$nicheInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$niche',
          nicheName: { $first: '$nicheInfo.name' },
          nicheIcon: { $first: '$nicheInfo.icon' },
          productCount: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          totalProfit: { $sum: '$profit' },
          totalBasePrice: { $sum: '$basePrice' },
        },
      },
      {
        $project: {
          nicheId: '$_id',
          nicheName: { $ifNull: ['$nicheName', 'Uncategorized'] },
          nicheIcon: { $ifNull: ['$nicheIcon', '📦'] },
          productCount: 1,
          totalRevenue: 1,
          totalProfit: 1,
          totalBasePrice: 1,
          averageProfitMargin: {
            $cond: [
              { $gt: ['$totalBasePrice', 0] },
              { $multiply: [{ $divide: ['$totalProfit', '$totalBasePrice'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    res.json({
      success: true,
      data: nicheData,
    });
  }
);

// Get top performing products
export const getTopProducts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sortBy = 'profit', limit = 10, order = 'desc' } = req.query;

    let sortField: string;
    switch (sortBy) {
      case 'views':
        sortField = 'analytics.views';
        break;
      case 'imports':
        sortField = 'analytics.imports';
        break;
      case 'conversions':
        sortField = 'analytics.conversions';
        break;
      case 'price':
        sortField = 'price';
        break;
      case 'profitMargin':
        sortField = 'profitMargin';
        break;
      default:
        sortField = 'profit';
    }

    const sortOrder = order === 'asc' ? 1 : -1;

    const products = await Product.aggregate([
      {
        $addFields: {
          profitMargin: {
            $cond: [
              { $gt: ['$basePrice', 0] },
              { $multiply: [{ $divide: ['$profit', '$basePrice'] }, 100] },
              0,
            ],
          },
          conversionRate: {
            $cond: [
              { $gt: ['$analytics.views', 0] },
              {
                $multiply: [
                  { $divide: ['$analytics.conversions', '$analytics.views'] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: 'niches',
          localField: 'niche',
          foreignField: '_id',
          as: 'nicheInfo',
        },
      },
      {
        $unwind: {
          path: '$nicheInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          price: 1,
          basePrice: 1,
          profit: 1,
          shippingPrice: 1,
          profitMargin: 1,
          views: { $ifNull: ['$analytics.views', 0] },
          imports: { $ifNull: ['$analytics.imports', 0] },
          conversions: { $ifNull: ['$analytics.conversions', 0] },
          conversionRate: 1,
          niche: {
            _id: '$nicheInfo._id',
            name: '$nicheInfo.name',
            icon: '$nicheInfo.icon',
          },
          images: 1,
          active: 1,
          createdAt: 1,
        },
      },
      {
        $sort: { [sortField]: sortOrder },
      },
      {
        $limit: Number(limit),
      },
    ]);

    res.json({
      success: true,
      data: products,
    });
  }
);

// Get profit margin distribution
export const getProfitDistribution = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const products = await Product.find({}).lean();

    // Define profit margin ranges
    const ranges = [
      { range: '0-10%', min: 0, max: 10 },
      { range: '10-25%', min: 10, max: 25 },
      { range: '25-50%', min: 25, max: 50 },
      { range: '50-75%', min: 50, max: 75 },
      { range: '75-100%', min: 75, max: 100 },
      { range: '100%+', min: 100, max: Infinity },
    ];

    const distribution: ProfitDistribution[] = ranges.map((r) => ({
      range: r.range,
      count: 0,
      minMargin: r.min,
      maxMargin: r.max === Infinity ? 200 : r.max,
    }));

    products.forEach((product) => {
      const margin =
        product.basePrice > 0 ? (product.profit / product.basePrice) * 100 : 0;

      for (let i = 0; i < ranges.length; i++) {
        if (margin >= ranges[i].min && margin < ranges[i].max) {
          distribution[i].count++;
          break;
        }
      }
    });

    res.json({
      success: true,
      data: distribution,
    });
  }
);

// Get all products with analytics for table view
export const getProductsWithAnalytics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      niche,
      active,
      search,
    } = req.query;

    const filter: any = {};

    if (niche) {
      filter.niche = niche;
    }

    if (active !== undefined && active !== '') {
      filter.active = active === 'true';
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;

    let sortField: string;
    switch (sortBy) {
      case 'title':
        sortField = 'title';
        break;
      case 'price':
        sortField = 'price';
        break;
      case 'profit':
        sortField = 'profit';
        break;
      case 'basePrice':
        sortField = 'basePrice';
        break;
      case 'views':
        sortField = 'analytics.views';
        break;
      case 'imports':
        sortField = 'analytics.imports';
        break;
      case 'conversions':
        sortField = 'analytics.conversions';
        break;
      default:
        sortField = 'createdAt';
    }

    const [products, total] = await Promise.all([
      Product.aggregate([
        { $match: filter },
        {
          $addFields: {
            profitMargin: {
              $cond: [
                { $gt: ['$basePrice', 0] },
                { $multiply: [{ $divide: ['$profit', '$basePrice'] }, 100] },
                0,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'niches',
            localField: 'niche',
            foreignField: '_id',
            as: 'nicheInfo',
          },
        },
        {
          $unwind: {
            path: '$nicheInfo',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            title: 1,
            price: 1,
            basePrice: 1,
            profit: 1,
            shippingPrice: 1,
            profitMargin: 1,
            views: { $ifNull: ['$analytics.views', 0] },
            imports: { $ifNull: ['$analytics.imports', 0] },
            conversions: { $ifNull: ['$analytics.conversions', 0] },
            niche: {
              _id: '$nicheInfo._id',
              name: '$nicheInfo.name',
              icon: '$nicheInfo.icon',
            },
            images: { $slice: ['$images', 1] },
            active: 1,
            createdAt: 1,
          },
        },
        { $sort: { [sortField]: sortOrder } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }
);

// Get products created over time (for chart)
export const getProductsOverTime = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const productsOverTime = await Product.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          totalProfit: { $sum: '$profit' },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          totalRevenue: 1,
          totalProfit: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: productsOverTime,
    });
  }
);

