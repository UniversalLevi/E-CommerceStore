import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  storeId: mongoose.Types.ObjectId;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // percentage (1-100) or fixed amount in paise
  minOrderValue: number; // in paise, 0 = no minimum
  maxDiscount: number; // in paise, 0 = no cap (only relevant for percentage)
  usageLimit: number; // 0 = unlimited
  usedCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
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
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

couponSchema.index({ storeId: 1, code: 1 }, { unique: true });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
