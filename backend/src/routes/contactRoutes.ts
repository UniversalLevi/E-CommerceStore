import { Router } from 'express';
import { submitContact } from '../controllers/contactController';
import { validate } from '../middleware/validate';
import { contactSchema } from '../validators/contactValidator';
import { generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public route with rate limiting
router.post('/', generalApiRateLimit, validate(contactSchema), submitContact);

export default router;

