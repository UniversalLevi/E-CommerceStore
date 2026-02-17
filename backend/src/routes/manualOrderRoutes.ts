import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { generalApiRateLimit } from '../middleware/rateLimit';
import { list, create, getOne, update, updateStatus, getAvailableProducts } from '../controllers/manualOrderController';

const router = Router();

router.use(authenticateToken);
router.use(generalApiRateLimit);

router.get('/', list);
router.get('/available-products', getAvailableProducts);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);

export default router;
