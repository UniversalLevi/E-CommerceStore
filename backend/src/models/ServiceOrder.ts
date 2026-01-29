import mongoose, { Document, Schema } from 'mongoose';

export type ServiceType = 'ads_management' | 'connect_experts';
export type PlanType = 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ServiceStatus = 'active' | 'expired' | 'cancelled';

export interface IServiceOrder extends Document {
  userId: mongoose.Types.ObjectId;
  serviceType: ServiceType;
  planType: PlanType;
  amount: number; // in paise - base amount
  commissionRate?: number; // percentage (e.g., 10 for 10%) - for ads management
  targetGoal?: number; // in paise - for connect experts (e.g., 10000000 for ₹1L)
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: ServiceStatus;
  startDate: Date;
  endDate?: Date | null; // null for lifetime plans
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const serviceOrderSchema = new Schema<IServiceOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      enum: ['ads_management', 'connect_experts'],
      required: true,
      index: true,
    },
    planType: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    targetGoal: {
      type: Number,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
serviceOrderSchema.index({ userId: 1, serviceType: 1, status: 1 });
serviceOrderSchema.index({ userId: 1, paymentStatus: 1 });
serviceOrderSchema.index({ serviceType: 1, planType: 1, status: 1 });
serviceOrderSchema.index({ paymentStatus: 1, status: 1 });

// Pre-save hook to calculate endDate based on planType
serviceOrderSchema.pre('save', function (next) {
  if (this.isNew && this.planType !== 'lifetime' && !this.endDate) {
    const startDate = this.startDate || new Date();
    let daysToAdd = 0;
    
    switch (this.planType) {
      case 'monthly':
        daysToAdd = 30;
        break;
      case 'quarterly':
        daysToAdd = 90;
        break;
      case 'yearly':
        daysToAdd = 365;
        break;
      default:
        daysToAdd = 0;
    }
    
    if (daysToAdd > 0) {
      this.endDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
  }
  next();
});

export const ServiceOrder = mongoose.model<IServiceOrder>('ServiceOrder', serviceOrderSchema);
