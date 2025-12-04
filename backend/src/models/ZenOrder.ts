import mongoose, { Document, Schema } from 'mongoose';

export type ZenOrderStatus =
  | 'pending' // Just created after wallet deduction
  | 'sourcing' // Sourcing products
  | 'sourced' // Products sourced
  | 'packing' // Being packed
  | 'packed' // Packed and ready
  | 'ready_for_dispatch' // QC passed, ready for courier
  | 'dispatched' // Handed to courier
  | 'shipped' // Courier accepted, in transit
  | 'out_for_delivery' // OFD
  | 'delivered' // Successfully delivered
  | 'rto_initiated' // Return to origin initiated
  | 'rto_delivered' // RTO completed
  | 'returned' // Returned to warehouse
  | 'cancelled' // Cancelled
  | 'failed'; // Failed

export interface IStatusHistoryEntry {
  status: ZenOrderStatus;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
  note: string;
}

export interface IVariant {
  title: string;
  sku: string;
  quantity: number;
  price: number; // in paise
}

export interface IZenOrder extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  storeConnectionId: mongoose.Types.ObjectId;

  // Display info (denormalized for quick access)
  shopifyOrderName: string;
  storeName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string; // Formatted address string

  // Product info
  sku: string; // Primary SKU or comma-separated
  variants: IVariant[];
  itemCount: number;

  // Pricing
  orderValue: number; // in paise - customer paid
  productCost: number; // in paise - cost to source
  shippingCost: number; // in paise - shipping cost
  serviceFee: number; // in paise - platform fee
  walletDeductedAmount: number; // in paise - total deducted
  profit: number; // in paise - calculated profit

  // Status
  status: ZenOrderStatus;
  statusHistory: IStatusHistoryEntry[];

  // Assignments
  assignedPicker: mongoose.Types.ObjectId | null;
  assignedPacker: mongoose.Types.ObjectId | null;
  assignedQc: mongoose.Types.ObjectId | null;
  assignedCourierPerson: mongoose.Types.ObjectId | null;

  // Tracking
  trackingNumber: string | null;
  trackingUrl: string | null;
  courierProvider: string | null;
  estimatedDeliveryDate: Date | null;
  actualDeliveryDate: Date | null;

  // RTO Address (for return to origin orders)
  rtoAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  } | null;

  // Internal notes
  internalNotes: string;
  attachments: string[]; // URLs to uploaded files

  // Flags
  isPriority: boolean;
  isDelayed: boolean;
  hasIssue: boolean;
  issueDescription: string;

  // Timestamps
  walletDeductedAt: Date;
  sourcedAt: Date | null;
  packedAt: Date | null;
  dispatchedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  addStatusChange(newStatus: ZenOrderStatus, changedBy: mongoose.Types.ObjectId, note?: string): void;
}

const statusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const variantSchema = new Schema<IVariant>(
  {
    title: { type: String, default: '' },
    sku: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const zenOrderSchema = new Schema<IZenOrder>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeConnectionId: {
      type: Schema.Types.ObjectId,
      ref: 'StoreConnection',
      required: true,
      index: true,
    },

    // Display info
    shopifyOrderName: {
      type: String,
      required: true,
    },
    storeName: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      default: 'Guest',
    },
    customerEmail: {
      type: String,
      default: '',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    shippingAddress: {
      type: String,
      default: '',
    },

    // Product info
    sku: {
      type: String,
      default: '',
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    itemCount: {
      type: Number,
      default: 0,
    },

    // Pricing
    orderValue: {
      type: Number,
      required: true,
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
    walletDeductedAmount: {
      type: Number,
      required: true,
    },
    profit: {
      type: Number,
      default: 0,
    },

    // Status
    status: {
      type: String,
      enum: [
        'pending',
        'sourcing',
        'sourced',
        'packing',
        'packed',
        'ready_for_dispatch',
        'dispatched',
        'shipped',
        'out_for_delivery',
        'delivered',
        'rto_initiated',
        'rto_delivered',
        'returned',
        'cancelled',
        'failed',
      ],
      default: 'pending',
      index: true,
    },
    statusHistory: {
      type: [statusHistoryEntrySchema],
      default: [],
    },

    // Assignments
    assignedPicker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedPacker: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedQc: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedCourierPerson: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Tracking
    trackingNumber: {
      type: String,
      default: null,
      index: true,
    },
    trackingUrl: {
      type: String,
      default: null,
    },
    courierProvider: {
      type: String,
      default: null,
    },
    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
    actualDeliveryDate: {
      type: Date,
      default: null,
    },

    // RTO Address (for return to origin orders)
    rtoAddress: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      addressLine1: { type: String, default: '' },
      addressLine2: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },

    // Internal notes
    internalNotes: {
      type: String,
      default: '',
    },
    attachments: {
      type: [String],
      default: [],
    },

    // Flags
    isPriority: {
      type: Boolean,
      default: false,
      index: true,
    },
    isDelayed: {
      type: Boolean,
      default: false,
    },
    hasIssue: {
      type: Boolean,
      default: false,
    },
    issueDescription: {
      type: String,
      default: '',
    },

    // Timestamps
    walletDeductedAt: {
      type: Date,
      required: true,
    },
    sourcedAt: {
      type: Date,
      default: null,
    },
    packedAt: {
      type: Date,
      default: null,
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
zenOrderSchema.index({ status: 1, createdAt: -1 });
zenOrderSchema.index({ userId: 1, status: 1 });
zenOrderSchema.index({ storeConnectionId: 1, status: 1 });
zenOrderSchema.index({ assignedPicker: 1, status: 1 });
zenOrderSchema.index({ assignedPacker: 1, status: 1 });
zenOrderSchema.index({ isPriority: -1, createdAt: 1 }); // Priority orders first

// Helper method to add status history entry
zenOrderSchema.methods.addStatusChange = function (
  newStatus: ZenOrderStatus,
  changedBy: mongoose.Types.ObjectId,
  note: string = ''
): void {
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    changedAt: new Date(),
    note,
  });
  this.status = newStatus;

  // Update relevant timestamps
  switch (newStatus) {
    case 'sourced':
      this.sourcedAt = new Date();
      break;
    case 'packed':
      this.packedAt = new Date();
      break;
    case 'dispatched':
      this.dispatchedAt = new Date();
      break;
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
  }
};

// Calculate profit
zenOrderSchema.pre('save', function (next) {
  this.profit = this.orderValue - this.productCost - this.shippingCost - this.serviceFee;
  next();
});

export const ZenOrder = mongoose.model<IZenOrder>('ZenOrder', zenOrderSchema);

