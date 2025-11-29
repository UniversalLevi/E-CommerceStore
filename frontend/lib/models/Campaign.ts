import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  platform: 'instagram' | 'facebook';
  campaignGoal?: string;
  dailyBudget?: number;
  country?: string;
  ageRange?: {
    min: number;
    max: number;
  };
  gender?: string;
  productName?: string;
  interests?: string[];
  creative?: {
    imageUrl?: string;
    videoUrl?: string;
    imagePath?: string;
    videoPath?: string;
  };
  captions?: string[];
  hashtags?: string[];
  ctaRecommendations?: string[];
  targeting?: Record<string, any>;
  performancePredictions?: Record<string, any>;
  exportData?: Record<string, any>;
  status: 'draft' | 'saved';
  customAudienceFile?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['instagram', 'facebook'], required: true },
    campaignGoal: { type: String },
    dailyBudget: { type: Number },
    country: { type: String },
    ageRange: {
      min: { type: Number },
      max: { type: Number },
    },
    gender: { type: String },
    productName: { type: String },
    interests: [{ type: String }],
    creative: {
      imageUrl: { type: String },
      videoUrl: { type: String },
      imagePath: { type: String },
      videoPath: { type: String },
    },
    captions: [{ type: String }],
    hashtags: [{ type: String }],
    ctaRecommendations: [{ type: String }],
    targeting: { type: Schema.Types.Mixed },
    performancePredictions: { type: Schema.Types.Mixed },
    exportData: { type: Schema.Types.Mixed },
    status: { type: String, enum: ['draft', 'saved'], default: 'draft' },
    customAudienceFile: { type: String },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ userId: 1, platform: 1 });
CampaignSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

