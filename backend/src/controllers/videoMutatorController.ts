import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { VideoMutationJob, IVideoMutationJob } from '../models/VideoMutationJob';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import mongoose from 'mongoose';

// Generate unique ID using MongoDB ObjectId
const generateUniqueId = () => new mongoose.Types.ObjectId().toString();

// Configure storage for video uploads
const videoUploadDir = path.join(__dirname, '../../uploads/videos/raw');
const mutatedVideoDir = path.join(__dirname, '../../uploads/videos/mutated');

// Ensure directories exist
[videoUploadDir, mutatedVideoDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${generateUniqueId()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only MP4, MOV, AVI, and WebM videos are allowed.'));
  }
};

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max (suitable for social media reels)
  },
});

// Generate random mutation parameters
// These are tuned to create VISIBLE differences while still looking natural
function generateMutationParams() {
  // Speed: 5-8% change (noticeable but not jarring)
  const speedOptions = [0.92, 0.94, 0.96, 1.04, 1.06, 1.08];
  const speedFactor = speedOptions[Math.floor(Math.random() * speedOptions.length)];
  
  // Crop: 15-40px (visible border removal)
  const cropWidth = Math.floor(Math.random() * 26) + 15; // 15-40
  const cropHeight = Math.floor(Math.random() * 31) + 20; // 20-50
  
  // Brightness: -0.08 to +0.08 (more visible)
  const brightness = (Math.random() * 0.16 - 0.08).toFixed(6);
  
  // Contrast: 0.85 to 1.15 (more visible)
  const contrast = (Math.random() * 0.3 + 0.85).toFixed(6);
  
  // Saturation: 0.9 to 1.2 (new - affects color vibrancy)
  const saturation = (Math.random() * 0.3 + 0.9).toFixed(6);
  
  // Hue shift: -5 to +5 degrees (subtle color tint)
  const hueShift = (Math.random() * 10 - 5).toFixed(2);
  
  return {
    speedFactor,
    cropWidth,
    cropHeight,
    brightness,
    contrast,
    saturation,
    hueShift,
  };
}

// Check if video has audio stream using ffprobe
async function videoHasAudio(inputPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'error',
      '-select_streams', 'a',
      '-show_entries', 'stream=codec_type',
      '-of', 'csv=p=0',
      inputPath,
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', () => {
      // If output contains 'audio', the video has an audio stream
      resolve(output.trim().length > 0);
    });

    ffprobe.on('error', () => {
      // If ffprobe fails, assume no audio to be safe
      resolve(false);
    });
  });
}

// Process video using ffmpeg
async function processVideoWithFFmpeg(
  inputPath: string,
  outputPath: string,
  params: ReturnType<typeof generateMutationParams>
): Promise<void> {
  // Check if video has audio
  const hasAudio = await videoHasAudio(inputPath);

  return new Promise((resolve, reject) => {
    let args: string[];

    // Video filter chain with all mutations:
    // 1. Crop borders
    // 2. EQ: brightness, contrast, saturation
    // 3. Hue shift
    // 4. Scale to 2K
    // 5. Speed adjustment
    const videoFilterChain = `crop=iw-${params.cropWidth}:ih-${params.cropHeight}:${Math.floor(params.cropWidth/2)}:${Math.floor(params.cropHeight/2)},eq=brightness=${params.brightness}:contrast=${params.contrast}:saturation=${params.saturation},hue=h=${params.hueShift},scale=-2:2048,setpts=PTS/${params.speedFactor}`;

    if (hasAudio) {
      // Video with audio - apply both video and audio filters
      const filterComplex = `[0:v]${videoFilterChain}[v]; [0:a]atempo=${params.speedFactor}[a]`;

      args = [
        '-y',
        '-i', inputPath,
        '-map_metadata', '-1',
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-map', '[a]',
        '-c:v', 'libx264',
        '-crf', '18',
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputPath,
      ];
    } else {
      // Video without audio - only apply video filters
      args = [
        '-y',
        '-i', inputPath,
        '-map_metadata', '-1',
        '-vf', videoFilterChain,
        '-c:v', 'libx264',
        '-crf', '18',
        '-preset', 'medium',
        '-an', // No audio
        '-movflags', '+faststart',
        outputPath,
      ];
    }

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    ffmpeg.on('error', (err) => {
      reject(new Error(`FFmpeg error: ${err.message}`));
    });
  });
}

