import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/productValidator';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin only routes
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(createProductSchema),
  createProduct
);
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(updateProductSchema),
  updateProduct
);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);

export default router;

