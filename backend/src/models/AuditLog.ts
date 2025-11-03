import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  storeId?: mongoose.Types.ObjectId;
  success: boolean;
  errorMessage?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_STORE',
      'UPDATE_STORE',
      'DELETE_STORE',
      'TEST_STORE',
      'SET_DEFAULT_STORE',
      'AUTO_HEALTH_CHECK',
    ],
    index: true,
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'StoreConnection',
    index: true,
  },
  success: {
    type: Boolean,
    default: true,
    index: true,
  },
  errorMessage: {
    type: String,
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
});

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ storeId: 1, timestamp: -1 });
auditLogSchema.index({ success: 1, timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);



