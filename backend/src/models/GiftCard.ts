import mongoose, { Document, Schema } from 'mongoose';

export interface IGiftCard extends Document {
  storeId: mongoose.Types.ObjectId;
  code: string;
  initialBalance: number; // in paise
  currentBalance: number; // in paise
  currency: string;
  purchaserEmail?: string;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  isActive: boolean;
  expiresAt?: Date;
  createdBy: 'store_owner' | 'customer_purchase';
  createdAt: Date;
  updatedAt: Date;
}

const giftCardSchema = new Schema<IGiftCard>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    currentBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    purchaserEmail: { type: String, lowercase: true, trim: true },
    recipientEmail: { type: String, lowercase: true, trim: true },
    recipientName: { type: String, trim: true },
    message: { type: String, trim: true, maxlength: 500 },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: { type: Date, default: undefined },
    createdBy: {
      type: String,
      enum: ['store_owner', 'customer_purchase'],
      default: 'store_owner',
    },
  },
  { timestamps: true }
);

giftCardSchema.index({ storeId: 1, code: 1 }, { unique: true });

export const GiftCard = mongoose.model<IGiftCard>('GiftCard', giftCardSchema);
