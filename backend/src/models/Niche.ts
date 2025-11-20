import mongoose, { Document, Schema } from 'mongoose';

export interface INiche extends Document {
  name: string;
  slug: string;
  description?: string;
  richDescription?: string;
  image?: string;
  icon?: string;
  active: boolean;
  featured: boolean;
  showOnHomePage: boolean;
  order: number;
  priority: number;
  isDefault: boolean;
  deleted: boolean;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  deletedReason?: string;
  synonyms: string[];
  metaTitle?: string;
  metaDescription?: string;
  themeColor?: string;
  textColor?: string;
  defaultSortMode: 'popularity' | 'newest' | 'price_low_to_high' | 'price_high_to_low';
  activeProductCount: number;
  totalProductCount: number;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const nicheSchema = new Schema<INiche>(
  {
    name: {
      type: String,
      required: [true, 'Niche name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Niche slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    richDescription: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [10, 'Icon cannot exceed 10 characters'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    showOnHomePage: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order cannot be negative'],
    },
    priority: {
      type: Number,
      default: 0,
      min: [0, 'Priority cannot be negative'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Deleted reason cannot exceed 500 characters'],
    },
    synonyms: {
      type: [String],
      default: [],
    },
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters'],
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    themeColor: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Theme color must be a valid hex color'],
    },
    textColor: {
      type: String,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Text color must be a valid hex color'],
    },
    defaultSortMode: {
      type: String,
      enum: ['popularity', 'newest', 'price_low_to_high', 'price_high_to_low'],
      default: 'newest',
    },
    activeProductCount: {
      type: Number,
      default: 0,
      min: [0, 'Product count cannot be negative'],
    },
    totalProductCount: {
      type: Number,
      default: 0,
      min: [0, 'Product count cannot be negative'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
nicheSchema.index({ active: 1, deleted: 1, order: 1 });
nicheSchema.index({ featured: 1, active: 1, deleted: 1 });
nicheSchema.index({ showOnHomePage: 1, active: 1, deleted: 1 });
nicheSchema.index({ priority: -1, active: 1, deleted: 1 });
nicheSchema.index({ synonyms: 'text' });
// Text index for search
nicheSchema.index({ name: 'text', description: 'text', synonyms: 'text' });

// Virtual fields (for backward compatibility)
nicheSchema.virtual('productCount').get(function () {
  return this.activeProductCount;
});

nicheSchema.virtual('hiddenProductCount').get(function () {
  return this.totalProductCount;
});

// Ensure virtuals are included in JSON
nicheSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    // Exclude hiddenProductCount for non-admin users (handled in controller)
    if ('__v' in ret) {
      delete (ret as any).__v;
    }
    return ret;
  },
});

// Static method to generate slug from name
nicheSchema.statics.generateSlug = function (name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Instance method to update product counts
nicheSchema.methods.updateProductCounts = async function () {
  const Product = mongoose.model('Product');
  
  const activeCount = await Product.countDocuments({
    niche: this._id,
    active: true,
  });
  
  const totalCount = await Product.countDocuments({
    niche: this._id,
  });
  
  this.activeProductCount = activeCount;
  this.totalProductCount = totalCount;
  await this.save();
  
  return { activeProductCount: activeCount, totalProductCount: totalCount };
};

// Pre-save hook: Auto-generate slug, set defaults, protect default niche
nicheSchema.pre('save', async function (next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.name) {
    const Niche = mongoose.model('Niche');
    this.slug = (Niche as any).generateSlug(this.name);
  }
  
  // Set meta defaults if not provided
  if (!this.metaTitle && this.name) {
    this.metaTitle = this.name;
  }
  if (!this.metaDescription && this.description) {
    this.metaDescription = this.description;
  }
  
  // Protect default niche from modifications (but allow initial creation)
  if (!this.isNew && this.isModified() && this.isDefault) {
    const modifiedFields = this.modifiedPaths();
    const protectedFields = ['name', 'slug', 'active', 'deleted'];
    
    for (const field of protectedFields) {
      if (modifiedFields.includes(field)) {
        return next(new Error(`Cannot modify ${field} of default niche`));
      }
    }
  }
  
  next();
});

// Pre-update hook: Enforce slug change prevention and last active niche protection
nicheSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  const query = this.getQuery();
  
  // Find the existing niche
  const Niche = mongoose.model('Niche');
  const existing = await Niche.findById(query._id || query);
  
  if (!existing) {
    return next();
  }
  
  // Prevent slug change if products exist
  if (update.slug && update.slug !== existing.slug && existing.totalProductCount > 0) {
    return next(new Error('Cannot change slug when products exist'));
  }
  
  // Prevent deleting last active niche (except default)
  if (update.deleted === true && !existing.isDefault) {
    const activeCount = await Niche.countDocuments({
      active: true,
      deleted: false,
      _id: { $ne: existing._id },
    });
    
    if (activeCount === 0) {
      return next(new Error('Cannot delete last active niche. At least one active niche must exist.'));
    }
  }
  
  // Protect default niche
  if (existing.isDefault) {
    const protectedFields = ['name', 'slug', 'active', 'deleted', 'isDefault'];
    for (const field of protectedFields) {
      if (update[field] !== undefined && update[field] !== existing[field]) {
        return next(new Error(`Cannot modify ${field} of default niche`));
      }
    }
  }
  
  next();
});

// Query helpers - properly typed
interface NicheQueryHelpers {
  findActive(): mongoose.Query<any, INiche>;
  findFeatured(): mongoose.Query<any, INiche>;
  findBySlug(slug: string): mongoose.Query<any, INiche>;
  findDefault(): mongoose.Query<any, INiche>;
}

(nicheSchema.query as any).findActive = function (this: mongoose.Query<any, INiche>) {
  return this.where({ active: true, deleted: false });
};

(nicheSchema.query as any).findFeatured = function (this: mongoose.Query<any, INiche>) {
  return this.where({ featured: true, active: true, deleted: false });
};

(nicheSchema.query as any).findBySlug = function (this: mongoose.Query<any, INiche>, slug: string) {
  return this.where({ slug: slug.toLowerCase(), active: true, deleted: false });
};

(nicheSchema.query as any).findDefault = function (this: mongoose.Query<any, INiche>) {
  return this.where({ isDefault: true });
};

export const Niche = mongoose.model<INiche>('Niche', nicheSchema);




