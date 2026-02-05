import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { StoreOrder } from '../models/StoreOrder';
import { StoreProduct } from '../models/StoreProduct';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

interface GenerateFakeOrdersBody {
  count?: number;
  minTotal?: number;
  maxTotal?: number;
  backfillDays?: number;
  markPaid?: boolean;
  markFulfilled?: boolean;
  currency?: string;
}

interface GeneratedOrderSummary {
  id: string;
  orderId: string;
  totalPrice: number;
  currency: string;
  createdAt: Date;
}

function getRandomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function getRandomDateWithinDays(backfillDays: number): Date {
  const now = new Date();
  const past = new Date(now.getTime() - backfillDays * 24 * 60 * 60 * 1000);
  const timestamp = getRandomNumber(past.getTime(), now.getTime());
  return new Date(timestamp);
}

/**
 * Auto-place (test) orders for a specific internal store
 * POST /api/auto-orders/:storeId/generate
 */
export const generateFakeOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (req.user.role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const { storeId } = req.params;
    const {
      count = 10,
      minTotal = 20,
      maxTotal = 200,
      backfillDays = 30,
      markPaid = true,
      markFulfilled = false,
      currency = 'INR',
    } = req.body as GenerateFakeOrdersBody;

    if (!storeId) {
      throw createError('Store ID is required', 400);
    }

    // Basic validation & sane limits
    if (count <= 0 || count > 500) {
      throw createError('Count must be between 1 and 500', 400);
    }

    if (minTotal <= 0 || maxTotal <= 0 || maxTotal < minTotal) {
      throw createError('Invalid min/max total values', 400);
    }

    if (backfillDays <= 0 || backfillDays > 365) {
      throw createError('backfillDays must be between 1 and 365', 400);
    }

    // Get internal store
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Only owner or admin can generate fake orders
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    if (store.status !== 'active') {
      throw createError('Store is not active', 400);
    }

    // Get products from the store to use in fake orders
    const products = await StoreProduct.find({ storeId: store._id }).limit(10).lean();
    if (products.length === 0) {
      throw createError('Store has no products. Please add products before generating fake orders.', 400);
    }

    const generatedOrders: GeneratedOrderSummary[] = [];

    for (let i = 0; i < count; i++) {
      const total = getRandomNumber(minTotal, maxTotal);
      const subtotal = Math.round(total * 0.92 * 100); // Convert to paise, ~92% of total
      const shipping = Math.round(total * 0.08 * 100); // ~8% shipping
      const totalInPaise = subtotal + shipping;

      const createdAt = getRandomDateWithinDays(backfillDays);
      
      // Pick a random product
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(getRandomNumber(1, 5));

      const order = await StoreOrder.create({
        storeId: store._id,
        customer: {
          name: `Test Customer ${i + 1}`,
          email: `fake+${Date.now()}-${i}@example.com`,
          phone: `+91${Math.floor(Math.random() * 10000000000)}`,
        },
        shippingAddress: {
          name: `Test Customer ${i + 1}`,
          address1: `${Math.floor(Math.random() * 100)} Test Street`,
          address2: 'Test Area',
          city: 'Test City',
          state: 'Test State',
          zip: `${Math.floor(Math.random() * 100000)}`,
          country: 'India',
          phone: `+91${Math.floor(Math.random() * 10000000000)}`,
        },
        items: [{
          productId: randomProduct._id,
          title: randomProduct.title,
          variant: randomProduct.variants?.[0]?.name || '',
          quantity: quantity,
          price: Math.round((subtotal / quantity) / 100), // Price per item in paise
        }],
        subtotal: subtotal,
        shipping: shipping,
        total: totalInPaise,
        currency: currency,
        paymentMethod: markPaid ? 'razorpay' : 'cod',
        paymentStatus: markPaid ? 'paid' : 'pending',
        fulfillmentStatus: markFulfilled ? 'fulfilled' : 'pending',
        createdAt: createdAt,
        updatedAt: createdAt,
      });

      generatedOrders.push({
        id: (order._id as mongoose.Types.ObjectId).toString(),
        orderId: order.orderId,
        totalPrice: order.total / 100, // Convert to rupees
        currency: order.currency,
        createdAt: order.createdAt,
      });
    }

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'ORDER_AUTO_GENERATED',
      success: true,
      details: {
        count,
        minTotal,
        maxTotal,
        backfillDays,
        markPaid,
        markFulfilled,
        currency,
        generatedOrderIds: generatedOrders.map((o) => o.id),
      },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedOrders.length} fake test orders`,
      data: {
        store: {
          id: (store._id as mongoose.Types.ObjectId).toString(),
          name: store.name,
          slug: store.slug,
        },
        summary: {
          requested: count,
          created: generatedOrders.length,
        },
        orders: generatedOrders,
      },
    });
  } catch (error: any) {
    next(error);
  }
};


