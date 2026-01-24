import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireStoreOwner } from '../middleware/storeMiddleware';
import * as importController from '../controllers/storeProductImportController';

const router = express.Router();

// Catalog browsing and import routes
router.get(
  '/stores/:id/products/catalog',
  authenticateToken,
  requireStoreOwner,
  importController.browseCatalogProducts
);

router.get(
  '/stores/:id/products/catalog/:productId',
  authenticateToken,
  requireStoreOwner,
  importController.getCatalogProductDetails
);

router.post(
  '/stores/:id/products/import',
  authenticateToken,
  requireStoreOwner,
  importController.importProduct
);

export default router;
