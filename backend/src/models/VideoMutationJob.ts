import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoMutationJob extends Document {
  userId: mongoose.Types.ObjectId;
  originalFileName: string;
  originalFilePath: string;
  originalFileSize: number;
  mutatedFileName?: string;
  mutatedFilePath?: string;
  mutatedFileSize?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  processingDuration?: number; // in seconds
  // Mutation parameters applied
  mutationParams?: {
    speedFactor: number;
    cropWidth: number;
    cropHeight: number;
    brightness: number;
    contrast: number;
    saturation?: number;
    hueShift?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const videoMutationJobSchema = new Schema<IVideoMutationJob>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    originalFilePath: {
      type: String,
      required: true,
    },
    originalFileSize: {
      type: Number,
      required: true,
    },
    mutatedFileName: {
      type: String,
    },
    mutatedFilePath: {
      type: String,
    },
    mutatedFileSize: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error: {
      type: String,
    },
    processingStartedAt: {
      type: Date,
    },
    processingCompletedAt: {
      type: Date,
    },
    processingDuration: {
      type: Number,
    },
    mutationParams: {
      speedFactor: Number,
      cropWidth: Number,
      cropHeight: Number,
      brightness: Number,
      contrast: Number,
      saturation: Number,
      hueShift: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user's jobs
videoMutationJobSchema.index({ userId: 1, createdAt: -1 });
// Index for admin queries
videoMutationJobSchema.index({ status: 1, createdAt: -1 });

export const VideoMutationJob = mongoose.model<IVideoMutationJob>(
  'VideoMutationJob',
  videoMutationJobSchema
);

