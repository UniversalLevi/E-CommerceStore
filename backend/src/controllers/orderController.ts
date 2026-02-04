import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Store } from '../models/Store';
import { AuditLog } from '../models/AuditLog';
import { Order, IOrder, ZenStatus } from '../models/Order';
import { ZenOrder } from '../models/ZenOrder';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { StoreOrder } from '../models/StoreOrder';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

// Legacy interface - kept for backward compatibility but not used
interface ShopifyOrder {
  id: number;
  name: string;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    variant_title: string;
    sku: string;
  }>;
  shipping_address: {
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
  } | null;
  fulfillments: Array<{
    id: number;
    status: string;
    created_at: string;
    tracking_number: string | null;
    tracking_url: string | null;
  }>;
}

interface OrderResponse {
  id: number;
  name: string;
  orderNumber: number;
  email: string;
  createdAt: string;
  updatedAt: string;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  customer: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  } | null;
  lineItems: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    variantTitle: string;
    sku: string;
  }>;
  shippingAddress: {
    address1: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    formatted: string;
  } | null;
  fulfillments: Array<{
    id: number;
    status: string;
    createdAt: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
  }>;
  storeId?: string;
  storeName?: string;
  shopDomain?: string;
}

/**
 * Transform StoreOrder to our response format
 */
