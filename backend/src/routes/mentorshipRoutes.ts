import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  createMentorshipApplication,
  getMentorshipApplications,
  getMentorshipApplication,
  updateMentorshipApplication,
  sendMentorshipReply,
} from '../controllers/mentorshipController';

const router = Router();

// Public route - anyone can submit a mentorship application
router.post('/applications', createMentorshipApplication);

// Admin routes - require authentication and admin role
router.get('/applications', authenticateToken, requireAdmin, getMentorshipApplications);
router.get('/applications/:id', authenticateToken, requireAdmin, getMentorshipApplication);
router.put('/applications/:id', authenticateToken, requireAdmin, updateMentorshipApplication);
router.post('/applications/:id/reply', authenticateToken, requireAdmin, sendMentorshipReply);

export default router;

