import mongoose, { Document, Schema } from 'mongoose';

export interface IInternalStoreTheme extends Document {
  name: string; // Unique theme identifier
  displayName: string;
  description: string;
  category: 'modern' | 'classic' | 'minimal' | 'premium' | 'custom';
  thumbnail?: string; // URL to thumbnail image
  author: mongoose.Types.ObjectId; // Admin user who created it
  version: string;
  components: {
    Header?: string; // Component file path or content
    Footer?: string;
    Hero?: string;
    ProductCard?: string;
    ProductGrid?: string;
    ProductDetail?: string;
    Cart?: string;
    Checkout?: string;
    About?: string;
    Contact?: string;
    Home?: string;
    styles?: string; // CSS content
    config?: string; // Config file content
  };
  config: {
    colors: Record<string, string>;
    typography: Record<string, string>;
    layout: Record<string, any>;
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const internalStoreThemeSchema = new Schema<IInternalStoreTheme>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Theme name can only contain lowercase letters, numbers, and hyphens'],
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Display name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      enum: ['modern', 'classic', 'minimal', 'premium', 'custom'],
      required: true,
      index: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
    },
    components: {
      type: Schema.Types.Mixed,
      default: {},
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
internalStoreThemeSchema.index({ category: 1, isActive: 1 });
internalStoreThemeSchema.index({ author: 1, createdAt: -1 });

export const InternalStoreTheme = mongoose.model<IInternalStoreTheme>(
  'InternalStoreTheme',
  internalStoreThemeSchema
);
