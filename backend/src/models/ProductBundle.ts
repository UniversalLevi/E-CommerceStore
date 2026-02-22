import mongoose, { Document, Schema } from 'mongoose';

export interface IBundleProduct {
  productId: mongoose.Types.ObjectId;
  variantName?: string;
  quantity: number;
}

export interface IProductBundle extends Document {
  storeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  image?: string;
  products: IBundleProduct[];
  bundlePrice: number; // in paise (discounted price)
  originalPrice: number; // in paise (sum of individual prices)
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const bundleProductSchema = new Schema<IBundleProduct>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreProduct',
      required: true,
    },
    variantName: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const productBundleSchema = new Schema<IProductBundle>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    products: {
      type: [bundleProductSchema],
      required: true,
      validate: {
        validator: (v: IBundleProduct[]) => v.length >= 2,
        message: 'A bundle must have at least 2 products',
      },
    },
    bundlePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productBundleSchema.index({ storeId: 1, isActive: 1 });

export const ProductBundle = mongoose.model<IProductBundle>('ProductBundle', productBundleSchema);
