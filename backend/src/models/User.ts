import mongoose, { Document, Schema } from 'mongoose';

export interface IStore {
  storeUrl: string;
  productId: mongoose.Types.ObjectId;
  productName?: string;
  createdAt: Date;
}

export interface IUser extends Document {
  name?: string;
  email?: string;
  mobile?: string;
  country?: string;
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
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  pendingEmail?: string;
  // Subscription fields
  plan: string | null;
  planExpiresAt: Date | null;
  isLifetime: boolean;
  productsAdded: number;
  hasUsedTrial: boolean; // Track if user has ever used a trial
  // Onboarding fields for AI features
  onboarding?: {
    nicheId: mongoose.Types.ObjectId;
    goal: 'dropship' | 'brand' | 'start_small';
    answeredAt: Date;
  };
  // Email linking for mobile-only accounts
  emailLinkedAt?: Date;
  emailLinkReminderSent?: boolean;
  // Mobile linking for email-only accounts
  mobileLinkedAt?: Date;
  mobileLinkReminderSent?: boolean;
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
    name: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow multiple null values
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    mobile: {
      type: String,
      required: false,
      unique: true,
      sparse: true, // Allow multiple null values
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid mobile number'],
    },
    country: {
      type: String,
      required: false,
      trim: true,
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
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
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
    hasUsedTrial: {
      type: Boolean,
      default: false,
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
    // Email linking for mobile-only accounts
    emailLinkedAt: {
      type: Date,
    },
    emailLinkReminderSent: {
      type: Boolean,
      default: false,
    },
    // Mobile linking for email-only accounts
    mobileLinkedAt: {
      type: Date,
    },
    mobileLinkReminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add validation to ensure at least email or mobile is provided
userSchema.pre('validate', function (next) {
  if (!this.email && !this.mobile) {
    this.invalidate('email', 'Either email or mobile number is required');
    this.invalidate('mobile', 'Either email or mobile number is required');
  }
  next();
});

// Note: Sparse unique indexes for email and mobile are defined in the schema itself
// with { unique: true, sparse: true } - no need for additional index() calls

// Helper functions for subscription status
export function getSubscriptionStatus(user: IUser): 'active' | 'expired' | 'none' {
  if (user.isLifetime) return 'active';
  if (!user.plan || !user.planExpiresAt) return 'none';
  return user.planExpiresAt > new Date() ? 'active' : 'expired';
}

export const User = mongoose.model<IUser>('User', userSchema);

