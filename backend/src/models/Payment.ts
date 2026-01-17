import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  paymentId: string;
  signature: string;
  planCode: 'starter_30' | 'growth_90' | 'lifetime';
  status: 'created' | 'paid' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  razorpayOrderId: string;
  subscriptionId?: mongoose.Types.ObjectId;
  planName?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
    },
    signature: {
      type: String,
      required: false,
    },
    planCode: {
      type: String,
      required: true,
      enum: ['starter_30', 'growth_90', 'lifetime'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      index: true,
    },
    planName: {
      type: String,
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

// Compound indexes for common queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
// subscriptionId index is already defined in schema with index: true

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

