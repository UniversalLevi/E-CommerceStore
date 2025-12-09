import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  slug: string; // Folder name in filesystem
  description: string;
  previewImage: string; // URL to preview image
  category: 'minimal' | 'modern' | 'luxury' | 'bold' | 'custom';
  isActive: boolean; // Whether users can select it
  isDeleted: boolean; // Soft delete flag
  createdBy: mongoose.Types.ObjectId;
  appliedCount: number; // Track how many times template was applied
  metadata: Record<string, any>; // Additional metadata
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      maxlength: [100, 'Template name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Template slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      required: [true, 'Template description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    previewImage: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['minimal', 'modern', 'luxury', 'bold', 'custom'],
      default: 'custom',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appliedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
templateSchema.index({ isActive: 1, isDeleted: 1 });
templateSchema.index({ category: 1, isActive: 1 });
templateSchema.index({ createdBy: 1 });

// Virtual for getting the template folder path
templateSchema.virtual('folderPath').get(function () {
  return `templates/${this.slug}`;
});

// Ensure virtuals are included in JSON output
templateSchema.set('toJSON', { virtuals: true });
templateSchema.set('toObject', { virtuals: true });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);

