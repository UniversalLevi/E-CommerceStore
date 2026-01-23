import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  slug: string; // URL-safe, unique, used for subdomain
  currency: string; // Locked after creation
  status: 'inactive' | 'active' | 'suspended';
  razorpayAccountId?: string; // Razorpay account ID when connected
  razorpayAccountStatus: 'not_connected' | 'pending' | 'active' | 'rejected';
  customDomain?: string; // Future use, stored but not active
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One store per user
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      maxlength: [100, 'Store name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Store slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
      minlength: [3, 'Slug must be at least 3 characters'],
      maxlength: [50, 'Slug cannot exceed 50 characters'],
      index: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
      enum: ['INR', 'USD', 'EUR', 'GBP'], // Add more as needed
    },
    status: {
      type: String,
      enum: ['inactive', 'active', 'suspended'],
      default: 'inactive',
      index: true,
    },
    razorpayAccountId: {
      type: String,
      default: undefined,
    },
    razorpayAccountStatus: {
      type: String,
      enum: ['not_connected', 'pending', 'active', 'rejected'],
      default: 'not_connected',
    },
    customDomain: {
      type: String,
      default: undefined,
      trim: true,
      lowercase: true,
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
storeSchema.index({ owner: 1 }, { unique: true });
storeSchema.index({ slug: 1 }, { unique: true });
storeSchema.index({ status: 1 });

// Pre-save hook: Ensure slug is URL-safe
storeSchema.pre('save', function (next) {
  if (this.isModified('slug')) {
    // Remove any invalid characters and convert to lowercase
    this.slug = this.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

export const Store = mongoose.model<IStore>('Store', storeSchema);
