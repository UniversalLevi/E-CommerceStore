import mongoose, { Document, Schema } from 'mongoose';

export interface IStorePage extends Document {
  storeId: mongoose.Types.ObjectId;
  slug: string;
  title: string;
  body: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const storePageSchema = new Schema<IStorePage>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

storePageSchema.index({ storeId: 1, slug: 1 }, { unique: true });
storePageSchema.index({ storeId: 1, isPublished: 1, sortOrder: 1 });

export const StorePage = mongoose.model<IStorePage>('StorePage', storePageSchema);