function transformStoreOrderToResponse(order: any, storeInfo?: { id: string; name: string; slug: string }): OrderResponse {
  const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';
  
  return {
    id: order.id,
    name: order.name,
    orderNumber: order.order_number,
    email: order.email || '',
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    totalPrice: order.total_price,
    subtotalPrice: order.subtotal_price,
    totalTax: order.total_tax,
    currency: order.currency,
    financialStatus: order.financial_status || 'pending',
    fulfillmentStatus,
    customer: order.customer ? {
      id: order.customer.id,
      email: order.customer.email,
      firstName: order.customer.first_name,
      lastName: order.customer.last_name,
      fullName: `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim(),
    } : null,
    lineItems: order.line_items.map((item: any) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      variantTitle: item.variant_title || '',
      sku: item.sku || '',
    })),
    shippingAddress: order.shipping_address ? {
      address1: order.shipping_address.address1,
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      country: order.shipping_address.country,
      zip: order.shipping_address.zip,
      formatted: [
        order.shipping_address.address1,
        order.shipping_address.city,
        order.shipping_address.province,
        order.shipping_address.zip,
        order.shipping_address.country,
      ].filter(Boolean).join(', '),
    } : null,
    fulfillments: order.fulfillments?.map((f: any) => ({
      id: f.id,
      status: f.status,
      createdAt: f.created_at,
      trackingNumber: f.tracking_number,
      trackingUrl: f.tracking_url,
    })) || [],
    ...(storeInfo && {
      storeId: storeInfo.id,
      storeName: storeInfo.name,
      slug: storeInfo.slug,
    }),
  };
}

/**
 * List orders for a specific store (internal store orders)
 * GET /api/orders/:storeId
 */
export const listStoreOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId } = req.params;
    const { paymentStatus, fulfillmentStatus, limit = '50', startDate, endDate } = req.query;

    // Get store
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Check store status
    if (store.status !== 'active') {
      throw createError('Store is not active', 400);
    }

    // Build query for StoreOrder
    const query: any = { storeId: store._id };
    
    if (paymentStatus && paymentStatus !== 'any') {
      query.paymentStatus = paymentStatus;
    }
    
    if (fulfillmentStatus && fulfillmentStatus !== 'any') {
      query.fulfillmentStatus = fulfillmentStatus;
    }
    
    // Add date filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Fetch orders
    const orders = await StoreOrder.find(query)
      .populate('items.productId', 'title images')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();

    // Transform orders to response format
    const transformedOrders = orders.map((order: any) => ({
      id: order._id.toString(),
      orderId: order.orderId,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      items: order.items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price / 100, // Convert from paise to rupees
        variant: item.variant,
      })),
      total: order.total / 100, // Convert from paise to rupees
      subtotal: order.subtotal / 100,
      shipping: order.shipping / 100,
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    // Calculate stats
    const paidRevenue = orders
      .filter((o: any) => o.paymentStatus === 'paid')
      .reduce((sum: number, order: any) => sum + order.total, 0) / 100; // Convert to rupees

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + order.total, 0) / 100;

    const ordersByStatus = {
      pending: orders.filter((o: any) => o.paymentStatus === 'pending').length,
      paid: orders.filter((o: any) => o.paymentStatus === 'paid').length,
      failed: orders.filter((o: any) => o.paymentStatus === 'failed').length,
      refunded: orders.filter((o: any) => o.paymentStatus === 'refunded').length,
      unfulfilled: orders.filter((o: any) => o.fulfillmentStatus === 'pending').length,
      fulfilled: orders.filter((o: any) => o.fulfillmentStatus === 'fulfilled').length,
      shipped: orders.filter((o: any) => o.fulfillmentStatus === 'shipped').length,
      cancelled: orders.filter((o: any) => o.fulfillmentStatus === 'cancelled').length,
    };

    res.json({
      success: true,
      count: transformedOrders.length,
      data: transformedOrders,
      stats: {
        totalRevenue,
        paidRevenue,
        currency: store.currency || 'INR',
        ordersByStatus,
      },
      store: {
        id: store._id,
        name: store.name,
        slug: store.slug,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * List orders from all stores (Admin only)
 * GET /api/orders/admin/all
 */
export const listAllStoreOrders = async (
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

    const { storeId, limit = '25', startDate, endDate } = req.query;

    // Get all active stores or specific store
    const query: any = { status: 'active' };
    if (storeId) {
      query._id = storeId;
    }

    const stores = await Store.find(query)
      .populate('owner', 'email name')
      .lean();

    if (stores.length === 0) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        stores: [],
        aggregatedStats: {
          totalRevenue: 0,
          totalOrders: 0,
          storeStats: [],
        },
      });
    }

    // Fetch orders from all stores (internal stores)
    const allOrdersPromises = stores.map(async (store) => {
      try {
        // Build query for StoreOrder
        const query: any = { storeId: store._id };
        
        // Add date filters
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) {
            query.createdAt.$gte = new Date(startDate as string);
          }
          if (endDate) {
            query.createdAt.$lte = new Date(endDate as string);
          }
        }

        // Fetch orders from internal store
        const storeOrders = await StoreOrder.find(query).lean();

        // Calculate stats - only paid for revenue
        const paidRevenue = storeOrders
          .filter((o: any) => o.paymentStatus === 'paid')
          .reduce((sum: number, o: any) => sum + (o.total || 0), 0);

        return {
          store: {
            id: store._id.toString(),
            name: store.name,
            slug: store.slug,
            owner: store.owner,
          },
          orders: storeOrders.map((order: any) => ({
            id: order._id.toString(),
            orderId: order.orderId,
            customer: order.customer,
            items: order.items,
            total: order.total / 100, // Convert from paise to rupees
            currency: order.currency,
            paymentStatus: order.paymentStatus,
            fulfillmentStatus: order.fulfillmentStatus,
            createdAt: order.createdAt,
          })),
          stats: {
            totalOrders: storeOrders.length,
            totalRevenue: storeOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100, // Convert to rupees
            paidRevenue: paidRevenue / 100, // Convert to rupees
            currency: store.currency || 'INR',
          },
        };
      } catch (error: any) {
        console.error(`Failed to fetch orders for store ${store.name}:`, error.message);
        return {
          store: {
            id: store._id.toString(),
            name: store.name,
            slug: store.slug,
            owner: store.owner,
          },
          orders: [],
          stats: { totalOrders: 0, totalRevenue: 0, paidRevenue: 0, currency: store.currency || 'INR' },
          error: error.message,
        };
      }
    });

    const results = await Promise.all(allOrdersPromises);

    // Separate successful and failed stores
    const successfulResults = results.filter(r => !(r as any).error);
    const failedStores = results.filter(r => (r as any).error).map(r => ({
      storeId: r.store.id,
      storeName: r.store.name,
      error: (r as any).error,
    }));

    // Flatten all orders and sort by date (only from successful stores)
    const allOrders = successfulResults
      .flatMap(r => r.orders)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate aggregated stats (only from successful stores)
    const aggregatedStats = {
      totalOrders: successfulResults.reduce((sum, r) => sum + r.stats.totalOrders, 0),
      totalRevenue: successfulResults.reduce((sum, r) => sum + r.stats.totalRevenue, 0),
      paidRevenue: successfulResults.reduce((sum, r) => sum + (r.stats.paidRevenue || 0), 0),
      storeStats: successfulResults.map(r => ({
        storeId: r.store.id,
        storeName: r.store.name,
        slug: r.store.slug,
        owner: r.store.owner,
        totalOrders: r.stats.totalOrders,
        totalRevenue: r.stats.totalRevenue,
        paidRevenue: r.stats.paidRevenue || 0,
        currency: r.stats.currency,
        status: 'active',
      })),
      failedStores,
    };

    res.json({
      success: true,
      count: allOrders.length,
      data: allOrders,
      stores: successfulResults.map(r => r.store),
      aggregatedStats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single order details
 * GET /api/orders/:storeId/:orderId
 */
export const getOrderDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;

    // Get store (internal store)
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Fetch order from internal store
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    }).populate('items.productId', 'title images').lean();

    if (!order) {
      throw createError('Order not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        customer: order.customer,
        items: order.items,
        total: order.total / 100, // Convert from paise to rupees
        subtotal: order.subtotal / 100,
        shipping: order.shipping / 100,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return next(createError('Order not found', 404));
    }
    next(error);
  }
};

/**
 * Update order (cancel, close, etc.)
 * PUT /api/orders/:storeId/:orderId
 */
export const updateOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { action, note } = req.body;

    // Validate action
    const validActions = ['cancel', 'close', 'open'];
    if (!validActions.includes(action)) {
      throw createError(`Invalid action. Must be one of: ${validActions.join(', ')}`, 400);
    }

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Update order in internal store
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Update order based on action
    if (action === 'cancel') {
      order.fulfillmentStatus = 'cancelled';
    } else if (action === 'close') {
      // Mark as completed
      order.fulfillmentStatus = 'fulfilled';
    } else if (action === 'open') {
      order.fulfillmentStatus = 'pending';
    }

    await order.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: `ORDER_${action.toUpperCase()}`,
      success: true,
      details: {
        orderId,
        action,
        note,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Order ${action}ed successfully`,
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        fulfillmentStatus: order.fulfillmentStatus,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Create fulfillment for an order
 * POST /api/orders/:storeId/:orderId/fulfill
 */
export const fulfillOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { note, notifyCustomer = true } = req.body;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Fulfill order in internal store
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Check if order is already fulfilled
    if (order.fulfillmentStatus === 'fulfilled') {
      throw createError('Order is already fulfilled', 400);
    }

    // Update fulfillment status
    order.fulfillmentStatus = 'fulfilled';
    
    // Add note if provided
    if (note) {
      order.notes.push({
        text: `[Fulfilled] ${note}`,
        addedBy: (req.user as any)._id,
        addedAt: new Date(),
      });
    }

    await order.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'ORDER_FULFILL',
      success: true,
      details: {
        orderId,
        note,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Order fulfilled successfully',
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        fulfillmentStatus: order.fulfillmentStatus,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Cancel fulfillment
 * POST /api/orders/:storeId/:orderId/fulfillments/:fulfillmentId/cancel
 */
export const cancelFulfillment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId, fulfillmentId } = req.params;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Cancel fulfillment in internal store
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Reset fulfillment status
    order.fulfillmentStatus = 'pending';
    await order.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'FULFILLMENT_CANCEL',
      success: true,
      details: {
        orderId,
        fulfillmentId,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Fulfillment cancelled successfully',
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        fulfillmentStatus: order.fulfillmentStatus,
      },
    });
  } catch (error: any) {
    if (error.response?.data?.errors) {
      return next(createError(`Shopify error: ${JSON.stringify(error.response.data.errors)}`, 400));
    }
    next(error);
  }
};

