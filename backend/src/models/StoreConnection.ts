import mongoose, { Document, Schema } from 'mongoose';

/**
 * @deprecated This model is deprecated. StoreConnection was used for Shopify store connections.
 * Existing records are preserved for data integrity but should not be used for new connections.
 * Use the internal Store model instead.
 */
export interface IStoreConnection extends Document {
  owner: mongoose.Types.ObjectId;
  storeName: string;
  shopDomain: string;
  apiKey?: string; // encrypted
  apiSecret?: string; // encrypted
  accessToken: string; // encrypted
  scopes: string[];
  environment: 'development' | 'production';
  apiVersion: string;
  isDefault: boolean;
  status: 'active' | 'invalid' | 'revoked';
  lastTestedAt?: Date;
  lastTestResult?: string;
  metadata: Record<string, any>;
  deprecated: boolean; // Mark as deprecated
  createdAt: Date;
  updatedAt: Date;
}

const storeConnectionSchema = new Schema<IStoreConnection>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    shopDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    apiKey: {
      type: String,
      // Encrypted - optional
    },
    apiSecret: {
      type: String,
      // Encrypted - optional
    },
    accessToken: {
      type: String,
      required: true,
      // Encrypted
    },
    scopes: {
      type: [String],
      default: [],
    },
    environment: {
      type: String,
      enum: ['development', 'production'],
      default: 'production',
    },
    apiVersion: {
      type: String,
      default: '2024-01',
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'invalid', 'revoked'],
      default: 'active',
      index: true,
    },
    lastTestedAt: {
      type: Date,
    },
    lastTestResult: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    deprecated: {
      type: Boolean,
      default: true, // All existing records are deprecated
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
storeConnectionSchema.index({ owner: 1, isDefault: 1 });
storeConnectionSchema.index({ owner: 1, status: 1 });

export const StoreConnection = mongoose.model<IStoreConnection>(
  'StoreConnection',
  storeConnectionSchema
);



