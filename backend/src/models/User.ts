import mongoose, { Document, Schema } from 'mongoose';

export interface IStore {
  storeUrl: string;
  productId: mongoose.Types.ObjectId;
  productName?: string;
  createdAt: Date;
}

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'user' | 'admin';
  shopifyAccessToken?: string;
  shopifyShop?: string;
  stores: IStore[];
  isActive: boolean;
  lastLogin?: Date;
  deletedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  passwordChangedAt?: Date;
  // Subscription fields
  plan: string | null;
  planExpiresAt: Date | null;
  isLifetime: boolean;
  productsAdded: number;
  // Onboarding fields for AI features
  onboarding?: {
    nicheId: mongoose.Types.ObjectId;
    goal: 'dropship' | 'brand' | 'start_small';
    answeredAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>({
  storeUrl: {
    type: String,
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    shopifyAccessToken: {
      type: String,
      default: undefined,
    },
    shopifyShop: {
      type: String,
      default: undefined,
    },
    stores: [storeSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLogin: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    // Subscription fields
    plan: {
      type: String,
      default: null,
      enum: [null, 'starter_30', 'growth_90', 'lifetime'],
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    isLifetime: {
      type: Boolean,
      default: false,
    },
    productsAdded: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    // Onboarding fields for AI features
    onboarding: {
      nicheId: {
        type: Schema.Types.ObjectId,
        ref: 'Niche',
      },
      goal: {
        type: String,
        enum: ['dropship', 'brand', 'start_small'],
      },
      answeredAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index is already defined in schema with unique: true, removing duplicate
// userSchema.index({ email: 1 }); // REMOVED - causing duplicate index warning

// Helper functions for subscription status
export function getSubscriptionStatus(user: IUser): 'active' | 'expired' | 'none' {
  if (user.isLifetime) return 'active';
  if (!user.plan || !user.planExpiresAt) return 'none';
  return user.planExpiresAt > new Date() ? 'active' : 'expired';
}

export const User = mongoose.model<IUser>('User', userSchema);