// Upload and create job
export const createMutationJob = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next(createError('No video file uploaded', 400));
    }

    const job = await VideoMutationJob.create({
      userId: req.user!._id,
      originalFileName: req.file.originalname,
      originalFilePath: req.file.path,
      originalFileSize: req.file.size,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Processing will begin shortly.',
      data: {
        jobId: job._id,
        originalFileName: job.originalFileName,
        status: job.status,
      },
    });

    // Start processing asynchronously (don't await)
    const jobIdStr = (job._id as mongoose.Types.ObjectId).toString();
    processJob(jobIdStr).catch((err) => {
      console.error(`Failed to process job ${jobIdStr}:`, err);
    });
  }
);

// Process a job
async function processJob(jobId: string): Promise<void> {
  const job = await VideoMutationJob.findById(jobId);
  if (!job || job.status !== 'pending') return;

  try {
    // Update status to processing
    job.status = 'processing';
    job.processingStartedAt = new Date();
    await job.save();

    // Generate mutation parameters
    const params = generateMutationParams();
    job.mutationParams = {
      speedFactor: params.speedFactor,
      cropWidth: params.cropWidth,
      cropHeight: params.cropHeight,
      brightness: parseFloat(params.brightness),
      contrast: parseFloat(params.contrast),
      saturation: parseFloat(params.saturation),
      hueShift: parseFloat(params.hueShift),
    };

    // Generate output filename
    const outputFileName = `mutated_${generateUniqueId()}.mp4`;
    const outputPath = path.join(mutatedVideoDir, outputFileName);

    // Process video
    await processVideoWithFFmpeg(job.originalFilePath, outputPath, params);

    // Get output file size
    const stats = fs.statSync(outputPath);

    // Update job with results
    job.mutatedFileName = outputFileName;
    job.mutatedFilePath = outputPath;
    job.mutatedFileSize = stats.size;
    job.status = 'completed';
    job.processingCompletedAt = new Date();
    job.processingDuration = Math.round(
      (job.processingCompletedAt.getTime() - job.processingStartedAt!.getTime()) / 1000
    );
    await job.save();

    console.log(`✅ Video mutation completed: ${job.originalFileName} -> ${outputFileName}`);
  } catch (error: any) {
    job.status = 'failed';
    job.error = error.message;
    job.processingCompletedAt = new Date();
    if (job.processingStartedAt) {
      job.processingDuration = Math.round(
        (job.processingCompletedAt.getTime() - job.processingStartedAt.getTime()) / 1000
      );
    }
    await job.save();
    console.error(`❌ Video mutation failed for ${job.originalFileName}:`, error.message);
  }
}

// Get user's jobs
export const getUserJobs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      VideoMutationJob.find({ userId: req.user!._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VideoMutationJob.countDocuments({ userId: req.user!._id }),
    ]);

    res.json({
      success: true,
      data: {
        jobs: jobs.map((job) => ({
          id: job._id,
          originalFileName: job.originalFileName,
          originalFileSize: job.originalFileSize,
          mutatedFileName: job.mutatedFileName,
          mutatedFileSize: job.mutatedFileSize,
          status: job.status,
          error: job.error,
          processingDuration: job.processingDuration,
          mutationParams: job.mutationParams,
          createdAt: job.createdAt,
          completedAt: job.processingCompletedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

// Get single job
export const getJob = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const job = await VideoMutationJob.findOne({
      _id: req.params.jobId,
      userId: req.user!._id,
    });

    if (!job) {
      return next(createError('Job not found', 404));
    }

    res.json({
      success: true,
      data: {
        id: job._id,
        originalFileName: job.originalFileName,
        originalFileSize: job.originalFileSize,
        mutatedFileName: job.mutatedFileName,
        mutatedFileSize: job.mutatedFileSize,
        status: job.status,
        error: job.error,
        processingDuration: job.processingDuration,
        mutationParams: job.mutationParams,
        createdAt: job.createdAt,
        completedAt: job.processingCompletedAt,
      },
    });
  }
);

// Download mutated video
export const downloadMutatedVideo = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const job = await VideoMutationJob.findOne({
      _id: req.params.jobId,
      userId: req.user!._id,
    });

    if (!job) {
      return next(createError('Job not found', 404));
    }

    if (job.status !== 'completed' || !job.mutatedFilePath) {
      return next(createError('Mutated video not available', 400));
    }

    if (!fs.existsSync(job.mutatedFilePath)) {
      return next(createError('Mutated video file not found', 404));
    }

    res.download(job.mutatedFilePath, job.mutatedFileName || 'mutated_video.mp4');
  }
);

// Delete job and files
export const deleteJob = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const job = await VideoMutationJob.findOne({
      _id: req.params.jobId,
      userId: req.user!._id,
    });

    if (!job) {
      return next(createError('Job not found', 404));
    }

    // Delete original file
    if (job.originalFilePath && fs.existsSync(job.originalFilePath)) {
      fs.unlinkSync(job.originalFilePath);
    }

    // Delete mutated file
    if (job.mutatedFilePath && fs.existsSync(job.mutatedFilePath)) {
      fs.unlinkSync(job.mutatedFilePath);
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job and associated files deleted successfully',
    });
  }
);

