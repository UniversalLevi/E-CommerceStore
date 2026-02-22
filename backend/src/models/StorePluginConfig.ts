import mongoose, { Document, Schema } from 'mongoose';

export interface IStorePluginConfig extends Document {
  storeId: mongoose.Types.ObjectId;
  pluginSlug: string;
  isConfigured: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const storePluginConfigSchema = new Schema<IStorePluginConfig>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    pluginSlug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    isConfigured: {
      type: Boolean,
      default: false,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

storePluginConfigSchema.index({ storeId: 1, pluginSlug: 1 }, { unique: true });

export const StorePluginConfig = mongoose.model<IStorePluginConfig>(
  'StorePluginConfig',
  storePluginConfigSchema
);
