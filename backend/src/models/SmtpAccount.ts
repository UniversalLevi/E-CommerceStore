import mongoose, { Document, Schema } from 'mongoose';

export interface ISmtpAccount extends Document {
  name: string;
  smtpServer: string;
  smtpPort: number;
  useTls: boolean;
  email: string;
  password: string; // Encrypted in production
  isDefault: boolean;
  active: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const smtpAccountSchema = new Schema<ISmtpAccount>(
  {
    name: {
      type: String,
      required: [true, 'SMTP account name is required'],
      trim: true,
    },
    smtpServer: {
      type: String,
      required: [true, 'SMTP server is required'],
      trim: true,
    },
    smtpPort: {
      type: Number,
      required: [true, 'SMTP port is required'],
      min: [1, 'Port must be between 1 and 65535'],
      max: [65535, 'Port must be between 1 and 65535'],
    },
    useTls: {
      type: Boolean,
      default: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
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

// Ensure only one default account
smtpAccountSchema.pre('save', async function (next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('SmtpAccount').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Indexes
smtpAccountSchema.index({ createdBy: 1 });
smtpAccountSchema.index({ isDefault: 1 });
smtpAccountSchema.index({ active: 1 });

export const SmtpAccount = mongoose.model<ISmtpAccount>('SmtpAccount', smtpAccountSchema);

