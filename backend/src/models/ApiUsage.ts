import mongoose, { Document, Schema } from 'mongoose';

export interface IApiUsage extends Document {
  storeId: mongoose.Types.ObjectId;
  timestamp: Date;
  callCount: number;
  resetAt: Date;
}

const apiUsageSchema = new Schema<IApiUsage>({
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'ConnectedStore',
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  callCount: {
    type: Number,
    default: 1,
    required: true,
  },
  resetAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 1000),
  },
});

// Compound index for efficient rate limit queries
apiUsageSchema.index({ storeId: 1, timestamp: 1 });

// TTL index to auto-delete old usage records after 24 hours
apiUsageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 });

export const ApiUsage = mongoose.model<IApiUsage>('ApiUsage', apiUsageSchema);

