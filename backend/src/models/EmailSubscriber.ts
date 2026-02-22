import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailSubscriber extends Document {
  storeId: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  source: 'popup' | 'manual';
  subscribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailSubscriberSchema = new Schema<IEmailSubscriber>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['popup', 'manual'],
      default: 'popup',
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

emailSubscriberSchema.index({ storeId: 1, email: 1 }, { unique: true });

export const EmailSubscriber = mongoose.model<IEmailSubscriber>(
  'EmailSubscriber',
  emailSubscriberSchema
);
