import mongoose, { Document, Schema } from 'mongoose';

export type ZenStatus =
  | 'shopify' // Default - not processed via ZEN
  | 'awaiting_wallet' // User clicked fulfill but insufficient balance
  | 'ready_for_fulfillment' // Wallet deducted, ready for ops
  | 'sourcing' // Ops is sourcing the product
  | 'packing' // Product being packed
  | 'ready_for_dispatch' // Packed and ready
  | 'dispatched' // Handed to courier
  | 'shipped' // In transit
  | 'out_for_delivery' // OFD
  | 'delivered' // Successfully delivered
  | 'rto_initiated' // Return to origin initiated
  | 'rto_delivered' // RTO delivered back
  | 'returned' // Returned to sender
  | 'failed'; // Failed for some reason

export interface ILineItem {
  shopifyLineItemId: number;
  title: string;
  quantity: number;
  price: number; // in paise
  variantTitle: string;
  sku: string;
  productId: number | null;
  variantId: number | null;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  provinceCode: string;
  country: string;
  countryCode: string;
  zip: string;
  phone: string;
}

export interface ICustomer {
  shopifyCustomerId: number | null;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface IInternalNote {
  note: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IOrder extends Document {
  // Shopify identifiers
  shopifyOrderId: number;
  shopifyOrderName: string; // e.g., "#1001"
  shopifyOrderNumber: number;
  storeConnectionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  // Customer info
  customer: ICustomer;
  email: string;

  // Order details
  lineItems: ILineItem[];
  shippingAddress: IShippingAddress | null;
  currency: string;
  totalPrice: number; // in paise
  subtotalPrice: number; // in paise
  totalTax: number; // in paise
  totalShipping: number; // in paise

  // Shopify statuses
  financialStatus: string;
  fulfillmentStatus: string | null;
  shopifyCreatedAt: Date;
  shopifyUpdatedAt: Date;

  // ZEN Fulfillment fields
  zenStatus: ZenStatus;
  productCost: number; // in paise - cost to source the product
  shippingCost: number; // in paise - cost to ship
  serviceFee: number; // in paise - platform fee (optional)
  walletChargeAmount: number; // in paise - total deducted from wallet
  walletChargedAt: Date | null;
  walletTransactionId: mongoose.Types.ObjectId | null;

  // Tracking & Fulfillment
  trackingNumber: string | null;
  trackingUrl: string | null;
  courierProvider: string | null;
  fulfillmentAssignedTo: mongoose.Types.ObjectId | null;

  // Internal notes
  internalNotes: IInternalNote[];
  walletShortage: number; // Amount needed if awaiting_wallet

  // Metadata
  metadata: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<ILineItem>(
  {
    shopifyLineItemId: { type: Number, required: true },
    title: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // in paise
    variantTitle: { type: String, default: '' },
    sku: { type: String, default: '' },
    productId: { type: Number, default: null },
    variantId: { type: Number, default: null },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    address1: { type: String, default: '' },
    address2: { type: String, default: '' },
    city: { type: String, default: '' },
    province: { type: String, default: '' },
    provinceCode: { type: String, default: '' },
    country: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    zip: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

const customerSchema = new Schema<ICustomer>(
  {
    shopifyCustomerId: { type: Number, default: null },
    email: { type: String, default: '' },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

const internalNoteSchema = new Schema<IInternalNote>(
  {
    note: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    // Shopify identifiers
    shopifyOrderId: {
      type: Number,
      required: true,
      index: true,
    },
    shopifyOrderName: {
      type: String,
      required: true,
    },
    shopifyOrderNumber: {
      type: Number,
      required: true,
    },
    storeConnectionId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreConnection',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Customer info
    customer: {
      type: customerSchema,
      default: () => ({}),
    },
    email: {
      type: String,
      default: '',
      index: true,
    },

    // Order details
    lineItems: {
      type: [lineItemSchema],
      default: [],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      default: null,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    subtotalPrice: {
      type: Number,
      default: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalShipping: {
      type: Number,
      default: 0,
    },

    // Shopify statuses
    financialStatus: {
      type: String,
      default: 'pending',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      default: null,
      index: true,
    },
    shopifyCreatedAt: {
      type: Date,
      required: true,
    },
    shopifyUpdatedAt: {
      type: Date,
      required: true,
    },

    // ZEN Fulfillment fields
    zenStatus: {
      type: String,
      enum: [
        'shopify',
        'awaiting_wallet',
        'ready_for_fulfillment',
        'sourcing',
        'packing',
        'ready_for_dispatch',
        'dispatched',
        'shipped',
        'out_for_delivery',
        'delivered',
        'rto_initiated',
        'rto_delivered',
        'returned',
        'failed',
      ],
      default: 'shopify',
      index: true,
    },
    productCost: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    walletChargeAmount: {
      type: Number,
      default: 0,
    },
    walletChargedAt: {
      type: Date,
      default: null,
    },
    walletTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'WalletTransaction',
      default: null,
    },

    // Tracking & Fulfillment
    trackingNumber: {
      type: String,
      default: null,
    },
    trackingUrl: {
      type: String,
      default: null,
    },
    courierProvider: {
      type: String,
      default: null,
    },
    fulfillmentAssignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Internal notes
    internalNotes: {
      type: [internalNoteSchema],
      default: [],
    },
    walletShortage: {
      type: Number,
      default: 0,
    },

    // Metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
orderSchema.index({ storeConnectionId: 1, shopifyOrderId: 1 }, { unique: true });
orderSchema.index({ userId: 1, zenStatus: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ zenStatus: 1, createdAt: -1 });
orderSchema.index({ userId: 1, zenStatus: 1, walletShortage: 1 }); // For auto-resume queries

// Virtual for full customer name
orderSchema.virtual('customerFullName').get(function () {
  const { firstName, lastName } = this.customer || {};
  return `${firstName || ''} ${lastName || ''}`.trim() || 'Guest';
});

// Virtual for formatted shipping address
orderSchema.virtual('formattedShippingAddress').get(function () {
  if (!this.shippingAddress) return null;
  const addr = this.shippingAddress;
  return [addr.address1, addr.address2, addr.city, addr.province, addr.zip, addr.country]
    .filter(Boolean)
    .join(', ');
});

// Helper to calculate required wallet amount
orderSchema.methods.getRequiredWalletAmount = function (): number {
  return this.productCost + this.shippingCost + this.serviceFee;
};

export const Order = mongoose.model<IOrder>('Order', orderSchema);

