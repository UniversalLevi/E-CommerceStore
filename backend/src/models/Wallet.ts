import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number; // in paise (smallest currency unit)
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
walletSchema.index({ balance: 1 });

// Helper method to format balance for display
walletSchema.methods.getFormattedBalance = function (): string {
  return `₹${(this.balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

// Static method to get or create wallet for user
walletSchema.statics.getOrCreateWallet = async function (
  userId: mongoose.Types.ObjectId
): Promise<IWallet> {
  let wallet = await this.findOne({ userId });
  if (!wallet) {
    wallet = await this.create({ userId });
  }
  return wallet;
};

export const Wallet = mongoose.model<IWallet>('Wallet', walletSchema);

