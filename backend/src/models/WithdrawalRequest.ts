import mongoose, { Document, Schema } from 'mongoose';

export type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'failed';

export interface IWithdrawalRequest extends Document {
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  payoutMethodId: mongoose.Types.ObjectId;
  amount: number; // net amount user will receive, in paise
  feeAmount: number; // fee charged, in paise
  grossAmount: number; // total debited from wallet = amount + feeAmount
  currency: string;
  status: WithdrawalStatus;
  userNote?: string;
  adminNote?: string;
  txRef?: string; // bank UTR / UPI ref / crypto tx hash
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    payoutMethodId: {
      type: Schema.Types.ObjectId,
      ref: 'PayoutMethod',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'approved', 'rejected', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    userNote: {
      type: String,
      default: '',
      trim: true,
    },
    adminNote: {
      type: String,
      default: '',
      trim: true,
    },
    txRef: {
      type: String,
      default: '',
      trim: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

withdrawalRequestSchema.index({ userId: 1, createdAt: -1 });

export const WithdrawalRequest = mongoose.model<IWithdrawalRequest>(
  'WithdrawalRequest',
  withdrawalRequestSchema
);


