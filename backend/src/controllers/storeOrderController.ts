import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StoreOrder } from '../models/StoreOrder';
import { StoreProduct } from '../models/StoreProduct';
import { createError } from '../middleware/errorHandler';
import { createOrderSchema, updateFulfillmentSchema } from '../validators/storeDashboardValidator';

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

    order.fulfillmentStatus = value.fulfillmentStatus;
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    next(error);
  }
};
