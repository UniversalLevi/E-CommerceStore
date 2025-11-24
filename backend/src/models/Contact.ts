import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied' | 'resolved' | 'archived';
  adminReply?: string;
  repliedBy?: mongoose.Types.ObjectId;
  repliedAt?: Date;
  userId?: mongoose.Types.ObjectId; // If user is logged in
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'replied', 'resolved', 'archived'],
      default: 'pending',
      index: true,
    },
    adminReply: {
      type: String,
    },
    repliedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    repliedAt: {
      type: Date,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ userId: 1, createdAt: -1 });

export const Contact = mongoose.model<IContact>('Contact', contactSchema);

