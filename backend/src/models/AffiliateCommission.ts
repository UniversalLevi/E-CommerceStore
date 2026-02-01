import mongoose, { Document, Schema } from 'mongoose';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'revoked' | 'cancelled';
export type PurchaseType = 'subscription' | 'service' | 'store_order';

export interface IAffiliateCommission extends Document {
  affiliateId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  purchaseType: PurchaseType;
  // Subscription-specific fields (required for subscription purchases)
  subscriptionId?: mongoose.Types.ObjectId;
  planCode?: 'starter_30' | 'growth_90' | 'lifetime';
  // Service-specific fields (required for service purchases)
  serviceOrderId?: mongoose.Types.ObjectId;
  serviceType?: string;
  // Store order-specific fields (required for store order purchases)
  storeOrderId?: mongoose.Types.ObjectId;
  // Common fields
  paymentId?: mongoose.Types.ObjectId; // Optional for store orders that may not have Payment record
  purchaseAmount: number; // in paise - amount paid for the purchase
  commissionRate: number; // Percentage as decimal (0.20 = 20%)
  commissionAmount: number; // in paise
  status: CommissionStatus;
  // Tracking
  paymentStatus: string; // Track payment status for refund detection
  isRefunded: boolean;
  // Timestamps
  createdAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  revokedAt?: Date;
  // Admin fields
  adminNotes?: string;
}

const commissionSchema = new Schema<IAffiliateCommission>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
      index: true,
    },
    referredUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    purchaseType: {
      type: String,
      required: true,
      enum: ['subscription', 'service', 'store_order'],
      index: true,
    },
    // Subscription-specific fields
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    planCode: {
      type: String,
      enum: ['starter_30', 'growth_90', 'lifetime'],
      index: true,
    },
    // Service-specific fields
    serviceOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceOrder',
      index: true,
    },
    serviceType: {
      type: String,
    },
    // Store order-specific fields
    storeOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreOrder',
      index: true,
    },
    // Common fields
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    purchaseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'paid', 'revoked', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      default: 'paid',
    },
    isRefunded: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    revokedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
commissionSchema.index({ affiliateId: 1, createdAt: -1 });
commissionSchema.index({ referredUserId: 1 });
commissionSchema.index({ subscriptionId: 1 }, { unique: true, sparse: true }); // One commission per subscription
commissionSchema.index({ serviceOrderId: 1 }, { unique: true, sparse: true }); // One commission per service order
commissionSchema.index({ storeOrderId: 1 }, { unique: true, sparse: true }); // One commission per store order
commissionSchema.index({ paymentId: 1 }, { sparse: true });
commissionSchema.index({ status: 1, createdAt: -1 });
commissionSchema.index({ affiliateId: 1, status: 1 });
commissionSchema.index({ purchaseType: 1, createdAt: -1 });

export const AffiliateCommission = mongoose.model<IAffiliateCommission>(
  'AffiliateCommission',
  commissionSchema
);
