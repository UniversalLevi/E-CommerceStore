import { Router } from 'express';
import { register, login, logout, getMe, changePassword, deleteAccount, forgotPassword, resetPassword, updateOnboarding } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidator';
import { authenticateToken } from '../middleware/auth';
import { authRateLimit, generalApiRateLimit } from '../middleware/rateLimit';
import { z } from 'zod';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimit, validate(resetPasswordSchema), resetPassword);

// Protected routes
router.post('/logout', authenticateToken, generalApiRateLimit, logout);
router.get('/me', authenticateToken, generalApiRateLimit, getMe);
router.put('/change-password', authenticateToken, generalApiRateLimit, changePassword);
router.delete('/account', authenticateToken, generalApiRateLimit, deleteAccount);

// Onboarding route
const onboardingSchema = z.object({
  nicheId: z.string().min(1, 'Niche ID is required'),
  goal: z.enum(['dropship', 'brand', 'start_small']),
});
router.put('/onboarding', authenticateToken, generalApiRateLimit, validate(onboardingSchema), updateOnboarding);

export default router;

