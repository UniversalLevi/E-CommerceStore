import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from '../middleware/errorHandler';
import { config } from '../config/env';

// Extend Request type to include file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadImage = async (
  req: MulterRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      throw createError('No image file provided', 400);
    }

    // Generate public URL - files are served from backend
    // Construct backend URL from request or use environment variable
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const backendUrl = process.env.BACKEND_URL || `${protocol}://${host}`;
    const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    next(error);
  }
};
