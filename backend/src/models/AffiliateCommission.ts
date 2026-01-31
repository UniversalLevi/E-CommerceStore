import mongoose, { Document, Schema } from 'mongoose';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'revoked' | 'cancelled';

export interface IAffiliateCommission extends Document {
  affiliateId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  planCode: 'starter_30' | 'growth_90' | 'lifetime';
  subscriptionAmount: number; // in paise - amount paid for subscription
  commissionRate: number; // Percentage as decimal (0.20 = 20%)
  commissionAmount: number; // in paise
  status: CommissionStatus;
  // Tracking
  paymentStatus: string; // Track payment status for refund detection
  isRefunded: boolean;
  // Timestamps
  createdAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  revokedAt?: Date;
  // Admin fields
  adminNotes?: string;
}

const commissionSchema = new Schema<IAffiliateCommission>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    planCode: {
      type: String,
      required: true,
      enum: ['starter_30', 'growth_90', 'lifetime'],
      index: true,
    },
    subscriptionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'paid', 'revoked', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      default: 'paid',
    },
    isRefunded: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commissionSchema.index({ affiliateId: 1, createdAt: -1 });
commissionSchema.index({ referredUserId: 1 });
commissionSchema.index({ subscriptionId: 1 }, { unique: true }); // One commission per subscription
commissionSchema.index({ paymentId: 1 });
commissionSchema.index({ status: 1, createdAt: -1 });
commissionSchema.index({ affiliateId: 1, status: 1 });

export const AffiliateCommission = mongoose.model<IAffiliateCommission>(
  'AffiliateCommission',
  commissionSchema
);
