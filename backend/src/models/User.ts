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
  },
  {
    timestamps: true,
  }
);

// Index is already defined in schema with unique: true, removing duplicate
// userSchema.index({ email: 1 }); // REMOVED - causing duplicate index warning

export const User = mongoose.model<IUser>('User', userSchema);

