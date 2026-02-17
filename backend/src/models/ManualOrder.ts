import mongoose, { Document, Schema } from 'mongoose';

export interface IManualOrderCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface IManualOrderShippingAddress {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export interface IManualOrderItem {
  productId?: mongoose.Types.ObjectId | null;
  title: string;
  quantity: number;
  price: number; // in paise (snapshot at order time)
}

export interface IManualOrderNote {
  text: string;
  addedBy: mongoose.Types.ObjectId;
  addedAt: Date;
}

export type ManualOrderStatus = 'draft' | 'pending' | 'paid' | 'fulfilled' | 'cancelled';

export interface IManualOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string;
  customer: IManualOrderCustomer;
  shippingAddress: IManualOrderShippingAddress;
  items: IManualOrderItem[];
  subtotal: number; // in paise
  shipping: number; // in paise
  total: number; // in paise
  currency: string;
  status: ManualOrderStatus;
  notes: IManualOrderNote[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<IManualOrderCustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IManualOrderShippingAddress>(
  {
    name: { type: String, required: true, trim: true },
    address1: { type: String, required: true, trim: true },
    address2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderItemSchema = new Schema<IManualOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: false, default: null },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderNoteSchema = new Schema<IManualOrderNote>(
  {
    text: { type: String, required: true, trim: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const manualOrderSchema = new Schema<IManualOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    customer: { type: customerSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(v: IManualOrderItem[]) => v && v.length > 0, 'At least one item required'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', uppercase: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'paid', 'fulfilled', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: { type: [orderNoteSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

manualOrderSchema.index({ userId: 1, createdAt: -1 });
manualOrderSchema.index({ userId: 1, status: 1 });

manualOrderSchema.pre('save', async function (next) {
  if (!this.orderId || this.orderId.trim() === '') {
    try {
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

      const ManualOrderModel = mongoose.model('ManualOrder');
      const lastOrder = await ManualOrderModel.findOne({
        orderId: { $regex: `^MO-${dateStr}-` },
      }).sort({ orderId: -1 });

      let seq = 1;
      if (lastOrder && lastOrder.orderId) {
        const parts = lastOrder.orderId.split('-');
        if (parts.length >= 3) {
          const lastSeq = parseInt(parts[2] || '0', 10);
          seq = lastSeq + 1;
        }
      }

      this.orderId = `MO-${dateStr}-${seq.toString().padStart(3, '0')}`;
    } catch (error: any) {
      const timestamp = Date.now();
      this.orderId = `MO-${timestamp}`;
      console.warn('Manual order ID generation failed, using fallback:', error);
    }
  }
  if (!this.orderId) {
    this.orderId = `MO-${Date.now()}`;
  }
  next();
});

export const ManualOrder = mongoose.model<IManualOrder>('ManualOrder', manualOrderSchema);
