import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  uploadVideo,
  createMutationJob,
  getUserJobs,
  getJob,
  downloadMutatedVideo,
  deleteJob,
  getUserStats,
  retryJob,
} from '../controllers/videoMutatorController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload and create mutation job
router.post('/upload', uploadVideo.single('video'), createMutationJob);

// Get user's jobs
router.get('/jobs', getUserJobs);

// Get user stats
router.get('/stats', getUserStats);

// Get single job
router.get('/jobs/:jobId', getJob);

// Download mutated video
router.get('/jobs/:jobId/download', downloadMutatedVideo);

// Retry failed job
router.post('/jobs/:jobId/retry', retryJob);

// Delete job
router.delete('/jobs/:jobId', deleteJob);

export default router;

