import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  storeId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'ConnectedStore',
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
    enum: [
      'connected',
      'disconnected',
      'accessed',
      'refreshed',
      'auth_failed',
      'token_expired',
      'token_expiring_soon',
      'reconnected',
      'revoked',
      'webhook_received',
      'webhook_failed',
    ],
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
});

// Compound indexes for audit queries
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ storeId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index to auto-delete old logs after 90 days
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

