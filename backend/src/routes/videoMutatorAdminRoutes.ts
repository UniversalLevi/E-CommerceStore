import { Router } from 'express';
import {
  adminGetAllJobs,
  adminGetStats,
  adminDeleteJob,
} from '../controllers/videoMutatorController';

const router = Router();

// Get all jobs (admin)
router.get('/jobs', adminGetAllJobs);

// Get admin stats
router.get('/stats', adminGetStats);

// Delete job (admin)
router.delete('/jobs/:jobId', adminDeleteJob);

export default router;

