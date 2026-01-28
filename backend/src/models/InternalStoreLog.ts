import mongoose, { Document, Schema } from 'mongoose';

export interface IInternalStoreLog extends Document {
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  entityType: 'product' | 'order' | 'theme' | 'settings' | 'store' | 'other';
  entityId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const internalStoreLogSchema = new Schema<IInternalStoreLog>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['product', 'order', 'theme', 'settings', 'store', 'other'],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      index: true,
    },
    changes: {
      before: {
        type: Schema.Types.Mixed,
      },
      after: {
        type: Schema.Types.Mixed,
      },
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // We use custom timestamp field
  }
);

// Compound indexes for common queries
internalStoreLogSchema.index({ storeId: 1, timestamp: -1 });
internalStoreLogSchema.index({ userId: 1, timestamp: -1 });
internalStoreLogSchema.index({ action: 1, timestamp: -1 });
internalStoreLogSchema.index({ entityType: 1, timestamp: -1 });
internalStoreLogSchema.index({ storeId: 1, entityType: 1, timestamp: -1 });
internalStoreLogSchema.index({ success: 1, timestamp: -1 });

export const InternalStoreLog = mongoose.model<IInternalStoreLog>(
  'InternalStoreLog',
  internalStoreLogSchema
);
