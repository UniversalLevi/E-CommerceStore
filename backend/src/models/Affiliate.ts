import mongoose, { Document, Schema } from 'mongoose';

export type AffiliateStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface IAffiliate extends Document {
  userId: mongoose.Types.ObjectId;
  status: AffiliateStatus;
  referralCode: string; // Unique referral code
  customCommissionRates?: {
    starter_30?: number; // Percentage as decimal (0.20 = 20%)
    growth_90?: number;
    lifetime?: number;
    service?: number; // Percentage as decimal (0.15 = 15%)
    store_order?: number; // Percentage as decimal (0.10 = 10%)
  };
  // Stats (calculated fields, can be cached)
  totalReferrals: number;
  totalCommissions: number; // in paise
  paidCommissions: number; // in paise
  pendingCommissions: number; // in paise
  // Admin fields
  adminNotes?: string;
  fraudFlags?: string[]; // Array of fraud flag reasons
  // Timestamps
  applicationDate: Date;
  approvalDate?: Date;
  suspendedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const affiliateSchema = new Schema<IAffiliate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    referralCode: {
      type: String,
      required: false, // Auto-generated in pre-save hook
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    customCommissionRates: {
      starter_30: {
        type: Number,
        min: 0,
        max: 1,
      },
      growth_90: {
        type: Number,
        min: 0,
        max: 1,
      },
      lifetime: {
        type: Number,
        min: 0,
        max: 1,
      },
      service: {
        type: Number,
        min: 0,
        max: 1,
      },
      store_order: {
        type: Number,
        min: 0,
        max: 1,
      },
    },
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCommissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidCommissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingCommissions: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    fraudFlags: {
      type: [String],
      default: [],
    },
    applicationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    approvalDate: {
      type: Date,
    },
    suspendedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique referral code before saving
affiliateSchema.pre('save', async function (next) {
  // Only generate if this is a new document and referralCode is not set
  if (this.isNew && !this.referralCode) {
    // Generate referral code: first 6 chars of user ID + random 4 chars
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      const userIdStr = this.userId.toString().slice(-6).toUpperCase();
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `${userIdStr}${randomStr}`;

      const existing = await mongoose.model('Affiliate').findOne({ referralCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      // Fallback: use timestamp-based code
      code = `REF${Date.now().toString(36).toUpperCase().slice(-8)}`;
    }

    this.referralCode = code!;
  }
  next();
});

// Indexes
affiliateSchema.index({ status: 1, createdAt: -1 });
affiliateSchema.index({ referralCode: 1 });

export const Affiliate = mongoose.model<IAffiliate>('Affiliate', affiliateSchema);
