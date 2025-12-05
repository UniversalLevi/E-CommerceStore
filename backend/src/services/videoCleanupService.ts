import cron from 'node-cron';
import { VideoMutationJob } from '../models/VideoMutationJob';
import fs from 'fs';
import path from 'path';

const VIDEO_RETENTION_DAYS = 3;

/**
 * Delete video files and job records older than VIDEO_RETENTION_DAYS
 */
async function cleanupOldVideos(): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - VIDEO_RETENTION_DAYS);

  console.log(`🗑️ Starting video cleanup - deleting jobs older than ${VIDEO_RETENTION_DAYS} days (before ${cutoffDate.toISOString()})`);

  try {
    // Find all jobs older than cutoff date
    const oldJobs = await VideoMutationJob.find({
      createdAt: { $lt: cutoffDate },
    });

    if (oldJobs.length === 0) {
      console.log('✅ No old videos to clean up');
      return;
    }

    let deletedCount = 0;
    let freedBytes = 0;

    for (const job of oldJobs) {
      try {
        // Delete original file
        if (job.originalFilePath && fs.existsSync(job.originalFilePath)) {
          const stats = fs.statSync(job.originalFilePath);
          freedBytes += stats.size;
          fs.unlinkSync(job.originalFilePath);
        }

        // Delete mutated file
        if (job.mutatedFilePath && fs.existsSync(job.mutatedFilePath)) {
          const stats = fs.statSync(job.mutatedFilePath);
          freedBytes += stats.size;
          fs.unlinkSync(job.mutatedFilePath);
        }

        // Delete the job record
        await job.deleteOne();
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete job ${job._id}:`, err);
      }
    }

    const freedMB = (freedBytes / (1024 * 1024)).toFixed(2);
    console.log(`✅ Video cleanup complete: deleted ${deletedCount} jobs, freed ${freedMB} MB`);
  } catch (error) {
    console.error('❌ Video cleanup failed:', error);
  }
}

/**
 * Start the video cleanup service
 * Runs daily at 2:00 AM
 */
export function startVideoCleanupService(): void {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', () => {
    console.log('🕐 Running scheduled video cleanup...');
    cleanupOldVideos();
  });

  console.log('✅ Video cleanup service started (runs daily at 2:00 AM, deletes videos older than 3 days)');
}

// Export for manual cleanup if needed
export { cleanupOldVideos };

