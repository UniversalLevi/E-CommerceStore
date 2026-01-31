import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'credit' | 'debit';

export type TransactionReason =
  | 'Topup - Razorpay'
  | 'Order deduction'
  | 'Refund'
  | 'Manual adjustment'
  | 'Auto-recharge'
  | 'Cashback'
  | 'Promotional credit'
  | 'Affiliate payout';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId | null;
  zenOrderId: mongoose.Types.ObjectId | null;
  amount: number; // always positive, in paise
  type: TransactionType;
  reason: string;
  referenceId: string | null; // payment gateway ID or internal reference
  metadata: Record<string, any>;
  balanceBefore: number; // wallet balance before this transaction
  balanceAfter: number; // wallet balance after this transaction
  createdAt: Date;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    zenOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'ZenOrder',
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // At least 1 paisa
    },
    type: {
      type: String,
      required: true,
      enum: ['credit', 'debit'],
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    referenceId: {
      type: String,
      default: null,
      // Index defined below with unique constraint
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt, transactions are immutable
  }
);

// Compound indexes for common queries
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceId: 1 }, { unique: true, sparse: true });
walletTransactionSchema.index({ userId: 1, type: 1, createdAt: -1 });

// Static method to check if a transaction with referenceId exists (idempotency)
walletTransactionSchema.statics.existsByReferenceId = async function (
  referenceId: string
): Promise<boolean> {
  const exists = await this.findOne({ referenceId }).select('_id').lean();
  return !!exists;
};

export const WalletTransaction = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  walletTransactionSchema
);

