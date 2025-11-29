import mongoose, { Document, Schema } from 'mongoose';

export interface IMentorshipApplication extends Document {
  name: string;
  phone: string;
  email: string;
  incomeGoal?: string;
  businessStage?: string;
  whyMentorship: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mentorshipApplicationSchema = new Schema<IMentorshipApplication>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
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
    incomeGoal: {
      type: String,
    },
    businessStage: {
      type: String,
    },
    whyMentorship: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mentorshipApplicationSchema.index({ status: 1, createdAt: -1 });
mentorshipApplicationSchema.index({ email: 1, createdAt: -1 });
mentorshipApplicationSchema.index({ createdAt: -1 });

export const MentorshipApplication = mongoose.model<IMentorshipApplication>(
  'MentorshipApplication',
  mentorshipApplicationSchema
);