/**
 * Get store revenue analytics (Admin)
 * GET /api/orders/admin/revenue
 */
export const getStoreRevenueAnalytics = async (
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

    const { startDate, endDate } = req.query;

    // Get all active stores
    const stores = await Store.find({ status: 'active' })
      .populate('owner', 'email name')
      .lean();

    // Fetch orders from all stores (internal stores)
    const revenuePromises = stores.map(async (store) => {
      try {
        // Build query for StoreOrder
        const query: any = { storeId: store._id };
        
        // Add date filters
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) {
            query.createdAt.$gte = new Date(startDate as string);
          }
          if (endDate) {
            query.createdAt.$lte = new Date(endDate as string);
          }
        }

        // Fetch orders from internal store
        const allOrders = await StoreOrder.find(query).lean();

        console.log(`Revenue: Fetched ${allOrders.length} orders from ${store.name}`);
        
        // Calculate revenue by status (orders are in paise, convert to rupees)
        const revenueByStatus = {
          paid: allOrders
            .filter((o: any) => o.paymentStatus === 'paid')
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100,
          pending: allOrders
            .filter((o: any) => o.paymentStatus === 'pending')
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100,
          refunded: allOrders
            .filter((o: any) => o.paymentStatus === 'refunded')
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100,
          authorized: allOrders
            .filter((o: any) => o.paymentStatus === 'authorized')
            .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100,
        };

        return {
          storeId: store._id.toString(),
          storeName: store.name,
          slug: store.slug,
          owner: store.owner,
          totalOrders: allOrders.length,
          totalRevenue: allOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100, // Convert to rupees
          revenueByStatus,
          currency: store.currency || 'INR',
          ordersByFulfillment: {
            unfulfilled: allOrders.filter((o: any) => !o.fulfillmentStatus || o.fulfillmentStatus === 'pending').length,
            fulfilled: allOrders.filter((o: any) => o.fulfillmentStatus === 'fulfilled').length,
            partial: 0, // Internal stores don't have partial fulfillment yet
          },
        };
      } catch (error: any) {
        console.error(`Failed to fetch revenue for store ${store.name}:`, error.message);
        return {
          storeId: store._id.toString(),
          storeName: store.name,
          slug: store.slug,
          owner: store.owner,
          totalOrders: 0,
          totalRevenue: 0,
          revenueByStatus: { paid: 0, pending: 0, refunded: 0, authorized: 0 },
          currency: store.currency || 'INR',
          ordersByFulfillment: { unfulfilled: 0, fulfilled: 0, partial: 0 },
          error: error.message,
        };
      }
    });

    const storeRevenues = await Promise.all(revenuePromises);

    // Separate successful and failed stores
    const successfulStores = storeRevenues.filter(s => !s.error);
    const failedStores = storeRevenues.filter(s => s.error).map(s => ({
      storeId: s.storeId,
      storeName: s.storeName || s.slug,
      error: s.error,
    }));

    // Calculate totals (only from successful stores)
    const totals = {
      totalRevenue: successfulStores.reduce((sum, s) => sum + s.totalRevenue, 0),
      paidRevenue: successfulStores.reduce((sum, s) => sum + (s.revenueByStatus?.paid || 0), 0),
      pendingRevenue: successfulStores.reduce((sum, s) => sum + (s.revenueByStatus?.pending || 0), 0),
      totalOrders: successfulStores.reduce((sum, s) => sum + s.totalOrders, 0),
      totalStores: stores.length,
      activeStores: successfulStores.length,
      failedStores: failedStores.length,
    };

    res.json({
      success: true,
      data: {
        stores: successfulStores,
        failedStores,
        totals,
        period: {
          startDate: startDate || 'all time',
          endDate: endDate || 'now',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark order as completed (payment received)
 * POST /api/orders/:storeId/:orderId/complete
 */
export const markOrderCompleted = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { note, paymentReceived = true } = req.body;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Get order from internal store
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    const timestamp = new Date().toISOString();
    const completedBy = req.user.email || 'Admin';

    // Update payment status if needed
    if (paymentReceived && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
    }

    // Mark as fulfilled
    order.fulfillmentStatus = 'fulfilled';

    // Add completion note
    if (note) {
      order.notes.push({
        text: `[COMPLETED - ${timestamp}] ${note} - Marked by: ${completedBy}`,
        addedBy: (req.user as any)._id,
        addedAt: new Date(),
      });
    }

    await order.save();

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'ORDER_COMPLETED',
      success: true,
      details: {
        orderId,
        totalPrice: order.total / 100, // Convert from paise
        currency: order.currency,
        paymentReceived,
        note,
        completedBy,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: paymentReceived 
        ? 'Order marked as completed and paid successfully' 
        : 'Order marked as completed (payment status unchanged)',
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus,
        completedAt: timestamp,
        paymentReceived,
      },
    });
  } catch (error: any) {
    console.error('Mark completed error:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      return next(createError(`Shopify error: ${JSON.stringify(error.response.data.errors)}`, 400));
    }
    next(error);
  }
};

