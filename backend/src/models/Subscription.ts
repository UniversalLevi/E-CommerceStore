import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionHistory {
  action: 'manual_granted' | 'manual_revoke' | 'manual_upgrade' | 'manual_extension' | 'payment_received' | 'auto_renewal' | 'subscription_activated' | 'subscription_cancelled' | 'subscription_expired';
  timestamp: Date;
  adminId?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planCode: 'starter_30' | 'growth_90' | 'lifetime';
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'manually_granted';
  startDate: Date;
  endDate?: Date | null;
  renewalDate?: Date;
  amountPaid: number; // in paise
  source: 'razorpay' | 'manual';
  adminNote?: string;
  history: ISubscriptionHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionHistorySchema = new Schema<ISubscriptionHistory>({
  action: {
    type: String,
    required: true,
    enum: [
      'manual_granted',
      'manual_revoke',
      'manual_upgrade',
      'manual_extension',
      'payment_received',
      'auto_renewal',
      'subscription_activated',
      'subscription_cancelled',
      'subscription_expired',
    ],
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
  },
}, { _id: false });

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planCode: {
      type: String,
      required: true,
      enum: ['starter_30', 'growth_90', 'lifetime'],
    },
    razorpaySubscriptionId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'cancelled', 'expired', 'trial', 'manually_granted'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    renewalDate: {
      type: Date,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: ['razorpay', 'manual'],
      default: 'razorpay',
    },
    adminNote: {
      type: String,
    },
    history: {
      type: [subscriptionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ status: 1, createdAt: -1 });
subscriptionSchema.index({ planCode: 1 });
subscriptionSchema.index({ createdAt: -1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

