import { Router } from 'express';
import {
  getAllNichesAdmin,
  createNiche,
  updateNiche,
  deleteNiche,
  restoreNiche,
} from '../controllers/nicheController';
import { validate } from '../middleware/validate';
import { createNicheSchema, updateNicheSchema } from '../validators/nicheValidator';

const router = Router();

// Admin routes (ID-based, no caching)
router.get('/', getAllNichesAdmin);
router.post('/', validate(createNicheSchema), createNiche);
router.put('/:id', validate(updateNicheSchema), updateNiche);
router.delete('/:id', deleteNiche);
router.post('/:id/restore', restoreNiche);

export default router;




