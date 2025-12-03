import { Response, NextFunction } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { Order, IOrder, ZenStatus } from '../models/Order';
import { ZenOrder } from '../models/ZenOrder';
import { Wallet } from '../models/Wallet';
import { WalletTransaction } from '../models/WalletTransaction';
import { decrypt } from '../utils/encryption';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

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
 * Transform Shopify order to our response format
 */
function transformOrder(order: ShopifyOrder, storeInfo?: { id: string; name: string; domain: string }): OrderResponse {
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
    lineItems: order.line_items.map(item => ({
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
    fulfillments: order.fulfillments?.map(f => ({
      id: f.id,
      status: f.status,
      createdAt: f.created_at,
      trackingNumber: f.tracking_number,
      trackingUrl: f.tracking_url,
    })) || [],
    ...(storeInfo && {
      storeId: storeInfo.id,
      storeName: storeInfo.name,
      shopDomain: storeInfo.domain,
    }),
  };
}

/**
 * List orders for a specific store
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
    const { status, fulfillmentStatus, limit = '50', since_id, startDate, endDate } = req.query;

    // Get store connection
    const store = await StoreConnection.findById(storeId);
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
      throw createError('Store connection is not active', 400);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // Build base URL for fetching orders with pagination
    let baseUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json?limit=250`;
    
    if (status && status !== 'any') {
      baseUrl += `&status=${status}`;
    } else {
      baseUrl += '&status=any';
    }
    
    if (fulfillmentStatus && fulfillmentStatus !== 'any') {
      baseUrl += `&fulfillment_status=${fulfillmentStatus}`;
    }
    
    // Add date filters
    if (startDate) {
      baseUrl += `&created_at_min=${startDate}`;
    }
    if (endDate) {
      baseUrl += `&created_at_max=${endDate}`;
    }

    // Fetch ALL orders with pagination
    const allOrders: ShopifyOrder[] = [];
    let hasNextPage = true;
    let pageInfo: string | null = null;

    while (hasNextPage) {
      let currentUrl = baseUrl;
      if (pageInfo) {
        // When using page_info, we need to use a different URL format
        currentUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json?limit=250&page_info=${pageInfo}`;
      }

      const response = await axios.get(currentUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      if (response.data?.orders) {
        allOrders.push(...response.data.orders);
      }

      // Check for next page using Link header
      const linkHeader = response.headers['link'];
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/page_info=([^&>]+)/);
        if (nextMatch) {
          pageInfo = nextMatch[1];
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      // Small delay to avoid rate limiting
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    const transformedOrders = allOrders.map((order: ShopifyOrder) => transformOrder(order));

    // Calculate stats - only count paid/authorized for revenue
    const paidRevenue = allOrders
      .filter((o: ShopifyOrder) => o.financial_status === 'paid' || o.financial_status === 'authorized')
      .reduce((sum: number, order: ShopifyOrder) => sum + parseFloat(order.total_price || '0'), 0);

    const totalRevenue = allOrders.reduce((sum: number, order: ShopifyOrder) => {
      return sum + parseFloat(order.total_price || '0');
    }, 0);

    const ordersByStatus = {
      pending: allOrders.filter((o: ShopifyOrder) => o.financial_status === 'pending').length,
      paid: allOrders.filter((o: ShopifyOrder) => o.financial_status === 'paid').length,
      authorized: allOrders.filter((o: ShopifyOrder) => o.financial_status === 'authorized').length,
      refunded: allOrders.filter((o: ShopifyOrder) => o.financial_status === 'refunded').length,
      partially_refunded: allOrders.filter((o: ShopifyOrder) => o.financial_status === 'partially_refunded').length,
      voided: allOrders.filter((o: ShopifyOrder) => o.financial_status === 'voided').length,
      unfulfilled: allOrders.filter((o: ShopifyOrder) => !o.fulfillment_status || o.fulfillment_status === null).length,
      fulfilled: allOrders.filter((o: ShopifyOrder) => o.fulfillment_status === 'fulfilled').length,
      partial: allOrders.filter((o: ShopifyOrder) => o.fulfillment_status === 'partial').length,
    };

    res.json({
      success: true,
      count: transformedOrders.length,
      data: transformedOrders,
      stats: {
        totalRevenue,
        paidRevenue, // Only paid/authorized orders
        currency: allOrders[0]?.currency || 'USD',
        ordersByStatus,
      },
      store: {
        id: store._id,
        name: store.storeName,
        domain: store.shopDomain,
      },
    });
  } catch (error: any) {
    if (error.response?.status === 401) {
      return next(createError('Shopify authentication failed. Please check store credentials.', 401));
    }
    if (error.response?.status === 429) {
      return next(createError('Rate limit exceeded. Please try again later.', 429));
    }
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

    const stores = await StoreConnection.find(query)
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

    // Fetch orders from all stores with pagination
    const allOrdersPromises = stores.map(async (store) => {
      try {
        const accessToken = decrypt(store.accessToken);
        const apiVersion = store.apiVersion || '2024-01';
        
        let baseUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json?status=any&limit=250`;
        
        // Add date filters
        if (startDate) {
          baseUrl += `&created_at_min=${startDate}`;
        }
        if (endDate) {
          baseUrl += `&created_at_max=${endDate}`;
        }

        // Fetch ALL orders with pagination
        const storeOrders: ShopifyOrder[] = [];
        let hasNextPage = true;
        let pageInfo: string | null = null;

        while (hasNextPage) {
          let currentUrl = baseUrl;
          if (pageInfo) {
            currentUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json?limit=250&page_info=${pageInfo}`;
          }

          const response = await axios.get(currentUrl, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          });

          if (response.data?.orders) {
            storeOrders.push(...response.data.orders);
          }

          // Check for next page
          const linkHeader = response.headers['link'];
          if (linkHeader && linkHeader.includes('rel="next"')) {
            const nextMatch = linkHeader.match(/page_info=([^&>]+)/);
            if (nextMatch) {
              pageInfo = nextMatch[1];
            } else {
              hasNextPage = false;
            }
          } else {
            hasNextPage = false;
          }

          if (hasNextPage) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        // Calculate stats - only paid/authorized for revenue
        const paidRevenue = storeOrders
          .filter((o: ShopifyOrder) => o.financial_status === 'paid' || o.financial_status === 'authorized')
          .reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0);

        return {
          store: {
            id: store._id.toString(),
            name: store.storeName,
            domain: store.shopDomain,
            owner: store.owner,
          },
          orders: storeOrders.map((order: ShopifyOrder) => 
            transformOrder(order, {
              id: store._id.toString(),
              name: store.storeName,
              domain: store.shopDomain,
            })
          ),
          stats: {
            totalOrders: storeOrders.length,
            totalRevenue: storeOrders.reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0),
            paidRevenue,
            currency: storeOrders[0]?.currency || 'USD',
          },
        };
      } catch (error: any) {
        console.error(`Failed to fetch orders for store ${store.storeName}:`, error.message);
        return {
          store: {
            id: store._id.toString(),
            name: store.storeName,
            domain: store.shopDomain,
            owner: store.owner,
          },
          orders: [],
          stats: { totalOrders: 0, totalRevenue: 0, paidRevenue: 0, currency: 'USD' },
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
        shopDomain: r.store.domain,
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

    // Get store connection
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // Fetch order from Shopify
    const response = await axios.get(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const order = response.data.order;
    if (!order) {
      throw createError('Order not found', 404);
    }

    res.json({
      success: true,
      data: transformOrder(order, {
        id: (store as any)._id.toString(),
        name: store.storeName,
        domain: store.shopDomain,
      }),
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    let response;
    const baseUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}`;

    if (action === 'cancel') {
      response = await axios.post(
        `${baseUrl}/cancel.json`,
        { reason: note || 'other', email: true },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (action === 'close') {
      response = await axios.post(
        `${baseUrl}/close.json`,
        {},
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
    } else if (action === 'open') {
      response = await axios.post(
        `${baseUrl}/open.json`,
        {},
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
    }

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
      data: response?.data?.order ? transformOrder(response.data.order) : null,
    });
  } catch (error: any) {
    if (error.response?.data?.errors) {
      return next(createError(`Shopify error: ${JSON.stringify(error.response.data.errors)}`, 400));
    }
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // First, get the order
    const orderResponse = await axios.get(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const order = orderResponse.data.order;
    if (!order) {
      throw createError('Order not found', 404);
    }

    // Check if order is already fulfilled
    if (order.fulfillment_status === 'fulfilled') {
      throw createError('Order is already fully fulfilled', 400);
    }

    // Get fulfillment orders
    const fulfillmentOrdersResponse = await axios.get(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}/fulfillment_orders.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const fulfillmentOrders = fulfillmentOrdersResponse.data.fulfillment_orders || [];
    
    // Find any fulfillable order (open, in_progress, or scheduled)
    const fulfillableOrder = fulfillmentOrders.find(
      (fo: any) => ['open', 'in_progress', 'scheduled'].includes(fo.status)
    );

    if (!fulfillableOrder) {
      // Check if there are any line items that can be fulfilled
      const allFulfilled = fulfillmentOrders.every(
        (fo: any) => fo.status === 'closed' || fo.status === 'cancelled'
      );
      
      if (allFulfilled) {
        throw createError('All items in this order have already been fulfilled or cancelled', 400);
      }
      
      throw createError('No fulfillable items found in this order', 400);
    }

    // Create fulfillment using the Fulfillment Orders API
    const fulfillmentData: any = {
      fulfillment: {
        line_items_by_fulfillment_order: [
          {
            fulfillment_order_id: fulfillableOrder.id,
          }
        ],
        notify_customer: notifyCustomer,
      },
    };

    const fulfillResponse = await axios.post(
      `https://${store.shopDomain}/admin/api/${apiVersion}/fulfillments.json`,
      fulfillmentData,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Add note to order if provided
    if (note) {
      try {
        await axios.put(
          `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
          {
            order: {
              id: orderId,
              note: `${order.note ? order.note + '\n' : ''}[Fulfilled] ${note}`,
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (noteError) {
        console.log('Could not add note to order:', noteError);
      }
    }

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'ORDER_FULFILL',
      success: true,
      details: {
        orderId,
        orderName: order.name,
        fulfillmentId: fulfillResponse.data.fulfillment?.id,
        note,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Order fulfilled successfully',
      data: {
        fulfillment: fulfillResponse.data.fulfillment,
      },
    });
  } catch (error: any) {
    console.error('Fulfillment error:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      return next(createError(`Shopify error: ${JSON.stringify(error.response.data.errors)}`, 400));
    }
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // Cancel the fulfillment
    const response = await axios.post(
      `https://${store.shopDomain}/admin/api/${apiVersion}/fulfillments/${fulfillmentId}/cancel.json`,
      {},
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

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
      data: response.data.fulfillment,
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
    const stores = await StoreConnection.find({ status: 'active' })
      .populate('owner', 'email name')
      .lean();

    // Fetch ALL orders from all stores with pagination
    const revenuePromises = stores.map(async (store) => {
      try {
        const accessToken = decrypt(store.accessToken);
        const apiVersion = store.apiVersion || '2024-01';

        // Build base URL with filters
        let baseUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json?status=any&limit=250`;
        if (startDate) {
          baseUrl += `&created_at_min=${startDate}`;
        }
        if (endDate) {
          baseUrl += `&created_at_max=${endDate}`;
        }

        // Fetch ALL orders with pagination
        const allOrders: ShopifyOrder[] = [];
        let hasNextPage = true;
        let pageInfo: string | null = null;

        while (hasNextPage) {
          let currentUrl = baseUrl;
          if (pageInfo) {
            // When using page_info, only use page_info and limit
            currentUrl = `https://${store.shopDomain}/admin/api/${apiVersion}/orders.json?limit=250&page_info=${pageInfo}`;
          }

          const response = await axios.get(currentUrl, {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          });

          if (response.data?.orders) {
            allOrders.push(...response.data.orders);
          }

          // Check for next page
          const linkHeader = response.headers['link'];
          if (linkHeader && linkHeader.includes('rel="next"')) {
            const nextMatch = linkHeader.match(/page_info=([^&>]+)/);
            if (nextMatch) {
              pageInfo = nextMatch[1];
            } else {
              hasNextPage = false;
            }
          } else {
            hasNextPage = false;
          }

          if (hasNextPage) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        console.log(`Revenue: Fetched ${allOrders.length} orders from ${store.storeName}`);
        
        // Calculate revenue by status
        const revenueByStatus = {
          paid: allOrders
            .filter((o: ShopifyOrder) => o.financial_status === 'paid')
            .reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0),
          pending: allOrders
            .filter((o: ShopifyOrder) => o.financial_status === 'pending')
            .reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0),
          refunded: allOrders
            .filter((o: ShopifyOrder) => o.financial_status === 'refunded')
            .reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0),
          authorized: allOrders
            .filter((o: ShopifyOrder) => o.financial_status === 'authorized')
            .reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0),
        };

        return {
          storeId: store._id.toString(),
          storeName: store.storeName,
          shopDomain: store.shopDomain,
          owner: store.owner,
          totalOrders: allOrders.length,
          totalRevenue: allOrders.reduce((sum: number, o: ShopifyOrder) => sum + parseFloat(o.total_price || '0'), 0),
          revenueByStatus,
          currency: allOrders[0]?.currency || 'USD',
          ordersByFulfillment: {
            unfulfilled: allOrders.filter((o: ShopifyOrder) => !o.fulfillment_status || o.fulfillment_status === 'unfulfilled').length,
            fulfilled: allOrders.filter((o: ShopifyOrder) => o.fulfillment_status === 'fulfilled').length,
            partial: allOrders.filter((o: ShopifyOrder) => o.fulfillment_status === 'partial').length,
          },
        };
      } catch (error: any) {
        console.error(`Failed to fetch revenue for store ${store.storeName}:`, error.message);
        return {
          storeId: store._id.toString(),
          storeName: store.storeName,
          shopDomain: store.shopDomain,
          owner: store.owner,
          totalOrders: 0,
          totalRevenue: 0,
          revenueByStatus: { paid: 0, pending: 0, refunded: 0, authorized: 0 },
          currency: 'USD',
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
      storeName: s.storeName,
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // First, get the current order
    const orderResponse = await axios.get(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    const order = orderResponse.data.order;
    if (!order) {
      throw createError('Order not found', 404);
    }

    const timestamp = new Date().toISOString();
    const completedBy = req.user.email || 'Admin';
    let paymentMarked = false;

    // If payment should be marked and order is not already paid
    if (paymentReceived && order.financial_status !== 'paid') {
      try {
        // Use GraphQL orderMarkAsPaid mutation - the official way to mark orders as paid
        const graphqlEndpoint = `https://${store.shopDomain}/admin/api/${apiVersion}/graphql.json`;
        
        // Convert REST order ID to GraphQL Global ID
        const orderGid = `gid://shopify/Order/${orderId}`;
        
        const markAsPaidMutation = `
          mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
            orderMarkAsPaid(input: $input) {
              order {
                id
                displayFinancialStatus
                fullyPaid
              }
              userErrors {
                field
                message
              }
            }
          }
        `;
        
        const graphqlResponse = await axios.post(
          graphqlEndpoint,
          {
            query: markAsPaidMutation,
            variables: {
              input: {
                id: orderGid,
              },
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const result = graphqlResponse.data;
        
        if (result.data?.orderMarkAsPaid?.order) {
          paymentMarked = true;
          console.log('Payment marked via GraphQL orderMarkAsPaid:', result.data.orderMarkAsPaid.order);
        } else if (result.data?.orderMarkAsPaid?.userErrors?.length > 0) {
          console.log('GraphQL userErrors:', result.data.orderMarkAsPaid.userErrors);
          // Try REST API fallback
          await tryRestApiPayment();
        } else if (result.errors) {
          console.log('GraphQL errors:', result.errors);
          // Try REST API fallback
          await tryRestApiPayment();
        }
        
        async function tryRestApiPayment() {
          // Fallback: Try REST API with transaction
          try {
            const transactionsResponse = await axios.get(
              `https://${store!.shopDomain}/admin/api/${apiVersion}/orders/${orderId}/transactions.json`,
              {
                headers: {
                  'X-Shopify-Access-Token': accessToken,
                  'Content-Type': 'application/json',
                },
              }
            );

            const transactions = transactionsResponse.data.transactions || [];
            const authTransaction = transactions.find(
              (t: any) => t.kind === 'authorization' && t.status === 'success'
            );

            if (authTransaction) {
              // Capture existing authorization
              await axios.post(
                `https://${store!.shopDomain}/admin/api/${apiVersion}/orders/${orderId}/transactions.json`,
                {
                  transaction: {
                    kind: 'capture',
                    parent_id: authTransaction.id,
                  },
                },
                {
                  headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json',
                  },
                }
              );
              paymentMarked = true;
              console.log('Payment marked via REST capture');
            }
          } catch (restError: any) {
            console.log('REST fallback failed:', restError.response?.data || restError.message);
          }
        }
      } catch (paymentError: any) {
        console.log('Payment marking error:', paymentError.response?.data || paymentError.message);
        // If all methods fail, we'll still complete the order with tags
      }
    } else if (order.financial_status === 'paid') {
      paymentMarked = true; // Already paid
    }

    // Build completion note
    const completionNote = [
      order.note || '',
      `\n[COMPLETED - ${timestamp}]`,
      paymentMarked ? 'Payment received and verified.' : (paymentReceived ? 'Payment marked (manual).' : ''),
      note ? `Note: ${note}` : '',
      `Marked by: ${completedBy}`,
    ].filter(Boolean).join('\n');

    // Get existing tags and add completion tags
    const existingTags = order.tags ? order.tags.split(', ') : [];
    const newTags = [...new Set([
      ...existingTags,
      'completed',
      paymentMarked ? 'paid' : '',
      paymentReceived ? 'payment-received' : '',
    ].filter(Boolean))].join(', ');

    // Update order with tags and note
    await axios.put(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
      {
        order: {
          id: orderId,
          note: completionNote,
          tags: newTags,
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Close the order (marks it as archived/completed in Shopify)
    const closeResponse = await axios.post(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}/close.json`,
      {},
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      storeId: store._id,
      action: 'ORDER_COMPLETED',
      success: true,
      details: {
        orderId,
        orderName: order.name,
        totalPrice: order.total_price,
        currency: order.currency,
        paymentReceived,
        paymentMarked,
        previousFinancialStatus: order.financial_status,
        note,
        completedBy,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: paymentMarked 
        ? 'Order marked as completed and paid successfully' 
        : 'Order marked as completed (payment status unchanged)',
      data: {
        order: closeResponse.data.order ? transformOrder(closeResponse.data.order) : null,
        completedAt: timestamp,
        paymentReceived,
        paymentMarked,
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // Reopen the order
    const response = await axios.post(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}/open.json`,
      {},
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update note if provided
    if (note) {
      const order = response.data.order;
      const timestamp = new Date().toISOString();
      const reopenNote = [
        order.note || '',
        `\n[REOPENED - ${timestamp}]`,
        `Reason: ${note}`,
        `Reopened by: ${req.user.email || 'Admin'}`,
      ].filter(Boolean).join('\n');

      // Remove completed tags
      const existingTags = order.tags ? order.tags.split(', ') : [];
      const newTags = existingTags
        .filter((tag: string) => !['completed', 'payment-received'].includes(tag.toLowerCase()))
        .join(', ');

      await axios.put(
        `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
        {
          order: {
            id: orderId,
            note: reopenNote,
            tags: newTags,
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );
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
      data: response.data.order ? transformOrder(response.data.order) : null,
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // Update order note
    const response = await axios.put(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
      {
        order: {
          id: orderId,
          note,
        },
      },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      message: 'Note added successfully',
      data: transformOrder(response.data.order),
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

  const orderData = {
    shopifyOrderId: shopifyOrder.id,
    shopifyOrderName: shopifyOrder.name,
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
  const order = await Order.findOneAndUpdate(
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
    const store = await StoreConnection.findById(storeId);
    if (!store) {
      throw createError('Store not found', 404);
    }

    // Check ownership or admin
    const isOwner = store.owner.toString() === userId.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    // Decrypt access token
    const accessToken = decrypt(store.accessToken);
    const apiVersion = store.apiVersion || '2024-01';

    // Fetch order from Shopify
    const response = await axios.get(
      `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const shopifyOrder = response.data.order;
    if (!shopifyOrder) {
      throw createError('Order not found', 404);
    }

    // Sync to local database
    const localOrder = await syncShopifyOrderToLocal(shopifyOrder, store, userId);

    res.json({
      success: true,
      data: {
        localOrder: {
          id: localOrder._id,
          shopifyOrderId: localOrder.shopifyOrderId,
          shopifyOrderName: localOrder.shopifyOrderName,
          zenStatus: localOrder.zenStatus,
          productCost: localOrder.productCost,
          shippingCost: localOrder.shippingCost,
          walletChargeAmount: localOrder.walletChargeAmount,
          totalPrice: localOrder.totalPrice,
          currency: localOrder.currency,
        },
        shopifyOrder: transformOrder(shopifyOrder),
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
    const store = await StoreConnection.findById(storeId);
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
      // Fetch from Shopify and sync
      const accessToken = decrypt(store.accessToken);
      const apiVersion = store.apiVersion || '2024-01';

      const response = await axios.get(
        `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.order) {
        throw createError('Order not found', 404);
      }

      const syncedOrder = await syncShopifyOrderToLocal(response.data.order, store, userId);
      if (!syncedOrder) {
        throw createError('Failed to sync order', 500);
      }
      localOrder = syncedOrder;
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
    const store = await StoreConnection.findById(storeId);
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
      // Fetch from Shopify and sync
      const accessToken = decrypt(store.accessToken);
      const apiVersion = store.apiVersion || '2024-01';

      const response = await axios.get(
        `https://${store.shopDomain}/admin/api/${apiVersion}/orders/${orderId}.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data.order) {
        throw createError('Order not found', 404);
      }

      const syncedOrder = await syncShopifyOrderToLocal(response.data.order, store, userId);
      if (!syncedOrder) {
        throw createError('Failed to sync order', 500);
      }
      localOrder = syncedOrder;
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
        shopifyOrderName: order.shopifyOrderName,
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
      storeName: store.storeName,
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
      message: `Order ${order.shopifyOrderName} has been submitted for ZEN fulfillment. ₹${(requiredAmount / 100).toLocaleString('en-IN')} deducted from wallet.`,
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
    const store = await StoreConnection.findById(storeId);
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
