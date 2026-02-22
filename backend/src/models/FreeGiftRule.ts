import mongoose, { Document, Schema } from 'mongoose';

export interface IFreeGiftRule extends Document {
  storeId: mongoose.Types.ObjectId;
  minOrderValue: number; // in paise
  giftProductId: mongoose.Types.ObjectId;
  giftProductTitle: string;
  giftProductImage?: string;
  isActive: boolean;
  maxClaims: number; // 0 = unlimited
  claimedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const freeGiftRuleSchema = new Schema<IFreeGiftRule>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    minOrderValue: {
      type: Number,
      required: true,
      min: 0,
    },
    giftProductId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreProduct',
      required: true,
    },
    giftProductTitle: {
      type: String,
      required: true,
      trim: true,
    },
    giftProductImage: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxClaims: {
      type: Number,
      default: 0,
      min: 0,
    },
    claimedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

freeGiftRuleSchema.index({ storeId: 1, isActive: 1 });

export const FreeGiftRule = mongoose.model<IFreeGiftRule>('FreeGiftRule', freeGiftRuleSchema);
