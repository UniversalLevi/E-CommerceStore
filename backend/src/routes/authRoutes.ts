import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', authenticateToken, getMe);

export default router;

