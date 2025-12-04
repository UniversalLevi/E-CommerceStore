import { Router } from 'express';
import {
  getProductAnalyticsSummary,
  getRevenueByNiche,
  getTopProducts,
  getProfitDistribution,
  getProductsWithAnalytics,
  getProductsOverTime,
} from '../controllers/productAnalyticsController';

const router = Router();

// Get product analytics summary
router.get('/summary', getProductAnalyticsSummary);

// Get revenue breakdown by niche
router.get('/by-niche', getRevenueByNiche);

// Get top performing products
router.get('/top-products', getTopProducts);

// Get profit margin distribution
router.get('/profit-distribution', getProfitDistribution);

// Get all products with analytics for table view
router.get('/products', getProductsWithAnalytics);

// Get products created over time
router.get('/over-time', getProductsOverTime);

export default router;