/**
 * Reopen a completed order
 * POST /api/orders/:storeId/:orderId/reopen
 */
export const reopenOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { note } = req.body;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Get order and reopen it
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Reopen order (change fulfillment status back to pending)
    order.fulfillmentStatus = 'pending';

    // Update note if provided
    if (note) {
      const timestamp = new Date().toISOString();
      order.notes.push({
        text: `[REOPENED - ${timestamp}] Reason: ${note} - Reopened by: ${req.user.email || 'Admin'}`,
        addedBy: (req.user as any)._id,
        addedAt: new Date(),
      });
    }

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'ORDER_REOPENED',
      success: true,
      details: {
        orderId,
        note,
        reopenedBy: req.user.email,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Order reopened successfully',
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        fulfillmentStatus: order.fulfillmentStatus,
      },
    });
  } catch (error: any) {
    if (error.response?.data?.errors) {
      return next(createError(`Shopify error: ${JSON.stringify(error.response.data.errors)}`, 400));
    }
    next(error);
  }
};

/**
 * Add note to order
 * POST /api/orders/:storeId/:orderId/note
 */
export const addOrderNote = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { note } = req.body;

    if (!note || typeof note !== 'string') {
      throw createError('Note is required', 400);
    }

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Get order and add note
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Add note
    order.notes.push({
      text: note,
      addedBy: (req.user as any)._id,
      addedAt: new Date(),
    });

    await order.save();

    res.json({
      success: true,
      message: 'Note added successfully',
      data: {
        id: (order as any)._id.toString(),
        orderId: order.orderId,
        notes: order.notes,
      },
    });
  } catch (error: any) {
    if (error.response?.data?.errors) {
      return next(createError(`Shopify error: ${JSON.stringify(error.response.data.errors)}`, 400));
    }
    next(error);
  }
};

/**
 * Sync a Shopify order to local database
 * This creates or updates a local Order record from Shopify data
 */
