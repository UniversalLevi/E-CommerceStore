import mongoose, { Document, Schema } from 'mongoose';

export interface IVariant {
  name: string; // e.g., 'S', 'M', 'L' or 'Red', 'Blue'
  price?: number; // Optional, defaults to basePrice (in paise)
  inventory?: number | null; // null = infinite stock
}

export interface IStoreProduct extends Document {
  storeId: mongoose.Types.ObjectId;
  title: string;
  description?: string; // Rich text support
  basePrice: number; // in paise
  status: 'draft' | 'active';
  images: string[]; // Max 5 URLs
  variantDimension?: string; // Single dimension name (e.g., 'Size', 'Color')
  variants: IVariant[]; // Variant values with inventory
  inventoryTracking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    inventory: {
      type: Number,
      min: 0,
      default: null, // null = infinite
    },
  },
  { _id: false }
);

const storeProductSchema = new Schema<IStoreProduct>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['draft', 'active'],
      default: 'draft',
      index: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5;
        },
        message: 'Maximum 5 images allowed per product',
      },
    },
    variantDimension: {
      type: String,
      trim: true,
      maxlength: [50, 'Variant dimension name cannot exceed 50 characters'],
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    inventoryTracking: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
storeProductSchema.index({ storeId: 1, status: 1 });
storeProductSchema.index({ storeId: 1, createdAt: -1 });

// Validation: Max 1 variant dimension (enforced in schema)
storeProductSchema.pre('save', function (next) {
  if (this.variantDimension && this.variants.length > 0) {
    // Ensure all variants have the dimension name
    this.variants.forEach((variant) => {
      if (!variant.name) {
        return next(new Error('All variants must have a name'));
      }
    });
  }
  next();
});

export const StoreProduct = mongoose.model<IStoreProduct>('StoreProduct', storeProductSchema);
