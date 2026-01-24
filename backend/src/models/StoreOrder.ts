import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  title: string;
  variant?: string; // Variant name if applicable
  quantity: number;
  price: number; // in paise (snapshot at order time)
}

export interface IShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface ICustomer {
  name: string;
  email: string;
  phone: string;
}

export interface IOrderNote {
  text: string;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IStoreOrder extends Document {
  storeId: mongoose.Types.ObjectId;
  orderId: string; // Unique, auto-generated (e.g., 'ORD-20250101-001')
  customer: ICustomer;
  shippingAddress: IShippingAddress;
  items: IOrderItem[]; // Snapshot of products at order time
  subtotal: number; // in paise
  shipping: number; // in paise
  total: number; // in paise
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  fulfillmentStatus: 'pending' | 'fulfilled' | 'cancelled' | 'shipped';
  notes: IOrderNote[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreProduct',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    variant: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address1: {
      type: String,
      required: true,
      trim: true,
    },
    address2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zip: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const orderNoteSchema = new Schema<IOrderNote>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const storeOrderSchema = new Schema<IStoreOrder>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: false, // Will be auto-generated in pre-save hook
      unique: true,
      index: true,
      sparse: true, // Allow multiple null values for unique index
    },
    customer: {
      type: customerSchema,
      required: true,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v: IOrderItem[]) {
          return v.length > 0;
        },
        message: 'Order must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'fulfilled', 'cancelled', 'shipped'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: [orderNoteSchema],
      default: [],
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

// Indexes
storeOrderSchema.index({ storeId: 1, createdAt: -1 });
storeOrderSchema.index({ orderId: 1 }, { unique: true });
storeOrderSchema.index({ paymentStatus: 1 });
storeOrderSchema.index({ fulfillmentStatus: 1 });

// Pre-save hook: Generate order ID if not provided
storeOrderSchema.pre('save', async function (next) {
  // Always generate orderId if it's missing or empty
  if (!this.orderId || this.orderId.trim() === '') {
    try {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      
      // Find the last order for today to generate sequential number
      const StoreOrderModel = mongoose.model('StoreOrder');
      const lastOrder = await StoreOrderModel.findOne({
        orderId: { $regex: `^ORD-${dateStr}-` },
      }).sort({ orderId: -1 });
      
      let seq = 1;
      if (lastOrder && lastOrder.orderId) {
        const parts = lastOrder.orderId.split('-');
        if (parts.length >= 3) {
          const lastSeq = parseInt(parts[2] || '0', 10);
          seq = lastSeq + 1;
        }
      }
      
      this.orderId = `ORD-${dateStr}-${seq.toString().padStart(3, '0')}`;
    } catch (error: any) {
      // Fallback to timestamp-based ID if generation fails
      const timestamp = Date.now();
      this.orderId = `ORD-${timestamp}`;
      console.warn('Order ID generation failed, using timestamp fallback:', error);
    }
  }
  
  // Ensure orderId is always set before saving
  if (!this.orderId) {
    const timestamp = Date.now();
    this.orderId = `ORD-${timestamp}`;
  }
  
  next();
});

export const StoreOrder = mongoose.model<IStoreOrder>('StoreOrder', storeOrderSchema);
