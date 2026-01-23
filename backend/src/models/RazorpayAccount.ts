import mongoose, { Document, Schema } from 'mongoose';

export interface IRazorpayAccount extends Document {
  userId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  razorpayAccountId: string; // Razorpay account ID
  email: string; // From Razorpay
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  onboardingData: Record<string, any>; // Stored Razorpay onboarding response
  createdAt: Date;
  updatedAt: Date;
}

const razorpayAccountSchema = new Schema<IRazorpayAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One account per user
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      unique: true, // One account per store
      index: true,
    },
    razorpayAccountId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    onboardingData: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
razorpayAccountSchema.index({ userId: 1 }, { unique: true });
razorpayAccountSchema.index({ storeId: 1 }, { unique: true });
razorpayAccountSchema.index({ razorpayAccountId: 1 }, { unique: true });
razorpayAccountSchema.index({ status: 1 });

export const RazorpayAccount = mongoose.model<IRazorpayAccount>('RazorpayAccount', razorpayAccountSchema);
