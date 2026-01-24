import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StoreOrder } from '../models/StoreOrder';
import { StoreProduct } from '../models/StoreProduct';
import { Store } from '../models/Store';
import { createError } from '../middleware/errorHandler';
import {
  createOrderSchema,
  updateFulfillmentSchema,
  updatePaymentStatusSchema,
  bulkFulfillmentSchema,
  orderNoteSchema,
} from '../validators/storeDashboardValidator';
import { sendFulfillmentStatusEmail, sendPaymentStatusEmail } from '../services/StoreEmailService';

/**
 * List orders
 * GET /api/store-dashboard/stores/:id/orders
 */
export const listOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;

    const { paymentStatus, fulfillmentStatus, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    const query: any = { storeId };
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (fulfillmentStatus) {
      query.fulfillmentStatus = fulfillmentStatus;
    }

    const orders = await StoreOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string, 10))
      .lean();

    const total = await StoreOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total,
          pages: Math.ceil(total / parseInt(limit as string, 10)),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get order details
 * GET /api/store-dashboard/stores/:id/orders/:orderId
 */
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const orderId = req.params.orderId;

    const order = await StoreOrder.findOne({
      _id: orderId,
      storeId,
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update fulfillment status
 * PUT /api/store-dashboard/stores/:id/orders/:orderId/fulfillment
 */
export const updateFulfillment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updateFulfillmentSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const storeId = store._id;
    const orderId = req.params.orderId;

    const order = await StoreOrder.findOne({
      _id: orderId,
      storeId,
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    const oldStatus = order.fulfillmentStatus;
    order.fulfillmentStatus = value.fulfillmentStatus;
    await order.save();

    // Send fulfillment status email if status changed (non-blocking)
    if (oldStatus !== value.fulfillmentStatus) {
      try {
        const storeDoc = await Store.findById(storeId);
        if (storeDoc) {
          const emailSettings = storeDoc.settings?.emailNotifications || {};
          const sendFulfillmentEmails = emailSettings.fulfillmentStatus !== false; // Default to true

          if (sendFulfillmentEmails) {
            sendFulfillmentStatusEmail(
              order,
              storeDoc.name,
              value.fulfillmentStatus as 'pending' | 'fulfilled' | 'cancelled' | 'shipped'
            ).catch((err) => {
              console.error('Failed to send fulfillment status email:', err);
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending fulfillment email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update payment status
 * PUT /api/store-dashboard/stores/:id/orders/:orderId/payment-status
 */
export const updatePaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = updatePaymentStatusSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const storeId = store._id;
    const orderId = req.params.orderId;

    const order = await StoreOrder.findOne({
      _id: orderId,
      storeId,
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    const oldStatus = order.paymentStatus;
    order.paymentStatus = value.paymentStatus as 'pending' | 'paid' | 'failed' | 'refunded';
    await order.save();

    // Send payment status email if status changed (non-blocking)
    // Only send emails for paid, failed, or refunded - not for pending
    if (oldStatus !== value.paymentStatus && value.paymentStatus !== 'pending') {
      try {
        const storeDoc = await Store.findById(storeId);
        if (storeDoc) {
          const emailSettings = storeDoc.settings?.emailNotifications || {};
          const sendPaymentStatusEmails = emailSettings.paymentStatus !== false; // Default to true

          if (sendPaymentStatusEmails) {
            sendPaymentStatusEmail(
              order,
              storeDoc.name,
              value.paymentStatus as 'paid' | 'failed' | 'refunded'
            ).catch((err) => {
              console.error('Failed to send payment status email:', err);
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending payment status email:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Search orders
 * GET /api/store-dashboard/stores/:id/orders/search?q=...
 */
export const searchOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      throw createError('Search query is required', 400);
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

    // Search by orderId, customer name, or customer email
    const query: any = {
      storeId,
      $or: [
        { orderId: { $regex: searchQuery, $options: 'i' } },
        { 'customer.name': { $regex: searchQuery, $options: 'i' } },
        { 'customer.email': { $regex: searchQuery, $options: 'i' } },
      ],
    };

    const orders = await StoreOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string, 10))
      .lean();

    const total = await StoreOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page as string, 10),
          limit: parseInt(limit as string, 10),
          total,
          pages: Math.ceil(total / parseInt(limit as string, 10)),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Export orders as CSV
 * GET /api/store-dashboard/stores/:id/orders/export?format=csv&status=...
 */
export const exportOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const { format = 'csv', paymentStatus, fulfillmentStatus, startDate, endDate } = req.query;

    if (format !== 'csv') {
      throw createError('Only CSV format is supported', 400);
    }

    const query: any = { storeId };
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (fulfillmentStatus) {
      query.fulfillmentStatus = fulfillmentStatus;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    const orders = await StoreOrder.find(query).sort({ createdAt: -1 }).lean();

    // Generate CSV
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Items',
      'Subtotal',
      'Shipping',
      'Total',
      'Currency',
      'Payment Status',
      'Fulfillment Status',
    ];

    const rows = orders.map((order) => {
      const items = order.items.map((item) => `${item.title}${item.variant ? ` (${item.variant})` : ''} x${item.quantity}`).join('; ');
      const formatPrice = (amount: number) => (amount / 100).toFixed(2);
      return [
        order.orderId,
        new Date(order.createdAt).toISOString(),
        order.customer.name,
        order.customer.email,
        order.customer.phone,
        items,
        formatPrice(order.subtotal),
        formatPrice(order.shipping),
        formatPrice(order.total),
        order.currency,
        order.paymentStatus,
        order.fulfillmentStatus,
      ];
    });

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Bulk update fulfillment status
 * PUT /api/store-dashboard/stores/:id/orders/bulk-fulfillment
 */
export const bulkUpdateFulfillment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = bulkFulfillmentSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const storeId = store._id;

    // Verify all orders belong to this store
    const orders = await StoreOrder.find({
      _id: { $in: value.orderIds },
      storeId,
    });

    if (orders.length !== value.orderIds.length) {
      throw createError('Some orders not found or do not belong to this store', 400);
    }

    // Update all orders
    const updateResult = await StoreOrder.updateMany(
      { _id: { $in: value.orderIds }, storeId },
      { $set: { fulfillmentStatus: value.fulfillmentStatus } }
    );

    // Send emails for updated orders (non-blocking)
    try {
      const storeDoc = await Store.findById(storeId);
      if (storeDoc) {
        const emailSettings = storeDoc.settings?.emailNotifications || {};
        const sendFulfillmentEmails = emailSettings.fulfillmentStatus !== false;

        if (sendFulfillmentEmails) {
          const updatedOrders = await StoreOrder.find({
            _id: { $in: value.orderIds },
            storeId,
          });

          for (const order of updatedOrders) {
            sendFulfillmentStatusEmail(
              order,
              storeDoc.name,
              value.fulfillmentStatus as 'pending' | 'fulfilled' | 'cancelled' | 'shipped'
            ).catch((err) => {
              console.error('Failed to send fulfillment status email:', err);
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending bulk fulfillment emails:', emailError);
    }

    res.status(200).json({
      success: true,
      data: {
        updated: updateResult.modifiedCount,
        total: value.orderIds.length,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Add note to order
 * POST /api/store-dashboard/stores/:id/orders/:orderId/notes
 */
export const addOrderNote = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { error, value } = orderNoteSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    const store = (req as any).store;
    const storeId = store._id;
    const orderId = req.params.orderId;
    const userId = (req.user as any)._id;

    const order = await StoreOrder.findOne({
      _id: orderId,
      storeId,
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Add note
    order.notes.push({
      text: value.text,
      addedBy: userId,
      addedAt: new Date(),
    });

    await order.save();

    res.status(201).json({
      success: true,
      data: order.notes[order.notes.length - 1],
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get order notes
 * GET /api/store-dashboard/stores/:id/orders/:orderId/notes
 */
export const getOrderNotes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const store = (req as any).store;
    const storeId = store._id;
    const orderId = req.params.orderId;

    const order = await StoreOrder.findOne({
      _id: orderId,
      storeId,
    }).populate('notes.addedBy', 'name email');

    if (!order) {
      throw createError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: order.notes,
    });
  } catch (error: any) {
    next(error);
  }
};
