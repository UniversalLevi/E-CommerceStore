import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'store_connection' | 'product_added' | 'store_test' | 'system_update' | 'mentorship_application' | 'admin_sent' | 'withdrawal_status' | 'template_applied';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['store_connection', 'product_added', 'store_test', 'system_update', 'mentorship_application', 'admin_sent', 'withdrawal_status', 'template_applied'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    link: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
  'Notification',
  notificationSchema
);

