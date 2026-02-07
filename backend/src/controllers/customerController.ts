import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Customer } from '../models/Customer';
import { Store } from '../models/Store';
import { StoreOrder } from '../models/StoreOrder';
import { createError } from '../middleware/errorHandler';

/**
 * Unique key for deduplication: prefer email, then phone, then one per order (guest).
 */
function orderCustomerKey(order: any): string {
  const email = order.customer?.email?.trim()?.toLowerCase();
  if (email) return `email:${email}`;
  const phone = order.customer?.phone?.trim();
  if (phone) return `phone:${phone}`;
  return `order:${order._id}`;
}

/**
 * Build unique customers map from orders (for list and stats).
 * Key = orderCustomerKey(order). Value = { fullName, email, phone, totalSpentPaise, orderCount }.
 */
function buildCustomersFromOrders(orders: any[]): Map<string, { fullName: string; email?: string; phone?: string; totalSpentPaise: number; orderCount: number }> {
  const map = new Map<string, { fullName: string; email?: string; phone?: string; totalSpentPaise: number; orderCount: number }>();
  for (const order of orders) {
    const key = orderCustomerKey(order);
    const c = order.customer || {};
    const fullName = (c.name || '').trim() || 'Guest';
    const email = c.email?.trim() || undefined;
    const phone = c.phone?.trim() || undefined;
    const total = order.total ?? 0;

    if (!map.has(key)) {
      map.set(key, { fullName, email, phone, totalSpentPaise: 0, orderCount: 0 });
    }
    const rec = map.get(key)!;
    rec.totalSpentPaise += total;
    rec.orderCount += 1;
  }
  return map;
}

/**
 * Shared: sync customers from StoreOrder into Customer collection for a store.
 * Includes ALL order customers (with email, phone only, or guest).
 */
