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
    // Priority: 1. BACKEND_URL env var, 2. Detect from request headers, 3. Fallback
    
    let baseUrl: string;
    
    if (process.env.BACKEND_URL) {
      // Use explicit backend URL from environment
      baseUrl = process.env.BACKEND_URL;
    } else {
      // Detect protocol from headers (handles reverse proxies)
      // Check X-Forwarded-Proto first (common in production with reverse proxy)
      const forwardedProto = req.get('X-Forwarded-Proto');
      const host = req.get('host') || req.get('X-Forwarded-Host') || 'localhost:5000';

      const isLocalhost =
        host.includes('localhost') || host.includes('127.0.0.1');

      let protocol: string;

      if (isLocalhost) {
        // For localhost/127.0.0.1 always use HTTP to avoid SSL errors in dev
        protocol = 'http';
      } else {
        const isHttps =
          forwardedProto === 'https' ||
          (forwardedProto === undefined && req.protocol === 'https') ||
          (process.env.NODE_ENV === 'production' && forwardedProto !== 'http');

        protocol = isHttps ? 'https' : (req.protocol || 'http');
      }

      baseUrl = `${protocol}://${host}`;
    }

    // If BACKEND_URL was set to an https://localhost URL, force it back to http for dev
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = baseUrl.replace(/^https:\/\//i, 'http://');
    }
    
    // Ensure baseUrl doesn't end with a slash
    baseUrl = baseUrl.replace(/\/$/, '');
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error: any) {
    next(error);
  }
};
