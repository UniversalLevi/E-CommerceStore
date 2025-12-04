import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailTemplate extends Document {
  name: string;
  subject: string;
  htmlContent: string;
  plainTextContent?: string;
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      trim: true,
    },
    htmlContent: {
      type: String,
      required: [true, 'HTML content is required'],
    },
    plainTextContent: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default template
emailTemplateSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('EmailTemplate').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Indexes
emailTemplateSchema.index({ createdBy: 1 });
emailTemplateSchema.index({ isDefault: 1 });

export const EmailTemplate = mongoose.model<IEmailTemplate>('EmailTemplate', emailTemplateSchema);

