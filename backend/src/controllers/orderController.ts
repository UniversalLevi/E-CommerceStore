import { Response, NextFunction } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { decrypt } from '../utils/encryption';
import { createError } from '../middleware/errorHandler';

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
