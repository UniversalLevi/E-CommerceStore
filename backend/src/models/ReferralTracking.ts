import mongoose, { Document, Schema } from 'mongoose';

export type TrackingMethod = 'link' | 'code';
export type TrackingStatus = 'pending' | 'converted' | 'expired';

export interface IReferralTracking extends Document {
  affiliateId: mongoose.Types.ObjectId;
  referralCode: string;
  referredUserId?: mongoose.Types.ObjectId; // Set when user signs up
  trackingMethod: TrackingMethod;
  cookieData?: string; // Cookie identifier if applicable
  ipAddress?: string; // For fraud detection
  userAgent?: string;
  status: TrackingStatus;
  convertedAt?: Date; // When user successfully signs up
  expiresAt: Date; // 30 days from first visit
  createdAt: Date;
  updatedAt: Date;
}

const trackingSchema = new Schema<IReferralTracking>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
      index: true,
    },
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    trackingMethod: {
      type: String,
      required: true,
      enum: ['link', 'code'],
      index: true,
    },
    cookieData: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'converted', 'expired'],
      default: 'pending',
      index: true,
    },
    convertedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Set expiration date before saving
trackingSchema.pre('save', function (next) {
  if (this.isNew && !this.expiresAt) {
    const expiryDays = 30;
    this.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  }
  next();
});

// Indexes
trackingSchema.index({ affiliateId: 1, status: 1 });
trackingSchema.index({ referredUserId: 1 });
trackingSchema.index({ referralCode: 1, status: 1 });
trackingSchema.index({ cookieData: 1, status: 1 });
trackingSchema.index({ expiresAt: 1 }); // For cleanup queries
trackingSchema.index({ ipAddress: 1 }); // For fraud detection

// Compound index for finding active referrals
trackingSchema.index({ referredUserId: 1, status: 1 }, { unique: true, sparse: true });

export const ReferralTracking = mongoose.model<IReferralTracking>(
  'ReferralTracking',
  trackingSchema
);
