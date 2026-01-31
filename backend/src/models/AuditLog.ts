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
      'SUBSCRIPTION_NOTE_ADDED',
      'SUBSCRIPTION_VIEWED',
      'SUBSCRIPTION_LIST_VIEWED',
      'SUBSCRIPTION_HISTORY_VIEWED',
      'REVENUE_VIEWED',
      'REVENUE_PAYMENTS_VIEWED',
      'REVENUE_EXPORTED',
      'LINK_EMAIL',
      'VERIFY_EMAIL',
      'LINK_MOBILE',
      'MENTORSHIP_REPLY_SENT',
      'UPDATE_MENTORSHIP_APPLICATION',
      // Order management actions
      'ORDER_VIEW',
      'ORDER_FULFILL',
      'ORDER_CANCEL',
      'ORDER_CLOSE',
      'ORDER_OPEN',
      'ORDER_COMPLETED',
      'ORDER_REOPENED',
      'UPDATE_ORDER_ZEN_STATUS',
      'FULFILLMENT_CANCEL',
      'ORDER_NOTE_ADDED',
      // Order automation
      'ORDER_AUTO_GENERATED',
      // ZEN Fulfillment actions
      'ORDER_FULFILL_VIA_ZEN',
      'ZEN_ORDER_STATUS_UPDATE',
      'ZEN_ORDER_ASSIGN',
      'ZEN_ORDER_BULK_UPDATE',
      'ADMIN_WALLET_ADJUST',
      'UPDATE_USER_INFO',
      'USER_CALL_LOGGED',
      'USER_CALL_LOG_UPDATED',
      'USER_CALL_LOG_DELETED',
      // Template actions
      'CREATE_TEMPLATE',
      'UPDATE_TEMPLATE',
      'DELETE_TEMPLATE',
      'PERMANENT_DELETE_TEMPLATE',
      'DUPLICATE_TEMPLATE',
      'APPLY_TEMPLATE',
      'SET_DEFAULT_THEME',
      // Affiliate actions
      'AFFILIATE_APPLY',
      'AFFILIATE_APPROVE',
      'AFFILIATE_REJECT',
      'AFFILIATE_SUSPEND',
      'AFFILIATE_COMMISSION_RATE_UPDATE',
      'AFFILIATE_COMMISSION_ADJUST',
      'AFFILIATE_PAYOUT_REQUEST',
      'AFFILIATE_PAYOUT_APPROVE',
      'AFFILIATE_PAYOUT_REJECT',
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



