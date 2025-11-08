import { Router } from 'express';
import { register, login, logout, getMe, changePassword, deleteAccount } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { authenticateToken } from '../middleware/auth';
import { authRateLimit, generalApiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);

// Protected routes
router.post('/logout', authenticateToken, generalApiRateLimit, logout);
router.get('/me', authenticateToken, generalApiRateLimit, getMe);
router.put('/change-password', authenticateToken, generalApiRateLimit, changePassword);
router.delete('/account', authenticateToken, generalApiRateLimit, deleteAccount);

export default router;

