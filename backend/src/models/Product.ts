import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  category?: string; // Keep for backward compatibility
  niche: mongoose.Types.ObjectId; // Required reference to Niche
  images: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      trim: true,
      lowercase: true,
    },
    niche: {
      type: Schema.Types.ObjectId,
      ref: 'Niche',
      required: [true, 'Product niche is required'],
      index: true,
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: 'Product must have at least one image',
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
productSchema.index({ category: 1, active: 1 });
productSchema.index({ niche: 1, active: 1 }); // Compound index for niche filtering
productSchema.index({ title: 'text', description: 'text' });

// Pre-save hook: Validate niche exists and is not deleted
productSchema.pre('save', async function (next) {
  if (this.isModified('niche') || this.isNew) {
    if (!this.niche) {
      return next(new Error('Niche is required'));
    }
    
    const Niche = mongoose.model('Niche');
    const niche = await Niche.findById(this.niche).where({ deleted: false });
    
    if (!niche) {
      return next(new Error('Niche not found or has been deleted'));
    }
    
    if (!niche.active) {
      // Allow inactive niches but log warning
      console.warn(`Product assigned to inactive niche: ${niche.name}`);
    }
  }
  next();
});

// Post-save hook: Update niche product counts
productSchema.post('save', async function () {
  if (this.niche) {
    const Niche = mongoose.model('Niche');
    const niche = await Niche.findById(this.niche);
    if (niche) {
      await (niche as any).updateProductCounts();
    }
  }
});

// Post-delete hook: Update niche product counts
productSchema.post('findOneAndDelete', async function (doc) {
  if (doc && doc.niche) {
    const Niche = mongoose.model('Niche');
    const niche = await Niche.findById(doc.niche);
    if (niche) {
      await (niche as any).updateProductCounts();
    }
  }
});

// Post-update hook: Update niche product counts (for niche changes)
productSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    const update = this.getUpdate() as any;
    const oldNiche = doc.niche;
    const newNiche = update.niche || doc.niche;
    
    const Niche = mongoose.model('Niche');
    
    // Update old niche if niche changed
    if (oldNiche && oldNiche.toString() !== newNiche?.toString()) {
      const oldNicheDoc = await Niche.findById(oldNiche);
      if (oldNicheDoc) {
        await (oldNicheDoc as any).updateProductCounts();
      }
    }
    
    // Update new niche
    if (newNiche) {
      const newNicheDoc = await Niche.findById(newNiche);
      if (newNicheDoc) {
        await (newNicheDoc as any).updateProductCounts();
      }
    }
  }
});

export const Product = mongoose.model<IProduct>('Product', productSchema);