async function syncCustomersFromOrders(store: { _id: any; owner: any }) {
  const orders = await StoreOrder.find({ storeId: store._id }).lean();
  const customerMap = new Map<string, any>();

  for (const order of orders) {
    const key = orderCustomerKey(order);
    const c = order.customer || {};
    const nameParts = (c.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (!customerMap.has(key)) {
      const email = c.email?.trim()?.toLowerCase();
      const phone = c.phone?.trim();
      // Unique email for DB: real email, or one placeholder per phone, or one per order (guest)
      let emailForRecord: string;
      if (email) {
        emailForRecord = email;
      } else if (phone) {
        emailForRecord = `phone-${phone}@placeholder.local`;
      } else {
        emailForRecord = `guest-${order._id}@placeholder.local`;
      }
      customerMap.set(key, {
        email: emailForRecord,
        phone: phone || undefined,
        firstName,
        lastName,
        fullName: (c.name || '').trim() || undefined,
        orders: [],
        totalSpent: 0,
      });
    }

    const customer = customerMap.get(key)!;
    customer.orders.push(order._id);
    customer.totalSpent += order.total ?? 0;
  }

  for (const [, customerData] of customerMap.entries()) {
    try {
      const emailForDb = customerData.email; // unique per store
      const customerRecord = {
        storeId: store._id,
        owner: store.owner,
        email: emailForDb,
        phone: customerData.phone,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        fullName: customerData.fullName,
        acceptsMarketing: false,
        totalSpent: customerData.totalSpent / 100,
        totalOrders: customerData.orders.length,
        tags: [],
        address: undefined,
        metadata: {},
        lastSyncedAt: new Date(),
      };

      const existingCustomer = await Customer.findOne({
        storeId: store._id,
        email: emailForDb,
      });

      if (existingCustomer) {
        Object.assign(existingCustomer, customerRecord);
        await existingCustomer.save();
      } else {
        await Customer.create(customerRecord);
      }
    } catch (error: any) {
      console.error(`Error syncing customer:`, error);
    }
  }

  return customerMap.size;
}

/**
 * Sync customers from internal store orders
 * POST /api/customers/sync/:storeId
 */
export const syncCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const storeId = req.params.storeId;
    const store = await Store.findById(storeId);

    if (!store) {
      throw createError('Store not found', 404);
    }

    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    if (store.status !== 'active') {
      throw createError('Store is not active', 400);
    }

    const totalSynced = await syncCustomersFromOrders(store);
    const orderCount = await StoreOrder.countDocuments({ storeId: store._id });

    res.json({
      success: true,
      message: `Synced ${totalSynced} customers from ${orderCount} orders`,
      data: {
        total: totalSynced,
        created: totalSynced,
        updated: 0,
        skipped: 0,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get customers by deriving unique users from internal store orders.
 * GET /api/customers — source: StoreOrder only. Unique by email, then phone, then one per order.
 */
export const getUserCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { storeId, page = 1, limit = 50, search } = req.query;
    const storeIdStr = typeof storeId === 'string' ? storeId : Array.isArray(storeId) ? storeId[0] : undefined;
    const pageNum = Number(page) || 1;
    const limitNum = Math.min(Number(limit) || 50, 100);

    // Use same store resolution as orders page: one store per user via owner
    let storeForOrders: { _id: any } | null = null;
    if (storeIdStr) {
      const store = await Store.findById(storeIdStr);
      if (store && store.owner.toString() === userId.toString()) {
        storeForOrders = store;
      }
    }
    if (!storeForOrders) {
      storeForOrders = await Store.findOne({ owner: userId });
    }

    if (!storeForOrders) {
      return res.json({
        success: true,
        data: {
          customers: [],
          pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
        },
      });
    }

    // All orders for this store — no limit, no date filter (same scope as "orders page" data)
    const orders = await StoreOrder.find({ storeId: storeForOrders._id }).lean();
    const customerMap = buildCustomersFromOrders(orders);

    let list = Array.from(customerMap.entries()).map(([key, rec]) => ({
      _id: key,
      fullName: rec.fullName,
      email: rec.email,
      phone: rec.phone,
      totalOrders: rec.orderCount,
      totalSpent: rec.totalSpentPaise / 100,
    }));

    const searchStr = typeof search === 'string' ? search.trim() : '';
    if (searchStr) {
      const lower = searchStr.toLowerCase();
      list = list.filter(
        (c) =>
          (c.fullName && c.fullName.toLowerCase().includes(lower)) ||
          (c.email && c.email.toLowerCase().includes(lower)) ||
          (c.phone && c.phone.includes(searchStr))
      );
    }

    list.sort((a, b) => b.totalSpent - a.totalSpent);
    const total = list.length;
    const skip = (pageNum - 1) * limitNum;
    const customers = list.slice(skip, skip + limitNum);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get all customers (admin only)
 * GET /api/admin/customers
 */
export const getAllCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw createError('Admin access required', 403);
    }

    const { storeIds, page = 1, limit = 50, search, acceptsMarketing } = req.query;

    const query: any = {};

    if (storeIds) {
      const storeIdArray = Array.isArray(storeIds) ? storeIds : [storeIds];
      query.storeId = { $in: storeIdArray };
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    if (acceptsMarketing === 'true') {
      query.acceptsMarketing = true;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .populate('storeId', 'name slug owner')
        .populate('owner', 'email mobile name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get customer statistics from internal store orders.
 * GET /api/customers/stats — source: StoreOrder only (unique customers + totals).
 */
export const getCustomerStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const storeIdRaw = req.query.storeId;
    const storeIdStr = typeof storeIdRaw === 'string' ? storeIdRaw : Array.isArray(storeIdRaw) ? storeIdRaw[0] : undefined;

    let storeForOrders: { _id: any } | null = null;
    if (storeIdStr) {
      const store = await Store.findById(storeIdStr);
      if (store && store.owner.toString() === userId.toString()) {
        storeForOrders = store;
      }
    }
    if (!storeForOrders) {
      storeForOrders = await Store.findOne({ owner: userId });
    }

    if (!storeForOrders) {
      return res.json({
        success: true,
        data: {
          total: 0,
          withEmail: 0,
          withPhone: 0,
          acceptsMarketing: 0,
          totalSpent: 0,
          totalOrders: 0,
        },
      });
    }

    const orders = await StoreOrder.find({ storeId: storeForOrders._id }).lean();
    const customerMap = buildCustomersFromOrders(orders);

    let withEmail = 0;
    let withPhone = 0;
    let totalSpentPaise = 0;
    for (const [, rec] of customerMap.entries()) {
      if (rec.email && !rec.email.includes('@placeholder')) withEmail += 1;
      if (rec.phone) withPhone += 1;
      totalSpentPaise += rec.totalSpentPaise;
    }

    res.json({
      success: true,
      data: {
        total: customerMap.size,
        withEmail,
        withPhone,
        acceptsMarketing: 0,
        totalSpent: totalSpentPaise / 100,
        totalOrders: orders.length,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

