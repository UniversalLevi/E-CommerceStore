import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  recipient: string;
  subject: string;
  smtpAccountId: mongoose.Types.ObjectId;
  templateId?: mongoose.Types.ObjectId;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: Date;
  sentBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    recipient: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    smtpAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'SmtpAccount',
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
      index: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    sentAt: {
      type: Date,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes (simple indexes already defined in schema)
emailLogSchema.index({ sentBy: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
// Note: recipient index already defined in schema with { index: true }

export const EmailLog = mongoose.model<IEmailLog>('EmailLog', emailLogSchema);

