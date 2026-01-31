import mongoose, { Document, Schema } from 'mongoose';

export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface IAffiliatePayout extends Document {
  affiliateId: mongoose.Types.ObjectId;
  amount: number; // in paise
  status: PayoutStatus;
  walletTransactionId?: mongoose.Types.ObjectId; // Reference to wallet transaction when paid
  adminNotes?: string;
  rejectionReason?: string;
  requestedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  rejectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new Schema<IAffiliatePayout>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // At least 1 paisa
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
      index: true,
    },
    walletTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'WalletTransaction',
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
payoutSchema.index({ affiliateId: 1, createdAt: -1 });
payoutSchema.index({ status: 1, requestedAt: -1 });
payoutSchema.index({ affiliateId: 1, status: 1 });

export const AffiliatePayout = mongoose.model<IAffiliatePayout>(
  'AffiliatePayout',
  payoutSchema
);
