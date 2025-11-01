import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthMetadata {
  scopes: string[];
  tokenType: string;
  expiresAt?: Date;
}

export interface IRateLimitMeta {
  callsUsed: number;
  callsMax: number;
  resetAt: Date;
}

export interface IConnectedStore extends Document {
  userId: mongoose.Types.ObjectId;
  storeName: string;
  platform: 'shopify' | 'woocommerce' | 'etsy';
  storeDomain: string;
  encryptedCredentials: string;
  encryptionVersion: number;
  oauthMetadata: IOAuthMetadata;
  webhookSecret?: string;
  hmacSecret?: string;
  status: 'connected' | 'inactive' | 'revoked' | 'expired';
  platformMetadata?: Record<string, any>;
  lastActivityAt?: Date;
  lastSyncAt?: Date;
  tokenExpiresAt?: Date;
  rateLimitMeta?: IRateLimitMeta;
  createdAt: Date;
  updatedAt: Date;
}

const oauthMetadataSchema = new Schema<IOAuthMetadata>({
  scopes: {
    type: [String],
    required: true,
  },
  tokenType: {
    type: String,
    default: 'bearer',
  },
  expiresAt: {
    type: Date,
  },
}, { _id: false });

const rateLimitMetaSchema = new Schema<IRateLimitMeta>({
  callsUsed: {
    type: Number,
    default: 0,
  },
  callsMax: {
    type: Number,
    default: 40,
  },
  resetAt: {
    type: Date,
    default: () => new Date(Date.now() + 60 * 1000),
  },
}, { _id: false });

const connectedStoreSchema = new Schema<IConnectedStore>(
  {
    userId: {
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
    platform: {
      type: String,
      enum: ['shopify', 'woocommerce', 'etsy'],
      required: true,
      default: 'shopify',
    },
    storeDomain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    encryptedCredentials: {
      type: String,
      required: true,
    },
    encryptionVersion: {
      type: Number,
      default: 1,
    },
    oauthMetadata: {
      type: oauthMetadataSchema,
      required: true,
    },
    webhookSecret: {
      type: String,
    },
    hmacSecret: {
      type: String,
    },
    status: {
      type: String,
      enum: ['connected', 'inactive', 'revoked', 'expired'],
      default: 'connected',
      index: true,
    },
    platformMetadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastActivityAt: {
      type: Date,
    },
    lastSyncAt: {
      type: Date,
    },
    tokenExpiresAt: {
      type: Date,
      index: true,
    },
    rateLimitMeta: {
      type: rateLimitMetaSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
connectedStoreSchema.index({ userId: 1, status: 1 });
connectedStoreSchema.index({ storeDomain: 1, platform: 1 });
connectedStoreSchema.index({ tokenExpiresAt: 1 }, { sparse: true });

export const ConnectedStore = mongoose.model<IConnectedStore>(
  'ConnectedStore',
  connectedStoreSchema
);

