import mongoose, { Document, Schema } from 'mongoose';

export interface IProductReview extends Document {
  storeId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  authorName: string;
  authorEmail: string;
  rating: number;
  title?: string;
  body?: string;
  status: 'pending' | 'approved' | 'rejected';
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productReviewSchema = new Schema<IProductReview>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreProduct',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productReviewSchema.index({ storeId: 1, productId: 1, status: 1 });
productReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

export const ProductReview = mongoose.model<IProductReview>('ProductReview', productReviewSchema);
