import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { createError } from '../middleware/errorHandler';
import { config } from '../config/env';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// ─── Image storage ──────────────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `image-${suffix}${path.extname(file.originalname)}`);
  },
});

const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'));
};

export const upload = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Video storage ──────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    const dir = path.join(process.cwd(), 'public', 'uploads', 'videos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `video-${suffix}${path.extname(file.originalname)}`);
  },
});

const videoFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files are allowed'));
};

export const videoUpload = multer({ storage: videoStorage, fileFilter: videoFilter, limits: { fileSize: 100 * 1024 * 1024 } });

// ─── Resolve base URL ───────────────────────────────────────────────
function resolveBaseUrl(req: Request): string {
  let baseUrl: string;
  if (process.env.BACKEND_URL) {
    baseUrl = process.env.BACKEND_URL;
  } else {
    const forwardedProto = req.get('X-Forwarded-Proto');
    const host = req.get('host') || req.get('X-Forwarded-Host') || 'localhost:5000';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    let protocol: string;
    if (isLocalhost) {
      protocol = 'http';
    } else {
      const isHttps = forwardedProto === 'https' || (forwardedProto === undefined && req.protocol === 'https') || (process.env.NODE_ENV === 'production' && forwardedProto !== 'http');
      protocol = isHttps ? 'https' : (req.protocol || 'http');
    }
    baseUrl = `${protocol}://${host}`;
  }
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    baseUrl = baseUrl.replace(/^https:\/\//i, 'http://');
  }
  return baseUrl.replace(/\/$/, '');
}

// ─── Upload handlers ────────────────────────────────────────────────
export const uploadImage = async (req: MulterRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw createError('No image file provided', 400);
    const baseUrl = resolveBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/images/${req.file.filename}`;
    res.json({ success: true, url: fileUrl, filename: req.file.filename });
  } catch (error: any) { next(error); }
};

export const uploadVideo = async (req: MulterRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw createError('No video file provided', 400);
    const baseUrl = resolveBaseUrl(req);
    const fileUrl = `${baseUrl}/uploads/videos/${req.file.filename}`;
    res.json({ success: true, url: fileUrl, filename: req.file.filename });
  } catch (error: any) { next(error); }
};
