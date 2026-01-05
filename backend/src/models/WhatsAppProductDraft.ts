import mongoose, { Document, Schema } from 'mongoose';

export type DraftStatus = 'incoming' | 'enriched' | 'approved' | 'rejected';

export interface IWhatsAppProductDraft extends Document {
  whatsapp_message_id: string;
  original_image_url: string;
  generated_image_urls: string[];
  images_ai_generated: boolean;
  original_name: string;
  ai_name: string;
  cost_price: number;
  profit_margin: number;
  shipping_fee: number;
  final_price: number;
  ai_description: string;
  description_source: 'ai_whatsapp_intake';
  detected_niche: mongoose.Types.ObjectId;
  status: DraftStatus;
  needs_review: boolean;
  error_log: string[];
  createdAt: Date;
  updatedAt: Date;
}

const whatsAppProductDraftSchema = new Schema<IWhatsAppProductDraft>(
  {
    whatsapp_message_id: {
      type: String,
      required: [true, 'WhatsApp message ID is required'],
      unique: true,
      index: true,
    },
    original_image_url: {
      type: String,
      required: [true, 'Original image URL is required'],
    },
    generated_image_urls: {
      type: [String],
      default: [],
    },
    images_ai_generated: {
      type: Boolean,
      default: false,
    },
    original_name: {
      type: String,
      required: [true, 'Original product name is required'],
      trim: true,
    },
    ai_name: {
      type: String,
      trim: true,
      default: '',
    },
    cost_price: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    profit_margin: {
      type: Number,
      default: 0,
      min: [0, 'Profit margin cannot be negative'],
    },
    shipping_fee: {
      type: Number,
      default: 80, // Fixed ₹80 shipping
      min: [0, 'Shipping fee cannot be negative'],
    },
    final_price: {
      type: Number,
      default: 0,
      min: [0, 'Final price cannot be negative'],
    },
    ai_description: {
      type: String,
      default: '',
    },
    description_source: {
      type: String,
      enum: ['ai_whatsapp_intake'],
      default: 'ai_whatsapp_intake',
    },
    detected_niche: {
      type: Schema.Types.ObjectId,
      ref: 'Niche',
    },
    status: {
      type: String,
      enum: ['incoming', 'enriched', 'approved', 'rejected'],
      default: 'incoming',
      index: true,
    },
    needs_review: {
      type: Boolean,
      default: false,
      index: true,
    },
    error_log: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
whatsAppProductDraftSchema.index({ status: 1, createdAt: -1 });
whatsAppProductDraftSchema.index({ needs_review: 1, status: 1 });

// Pre-save hook: Calculate final price
whatsAppProductDraftSchema.pre('save', function (next) {
  if (this.cost_price !== undefined && this.profit_margin !== undefined && this.shipping_fee !== undefined) {
    this.final_price = this.cost_price + this.profit_margin + this.shipping_fee;
  }
  next();
});

export const WhatsAppProductDraft = mongoose.model<IWhatsAppProductDraft>(
  'WhatsAppProductDraft',
  whatsAppProductDraftSchema
);

