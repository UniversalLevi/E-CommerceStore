import mongoose, { Schema, Document } from 'mongoose';

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

const MentorshipApplicationSchema = new Schema<IMentorshipApplication>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, index: true },
    incomeGoal: { type: String },
    businessStage: { type: String },
    whyMentorship: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending',
    },
    adminNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Note: email and status simple indexes already defined in schema with { index: true }
MentorshipApplicationSchema.index({ createdAt: -1 });

export default mongoose.models.MentorshipApplication ||
  mongoose.model<IMentorshipApplication>('MentorshipApplication', MentorshipApplicationSchema);