async function syncShopifyOrderToLocal(
  shopifyOrder: ShopifyOrder,
  storeConnection: any,
  userId: mongoose.Types.ObjectId
) {
  // Convert Shopify price strings to paise (multiply by 100)
  const toPaise = (priceStr: string): number => Math.round(parseFloat(priceStr || '0') * 100);

  const orderData: any = {
    shopifyOrderId: shopifyOrder.id,
    shopifyOrderName: shopifyOrder.name || '',
    shopifyOrderNumber: shopifyOrder.order_number,
    storeConnectionId: storeConnection._id,
    userId,
    customer: {
      shopifyCustomerId: shopifyOrder.customer?.id || null,
      email: shopifyOrder.customer?.email || shopifyOrder.email || '',
      firstName: shopifyOrder.customer?.first_name || '',
      lastName: shopifyOrder.customer?.last_name || '',
      phone: '',
    },
    email: shopifyOrder.email || '',
    lineItems: shopifyOrder.line_items.map((item) => ({
      shopifyLineItemId: item.id,
      title: item.title,
      quantity: item.quantity,
      price: toPaise(item.price),
      variantTitle: item.variant_title || '',
      sku: item.sku || '',
      productId: null,
      variantId: null,
    })),
    shippingAddress: shopifyOrder.shipping_address
      ? {
          firstName: '',
          lastName: '',
          address1: shopifyOrder.shipping_address.address1 || '',
          address2: '',
          city: shopifyOrder.shipping_address.city || '',
          province: shopifyOrder.shipping_address.province || '',
          provinceCode: '',
          country: shopifyOrder.shipping_address.country || '',
          countryCode: '',
          zip: shopifyOrder.shipping_address.zip || '',
          phone: '',
        }
      : null,
    currency: shopifyOrder.currency || 'INR',
    totalPrice: toPaise(shopifyOrder.total_price),
    subtotalPrice: toPaise(shopifyOrder.subtotal_price),
    totalTax: toPaise(shopifyOrder.total_tax),
    totalShipping: 0,
    financialStatus: shopifyOrder.financial_status || 'pending',
    fulfillmentStatus: shopifyOrder.fulfillment_status,
    shopifyCreatedAt: new Date(shopifyOrder.created_at),
    shopifyUpdatedAt: new Date(shopifyOrder.updated_at),
  };

  // Upsert the order
  const order: any = await Order.findOneAndUpdate(
    { storeConnectionId: storeConnection._id, shopifyOrderId: shopifyOrder.id },
    { $set: orderData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return order;
}

/**
 * Sync order and get local record
 * GET /api/orders/:storeId/:orderId/sync
 */
export const syncAndGetOrder = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const userId = (req.user as any)._id;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Get order from internal store
    const order = await StoreOrder.findOne({ 
      storeId: store._id,
      orderId: orderId 
    });

    if (!order) {
      throw createError('Order not found', 404);
    }

    // Order is already in local database (internal store)
    const localOrder = order;

    res.json({
      success: true,
      data: {
        localOrder: {
          id: (localOrder as any)._id,
          orderId: localOrder.orderId,
          zenStatus: (localOrder as any).zenStatus || 'pending',
          productCost: (localOrder as any).productCost || 0,
          shippingCost: localOrder.shipping || 0,
          walletChargeAmount: (localOrder as any).walletChargeAmount || 0,
          totalPrice: localOrder.total || 0,
          currency: localOrder.currency,
        },
      },
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return next(createError('Order not found', 404));
    }
    next(error);
  }
};

/**
 * Set product and shipping costs for an order
 * PUT /api/orders/:storeId/:orderId/costs
 */
export const setOrderCosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { productCost, shippingCost, serviceFee } = req.body;
    const userId = (req.user as any)._id;

    // Validate costs (in paise)
    if (productCost !== undefined && (typeof productCost !== 'number' || productCost < 0)) {
      throw createError('Product cost must be a non-negative number', 400);
    }
    if (shippingCost !== undefined && (typeof shippingCost !== 'number' || shippingCost < 0)) {
      throw createError('Shipping cost must be a non-negative number', 400);
    }
    if (serviceFee !== undefined && (typeof serviceFee !== 'number' || serviceFee < 0)) {
      throw createError('Service fee must be a non-negative number', 400);
    }

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Find or sync the local order
    let localOrder = await Order.findOne({
      storeConnectionId: storeId,
      shopifyOrderId: parseInt(orderId),
    });

    if (!localOrder) {
      throw createError('Order not found in internal store', 404);
    }

    // Check if order can be modified
    if (localOrder!.zenStatus !== 'shopify' && localOrder!.zenStatus !== 'awaiting_wallet') {
      throw createError('Order costs cannot be modified once fulfillment has started', 400);
    }

    const order = localOrder!;

    // Update costs
    if (productCost !== undefined) order.productCost = productCost;
    if (shippingCost !== undefined) order.shippingCost = shippingCost;
    if (serviceFee !== undefined) order.serviceFee = serviceFee;

    await order.save();

    res.json({
      success: true,
      message: 'Order costs updated',
      data: {
        id: order._id,
        shopifyOrderId: order.shopifyOrderId,
        productCost: order.productCost,
        shippingCost: order.shippingCost,
        serviceFee: order.serviceFee,
        totalRequired: order.productCost + order.shippingCost + order.serviceFee,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Fulfill order via ZEN (deduct from wallet)
 * POST /api/orders/:storeId/:orderId/fulfill-via-zen
 */
export const fulfillViaZen = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const { productCost, shippingCost, serviceFee = 0 } = req.body;
    const userId = (req.user as any)._id;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Get or create wallet
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId });
    }

    // Find or sync the local order
    let localOrder = await Order.findOne({
      storeConnectionId: storeId,
      shopifyOrderId: parseInt(orderId),
    });

    if (!localOrder) {
      throw createError('Order not found in internal store', 404);
    }

    // TypeScript assertion - we've handled the null case above
    const order = localOrder!;

    // Check if already processed
    if (order.zenStatus !== 'shopify' && order.zenStatus !== 'awaiting_wallet') {
      throw createError('Order has already been processed via ZEN', 400);
    }

    // Automatically use product price from order if not provided
    // Always use subtotalPrice as productCost (already in paise)
    if (productCost !== undefined) {
      order.productCost = productCost;
    } else {
      // Automatically use order's subtotalPrice as productCost
      order.productCost = order.subtotalPrice || 0;
    }
    
    // Shipping cost defaults to 0 (no shipping cost)
    if (shippingCost !== undefined) {
      order.shippingCost = shippingCost;
    } else {
      order.shippingCost = 0;
    }
    
    // Service fee defaults to 0
    if (serviceFee !== undefined) {
      order.serviceFee = serviceFee;
    } else {
      order.serviceFee = 0;
    }

    const requiredAmount = order.productCost + order.shippingCost + order.serviceFee;

    if (requiredAmount <= 0) {
      throw createError('Product cost and shipping cost must be set before fulfilling', 400);
    }

    // Check if already fulfilled via ZEN (idempotency)
    const existingZenOrder = await ZenOrder.findOne({ orderId: order._id });
    if (existingZenOrder) {
      const walletNow = await Wallet.findOne({ userId });
      return res.json({
        success: true,
        message: 'Order already submitted for ZEN fulfillment',
        data: {
          orderId: order._id,
          zenOrderId: existingZenOrder._id,
          zenStatus: order.zenStatus,
          walletDeducted: existingZenOrder.walletDeductedAmount,
          walletDeductedFormatted: `₹${(existingZenOrder.walletDeductedAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          newBalance: walletNow?.balance || 0,
          newBalanceFormatted: `₹${((walletNow?.balance || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      });
    }

    // Get current wallet balance
    const currentWallet = await Wallet.findOne({ userId });
    if (!currentWallet) {
      throw createError('Wallet not found', 404);
    }

    // Check balance
    if (currentWallet.balance < requiredAmount) {
      // Insufficient balance - mark as awaiting
      order.zenStatus = 'awaiting_wallet';
      order.walletShortage = requiredAmount - currentWallet.balance;
      await order.save();

      return res.status(402).json({
        success: false,
        reason: 'insufficient_balance',
        data: {
          currentBalance: currentWallet.balance,
          currentBalanceFormatted: `₹${(currentWallet.balance / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          requiredAmount,
          requiredAmountFormatted: `₹${(requiredAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          shortage: requiredAmount - currentWallet.balance,
          shortageFormatted: `₹${((requiredAmount - currentWallet.balance) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          orderId: order._id,
          zenStatus: order.zenStatus,
        },
      });
    }

    // Create unique reference ID for idempotency
    const referenceId = `zen_${order._id}`;

    // Check if wallet transaction already exists (idempotency)
    const existingWalletTx = await WalletTransaction.findOne({ referenceId });
    if (existingWalletTx) {
      // Already processed, just return the existing data
      const zenOrderExisting = await ZenOrder.findOne({ orderId: order._id });
      const walletNow = await Wallet.findOne({ userId });
      return res.json({
        success: true,
        message: 'Order already submitted for ZEN fulfillment',
        data: {
          orderId: order._id,
          zenOrderId: zenOrderExisting?._id,
          zenStatus: order.zenStatus,
          walletDeducted: existingWalletTx.amount,
          walletDeductedFormatted: `₹${(existingWalletTx.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          newBalance: walletNow?.balance || 0,
          newBalanceFormatted: `₹${((walletNow?.balance || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        },
      });
    }

    // Atomically deduct wallet balance - only succeeds if balance >= requiredAmount
    const balanceBefore = currentWallet.balance;
    const balanceAfter = balanceBefore - requiredAmount;

    const deductResult = await Wallet.findOneAndUpdate(
      { userId, balance: { $gte: requiredAmount } },
      { $inc: { balance: -requiredAmount } },
      { new: true }
    );

    if (!deductResult) {
      // Race condition - balance was reduced by another request
      const updatedWallet = await Wallet.findOne({ userId });
      order.zenStatus = 'awaiting_wallet';
      order.walletShortage = requiredAmount - (updatedWallet?.balance || 0);
      await order.save();

      return res.status(402).json({
        success: false,
        reason: 'insufficient_balance',
        data: {
          currentBalance: updatedWallet?.balance || 0,
          currentBalanceFormatted: `₹${((updatedWallet?.balance || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          requiredAmount,
          requiredAmountFormatted: `₹${(requiredAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          shortage: requiredAmount - (updatedWallet?.balance || 0),
          shortageFormatted: `₹${((requiredAmount - (updatedWallet?.balance || 0)) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          orderId: order._id,
          zenStatus: order.zenStatus,
        },
      });
    }

    // Create wallet transaction
    const walletTransaction = await WalletTransaction.create({
      walletId: currentWallet._id,
      userId,
      orderId: order._id,
      amount: requiredAmount,
      type: 'debit',
      reason: 'Order deduction',
      referenceId,
      balanceBefore,
      balanceAfter,
      metadata: {
        shopifyOrderId: order.shopifyOrderId,
        shopifyOrderName: (order as any).orderId || '',
        productCost: order.productCost,
        shippingCost: order.shippingCost,
        serviceFee: order.serviceFee,
      },
    });

    // Update order
    order.zenStatus = 'ready_for_fulfillment';
    order.walletChargeAmount = requiredAmount;
    order.walletChargedAt = new Date();
    order.walletTransactionId = walletTransaction._id as mongoose.Types.ObjectId;
    order.walletShortage = 0;
    await order.save();

    // Create ZEN order for ops
    const zenOrder = await ZenOrder.create({
      orderId: order._id,
      userId,
      storeConnectionId: store._id,
      shopifyOrderName: order.shopifyOrderName,
      storeName: store.name,
      customerName: `${order.customer.firstName} ${order.customer.lastName}`.trim() || 'Guest',
      customerEmail: order.email,
      customerPhone: order.shippingAddress?.phone || '',
      shippingAddress: order.shippingAddress
        ? [
            order.shippingAddress.address1,
            order.shippingAddress.address2,
            order.shippingAddress.city,
            order.shippingAddress.province,
            order.shippingAddress.zip,
            order.shippingAddress.country,
          ]
            .filter(Boolean)
            .join(', ')
        : '',
      sku: order.lineItems.map((li) => li.sku).filter(Boolean).join(', ') || 'N/A',
      variants: order.lineItems.map((li) => ({
        title: li.title,
        sku: li.sku,
        quantity: li.quantity,
        price: li.price,
      })),
      itemCount: order.lineItems.reduce((sum, li) => sum + li.quantity, 0),
      orderValue: order.totalPrice,
      productCost: order.productCost,
      shippingCost: order.shippingCost,
      serviceFee: order.serviceFee,
      walletDeductedAmount: requiredAmount,
      status: 'pending',
      walletDeductedAt: new Date(),
      statusHistory: [
        {
          status: 'pending',
          changedBy: userId,
          changedAt: new Date(),
          note: 'Order created via ZEN fulfillment',
        },
      ],
    });

    // Update local order with zen order reference
    order.metadata = { ...order.metadata, zenOrderId: zenOrder._id };
    await order.save();

    // Update wallet transaction with zen order reference
    walletTransaction.zenOrderId = zenOrder._id as mongoose.Types.ObjectId;
    await walletTransaction.save();

    // Create notification
    await createNotification({
      userId,
      type: 'system_update',
      title: 'Order Submitted for Fulfillment',
      message: `Order ${(order as any).orderId || 'N/A'} has been submitted for ZEN fulfillment. ₹${(requiredAmount / 100).toLocaleString('en-IN')} deducted from wallet.`,
      link: '/dashboard/orders',
      metadata: {
        orderId: order._id,
        zenOrderId: zenOrder._id,
        amount: requiredAmount,
      },
    });

    // Audit log
    await AuditLog.create({
      userId,
      storeId: store._id,
      action: 'ORDER_FULFILL_VIA_ZEN',
      success: true,
      details: {
        orderId: order._id,
        shopifyOrderId: order.shopifyOrderId,
        zenOrderId: zenOrder._id,
        walletDeducted: requiredAmount,
        newBalance: balanceAfter,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Order submitted for ZEN fulfillment',
      data: {
        orderId: order._id,
        zenOrderId: zenOrder._id,
        zenStatus: order.zenStatus,
        walletDeducted: requiredAmount,
        walletDeductedFormatted: `₹${(requiredAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        newBalance: balanceAfter,
        newBalanceFormatted: `₹${(balanceAfter / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get local order with ZEN status
 * GET /api/orders/:storeId/:orderId/zen-status
 */
export const getOrderZenStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { storeId, orderId } = req.params;
    const userId = (req.user as any)._id;

    // Get store connection
    const store = await Store.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Find local order
    const localOrder = await Order.findOne({
      storeConnectionId: storeId,
      shopifyOrderId: parseInt(orderId),
    }).populate('walletTransactionId');

    if (!localOrder) {
      return res.json({
        success: true,
        data: {
          hasLocalOrder: false,
          zenStatus: 'shopify',
        },
      });
    }

    // Get zen order if exists
    const zenOrder = await ZenOrder.findOne({ orderId: localOrder._id });

    res.json({
      success: true,
      data: {
        hasLocalOrder: true,
        orderId: localOrder._id,
        shopifyOrderId: localOrder.shopifyOrderId,
        zenStatus: localOrder.zenStatus,
        productCost: localOrder.productCost,
        shippingCost: localOrder.shippingCost,
        serviceFee: localOrder.serviceFee,
        requiredAmount: localOrder.productCost + localOrder.shippingCost + localOrder.serviceFee,
        walletChargeAmount: localOrder.walletChargeAmount,
        walletChargedAt: localOrder.walletChargedAt,
        walletShortage: localOrder.walletShortage,
        zenOrder: zenOrder
          ? {
              id: zenOrder._id,
              status: zenOrder.status,
              trackingNumber: zenOrder.trackingNumber,
              courierProvider: zenOrder.courierProvider,
              createdAt: zenOrder.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all internal store orders for the authenticated user
 * GET /api/orders/internal/all
 */
export const getAllInternalStoreOrders = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { fulfillmentStatus, startDate, endDate, limit = '100' } = req.query;

    // Get user's internal store
    const store = await Store.findOne({ owner: userId });
    if (!store) {
      // User doesn't have an internal store yet, return empty
      return res.status(200).json({
        success: true,
        data: [],
        stats: {
          totalRevenue: 0,
          paidRevenue: 0,
          currency: 'INR',
          ordersByStatus: {
            pending: 0,
            paid: 0,
            refunded: 0,
            unfulfilled: 0,
            fulfilled: 0,
            partial: 0,
          },
        },
      });
    }

    // Build query
    const query: any = { storeId: store._id };
    
    if (fulfillmentStatus && fulfillmentStatus !== 'any') {
      query.fulfillmentStatus = fulfillmentStatus;
    }

    // Date filters
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Fetch orders
    const orders = await StoreOrder.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();

    // Calculate stats - use the same query with date filters for accurate stats
    const statsQuery: any = { storeId: store._id };
    
    // Apply date filters to stats as well
    if (startDate || endDate) {
      statsQuery.createdAt = {};
      if (startDate) {
        statsQuery.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        statsQuery.createdAt.$lte = new Date(endDate as string);
      }
    }
    
    const allOrders = await StoreOrder.find(statsQuery).lean();
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const paidRevenue = allOrders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const ordersByStatus = {
      pending: allOrders.filter(order => order.paymentStatus === 'pending').length,
      paid: allOrders.filter(order => order.paymentStatus === 'paid').length,
      refunded: allOrders.filter(order => order.paymentStatus === 'refunded').length,
      unfulfilled: allOrders.filter(order => order.fulfillmentStatus === 'pending').length,
      fulfilled: allOrders.filter(order => order.fulfillmentStatus === 'fulfilled').length,
      partial: allOrders.filter(order => order.fulfillmentStatus === 'shipped').length,
    };

    // Transform internal store orders to match Shopify order format
    const transformedOrders = orders.map((order) => {
      const orderNumber = parseInt(order.orderId.split('-').pop() || '0', 10);
      return {
        id: orderNumber, // Use order number as ID
        name: order.orderId,
        orderNumber: orderNumber,
        email: order.customer.email || '',
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        totalPrice: (order.total / 100).toFixed(2), // Convert paise to rupees
        subtotalPrice: (order.subtotal / 100).toFixed(2),
        totalTax: '0.00',
        currency: order.currency || 'INR',
        financialStatus: order.paymentStatus === 'paid' ? 'paid' : order.paymentStatus === 'pending' ? 'pending' : 'refunded',
        fulfillmentStatus: order.fulfillmentStatus || 'pending',
        customer: {
          id: 0,
          email: order.customer.email || '',
          firstName: order.customer.name?.split(' ')[0] || '',
          lastName: order.customer.name?.split(' ').slice(1).join(' ') || '',
          fullName: order.customer.name || '',
        },
        lineItems: order.items.map((item, idx) => ({
          id: idx + 1,
          title: item.title,
          quantity: item.quantity,
          price: (item.price / 100).toFixed(2), // Convert paise to rupees
          variantTitle: item.variant || '',
          sku: '',
        })),
        shippingAddress: order.shippingAddress ? {
          address1: order.shippingAddress.address1 || '',
          city: order.shippingAddress.city || '',
          province: order.shippingAddress.state || '',
          country: order.shippingAddress.country || '',
          zip: order.shippingAddress.zip || '',
          formatted: [
            order.shippingAddress.address1,
            order.shippingAddress.address2,
            order.shippingAddress.city,
            order.shippingAddress.state,
            order.shippingAddress.zip,
            order.shippingAddress.country,
          ].filter(Boolean).join(', '),
        } : null,
        isInternalStore: true, // Flag to identify internal store orders
        storeName: store.name,
        storeSlug: store.slug,
      };
    });

    res.status(200).json({
      success: true,
      data: transformedOrders,
      stats: {
        totalRevenue,
        paidRevenue,
        currency: store.currency || 'INR',
        ordersByStatus,
      },
      store: {
        id: (store._id as mongoose.Types.ObjectId).toString(),
        name: store.name,
        domain: store.slug,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
