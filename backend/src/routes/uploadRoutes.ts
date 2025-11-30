import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadImage } from '../controllers/uploadController';
import { createError } from '../middleware/errorHandler';

const router = Router();

// Multer error handler middleware
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(createError('File too large. Maximum size is 5MB', 400));
    }
    if (err.message === 'Only image files are allowed') {
      return next(createError('Only image files are allowed', 400));
    }
    return next(createError(err.message || 'File upload error', 400));
  }
  next();
};

// Upload image endpoint (protected)
router.post(
  '/image',
  authenticateToken,
  upload.single('image'),
  handleMulterError,
  uploadImage
);

export default router;

