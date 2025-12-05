import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  storeConnectionId: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId; // Store owner
  shopifyCustomerId: string; // Shopify customer ID
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  acceptsMarketing: boolean;
  totalSpent: number;
  totalOrders: number;
  tags: string[];
  address?: {
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  };
  metadata: Record<string, any>;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    storeConnectionId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreConnection',
      required: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shopifyCustomerId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    acceptsMarketing: {
      type: Boolean,
      default: false,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    address: {
      address1: String,
      address2: String,
      city: String,
      province: String,
      country: String,
      zip: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
customerSchema.index({ storeConnectionId: 1, shopifyCustomerId: 1 }, { unique: true });
customerSchema.index({ owner: 1, email: 1 });
customerSchema.index({ owner: 1, phone: 1 });
customerSchema.index({ storeConnectionId: 1, email: 1 });
customerSchema.index({ storeConnectionId: 1, phone: 1 });
customerSchema.index({ acceptsMarketing: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

