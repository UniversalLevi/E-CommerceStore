import mongoose, { Document, Schema } from 'mongoose';

export type PayoutMethodType = 'bank' | 'upi' | 'crypto';

export interface IPayoutMethod extends Document {
  userId: mongoose.Types.ObjectId;
  type: PayoutMethodType;
  label: string;
  isDefault: boolean;

  // Bank details
  bankAccount?: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    ifsc: string;
  };

  // UPI details
  upi?: {
    upiId: string;
  };

  // Crypto details
  crypto?: {
    network: string;
    address: string;
    asset?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const payoutMethodSchema = new Schema<IPayoutMethod>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['bank', 'upi', 'crypto'],
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    bankAccount: {
      bankName: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
    },
    upi: {
      upiId: { type: String, trim: true },
    },
    crypto: {
      network: { type: String, trim: true },
      address: { type: String, trim: true },
      asset: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default payout method per user
payoutMethodSchema.index({ userId: 1, isDefault: 1 });

export const PayoutMethod = mongoose.model<IPayoutMethod>('PayoutMethod', payoutMethodSchema);