// Get user stats
export const getUserStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const stats = await VideoMutationJob.aggregate([
      { $match: { userId: req.user!._id } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          failedJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
          },
          pendingJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          processingJobs: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
          },
          totalOriginalSize: { $sum: '$originalFileSize' },
          totalMutatedSize: { $sum: '$mutatedFileSize' },
          avgProcessingTime: { $avg: '$processingDuration' },
        },
      },
    ]);

    const data = stats[0] || {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      pendingJobs: 0,
      processingJobs: 0,
      totalOriginalSize: 0,
      totalMutatedSize: 0,
      avgProcessingTime: 0,
    };

    res.json({
      success: true,
      data,
    });
  }
);

// ========== ADMIN ENDPOINTS ==========

// Get all jobs (admin)
export const adminGetAllJobs = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const userId = req.query.userId as string;

    const query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const [jobs, total] = await Promise.all([
      VideoMutationJob.find(query)
        .populate('userId', 'email name mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VideoMutationJob.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        jobs: jobs.map((job) => ({
          id: job._id,
          user: job.userId,
          originalFileName: job.originalFileName,
          originalFileSize: job.originalFileSize,
          mutatedFileName: job.mutatedFileName,
          mutatedFileSize: job.mutatedFileSize,
          status: job.status,
          error: job.error,
          processingDuration: job.processingDuration,
          mutationParams: job.mutationParams,
          createdAt: job.createdAt,
          completedAt: job.processingCompletedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  }
);

// Get admin stats
export const adminGetStats = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const [overallStats, userStats, recentJobs] = await Promise.all([
      VideoMutationJob.aggregate([
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            failedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
            pendingJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            processingJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
            },
            totalOriginalSize: { $sum: '$originalFileSize' },
            totalMutatedSize: { $sum: '$mutatedFileSize' },
            avgProcessingTime: { $avg: '$processingDuration' },
          },
        },
      ]),
      VideoMutationJob.aggregate([
        {
          $group: {
            _id: '$userId',
            jobCount: { $sum: 1 },
          },
        },
        { $count: 'uniqueUsers' },
      ]),
      VideoMutationJob.find()
        .populate('userId', 'email name')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const stats = overallStats[0] || {
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      pendingJobs: 0,
      processingJobs: 0,
      totalOriginalSize: 0,
      totalMutatedSize: 0,
      avgProcessingTime: 0,
    };

    res.json({
      success: true,
      data: {
        ...stats,
        uniqueUsers: userStats[0]?.uniqueUsers || 0,
        recentJobs: recentJobs.map((job) => ({
          id: job._id,
          user: job.userId,
          originalFileName: job.originalFileName,
          status: job.status,
          createdAt: job.createdAt,
        })),
      },
    });
  }
);

// Admin delete job
export const adminDeleteJob = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const job = await VideoMutationJob.findById(req.params.jobId);

    if (!job) {
      return next(createError('Job not found', 404));
    }

    // Delete original file
    if (job.originalFilePath && fs.existsSync(job.originalFilePath)) {
      fs.unlinkSync(job.originalFilePath);
    }

    // Delete mutated file
    if (job.mutatedFilePath && fs.existsSync(job.mutatedFilePath)) {
      fs.unlinkSync(job.mutatedFilePath);
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job and associated files deleted successfully',
    });
  }
);

// Retry failed job
export const retryJob = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const job = await VideoMutationJob.findOne({
      _id: req.params.jobId,
      userId: req.user!._id,
    });

    if (!job) {
      return next(createError('Job not found', 404));
    }

    if (job.status !== 'failed') {
      return next(createError('Only failed jobs can be retried', 400));
    }

    if (!fs.existsSync(job.originalFilePath)) {
      return next(createError('Original video file not found', 404));
    }

    // Reset job status
    job.status = 'pending';
    job.error = undefined;
    job.processingStartedAt = undefined;
    job.processingCompletedAt = undefined;
    job.processingDuration = undefined;
    job.mutatedFileName = undefined;
    job.mutatedFilePath = undefined;
    job.mutatedFileSize = undefined;
    job.mutationParams = undefined;
    await job.save();

    res.json({
      success: true,
      message: 'Job queued for retry',
      data: {
        jobId: job._id,
        status: job.status,
      },
    });

    // Start processing asynchronously
    const retryJobId = (job._id as mongoose.Types.ObjectId).toString();
    processJob(retryJobId).catch((err) => {
      console.error(`Failed to retry job ${retryJobId}:`, err);
    });
  }
);

