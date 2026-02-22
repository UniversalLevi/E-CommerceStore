import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload, uploadImage, videoUpload, uploadVideo } from '../controllers/uploadController';
import { createError } from '../middleware/errorHandler';

const router = Router();

const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = err.field === 'video' ? '100MB' : '5MB';
      return next(createError(`File too large. Maximum size is ${maxMb}`, 400));
    }
    if (err.message === 'Only image files are allowed' || err.message === 'Only video files are allowed') {
      return next(createError(err.message, 400));
    }
    return next(createError(err.message || 'File upload error', 400));
  }
  next();
};

router.post('/image', authenticateToken, upload.single('image'), handleMulterError, uploadImage);
router.post('/video', authenticateToken, videoUpload.single('video'), handleMulterError, uploadVideo);

export default router;

