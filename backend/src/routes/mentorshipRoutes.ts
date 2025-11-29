import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getMentorshipApplications,
  getMentorshipApplication,
  updateMentorshipApplication,
  sendMentorshipReply,
} from '../controllers/mentorshipController';

const router = Router();

// All mentorship admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/applications', getMentorshipApplications);
router.get('/applications/:id', getMentorshipApplication);
router.put('/applications/:id', updateMentorshipApplication);
router.post('/applications/:id/reply', sendMentorshipReply);

export default router;

