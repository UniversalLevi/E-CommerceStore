import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePaidPlan } from '../middleware/subscription';
import { generalApiRateLimit } from '../middleware/rateLimit';
import { list, create, getOne, update, updateStatus } from '../controllers/manualOrderController';

const router = Router();

router.use(authenticateToken);
router.use(requirePaidPlan);
router.use(generalApiRateLimit);

router.get('/', list);
router.post('/', create);
router.get('/:id', getOne);
router.put('/:id', update);
router.patch('/:id/status', updateStatus);

export default router;
