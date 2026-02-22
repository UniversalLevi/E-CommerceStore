import mongoose, { Document, Schema } from 'mongoose';

export interface IPlugin extends Document {
  slug: string;
  name: string;
  description: string;
  category: 'marketing' | 'payments' | 'social' | 'conversion' | 'products';
  icon: string;
  isActive: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const pluginSchema = new Schema<IPlugin>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['marketing', 'payments', 'social', 'conversion', 'products'],
      required: true,
    },
    icon: {
      type: String,
      default: 'Puzzle',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
  },
  { timestamps: true }
);

export const Plugin = mongoose.model<IPlugin>('Plugin', pluginSchema);
