import { Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { StoreConnection } from '../models/StoreConnection';
import { decrypt } from '../utils/encryption';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';

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
  id: number;
  name: string;
  totalPrice: string;
  currency: string;
  createdAt: string;
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
 * Auto-place (test) orders for a specific store
 * POST /api/auto-orders/:storeId/generate
 *
 * This mirrors the behavior of the shopifyFakeOrderAutomation project but is
 * fully integrated with our StoreConnection model and multi-store setup.
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
      currency = 'USD',
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

    // Get store connection
    const store = await StoreConnection.findById(storeId);
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
      throw createError('Store connection is not active', 400);
    }

    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    const generatedOrders: GeneratedOrderSummary[] = [];

    for (let i = 0; i < count; i++) {
      const total = getRandomNumber(minTotal, maxTotal);
      const taxPortion = total * 0.08; // ~8% tax
      const subtotal = total - taxPortion;

      const createdAt = getRandomDateWithinDays(backfillDays);

      const orderPayload = {
        order: {
          email: `fake+${Date.now()}-${i}@example.com`,
          financial_status: markPaid ? 'paid' : 'pending',
          fulfillment_status: markFulfilled ? 'fulfilled' : 'unfulfilled',
          send_receipt: false,
          send_fulfillment_receipt: false,
          test: true,
          currency,
          created_at: createdAt.toISOString(),
          line_items: [
            {
              title: 'Auto-generated order',
              quantity: 1,
              price: subtotal.toFixed(2),
            },
          ],
          total_tax: taxPortion.toFixed(2),
        },
      };

      const response = await axios.post(
        `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json`,
        orderPayload,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const createdOrder = response.data?.order;
      if (createdOrder) {
        generatedOrders.push({
          id: createdOrder.id,
          name: createdOrder.name,
          totalPrice: createdOrder.total_price,
          currency: createdOrder.currency,
          createdAt: createdOrder.created_at,
        });
      }

      // Small delay to avoid hitting API rate limits too aggressively
      if (i < count - 1) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
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
          id: store._id,
          name: store.storeName,
          domain: store.shopDomain,
        },
        summary: {
          requested: count,
          created: generatedOrders.length,
        },
        orders: generatedOrders,
      },
    });
  } catch (error: any) {
    if (error.response?.data?.errors) {
      return next(
        createError(
          `Shopify error while creating fake orders: ${JSON.stringify(
            error.response.data.errors
          )}`,
          400
        )
      );
    }
    next(error);
  }
};


