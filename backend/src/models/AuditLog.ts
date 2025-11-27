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
      'UPDATE_USER_ROLE',
      'ENABLE_USER',
      'DISABLE_USER',
      'DELETE_USER',
      'CREATE_NICHE',
      'UPDATE_NICHE',
      'DELETE_NICHE',
      'RESTORE_NICHE',
      'REPLY_TO_CONTACT',
      'DELETE_CONTACT',
      'USER_REGISTER',
      'USER_LOGIN',
      'CHANGE_PASSWORD',
      'RESET_PASSWORD',
      'FORGOT_PASSWORD',
      'DELETE_ACCOUNT',
      'PAYMENT_CREATE_ORDER',
      'PAYMENT_VERIFY',
      'PAYMENT_WEBHOOK',
      'ADD_PRODUCT_TO_STORE',
      'SUBSCRIPTION_GRANTED',
      'SUBSCRIPTION_REVOKED',
      'SUBSCRIPTION_UPGRADED',
      'SUBSCRIPTION_EXTENDED',
      'REVENUE_VIEWED',
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
// Performance critical: supports sorting by date + filtering by user/action
auditLogSchema.index({ timestamp: -1, userId: 1, action: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);



