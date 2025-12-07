import mongoose, { Document, Schema } from 'mongoose';

export interface ICallLog extends Document {
  calledBy: mongoose.Types.ObjectId; // Admin who made the call
  calledTo: mongoose.Types.ObjectId; // User who was called
  result: 'positive' | 'negative' | 'custom';
  customResult?: string; // Custom result text if result is 'custom'
  notes?: string; // Additional notes about the conversation
  callDuration?: number; // Duration in seconds (optional)
  createdAt: Date;
  updatedAt: Date;
}

const callLogSchema = new Schema<ICallLog>(
  {
    calledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    calledTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    result: {
      type: String,
      enum: ['positive', 'negative', 'custom'],
      required: true,
      index: true,
    },
    customResult: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    callDuration: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
callLogSchema.index({ calledTo: 1, createdAt: -1 });
callLogSchema.index({ calledBy: 1, createdAt: -1 });
callLogSchema.index({ result: 1, createdAt: -1 });

export const CallLog = mongoose.model<ICallLog>('CallLog', callLogSchema);

