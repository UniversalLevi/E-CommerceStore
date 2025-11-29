import mongoose, { Schema, Document } from 'mongoose';

export interface IContentLibrary extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'hook' | 'caption' | 'script' | 'creative_idea' | 'image';
  title?: string;
  content: string;
  metadata?: Record<string, any>;
  imagePath?: string;
  source: 'ai_generated' | 'trending' | 'daily_ideas' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

const ContentLibrarySchema = new Schema<IContentLibrary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['hook', 'caption', 'script', 'creative_idea', 'image'],
      required: true,
    },
    title: { type: String },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    imagePath: { type: String },
    source: {
      type: String,
      enum: ['ai_generated', 'trending', 'daily_ideas', 'manual'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

ContentLibrarySchema.index({ userId: 1, type: 1 });
ContentLibrarySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ContentLibrary || mongoose.model<IContentLibrary>('ContentLibrary', ContentLibrarySchema);

