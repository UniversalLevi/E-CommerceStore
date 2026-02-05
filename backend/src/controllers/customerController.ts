import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Customer } from '../models/Customer';
import { Store } from '../models/Store';
import { StoreOrder } from '../models/StoreOrder';
import { createError } from '../middleware/errorHandler';

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

    // Verify ownership or admin
    const isOwner = store.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    if (store.status !== 'active') {
      throw createError('Store is not active', 400);
    }

    // Fetch all orders from internal store
    const orders = await StoreOrder.find({ storeId: store._id }).lean();

    // Extract unique customers from orders
    const customerMap = new Map<string, any>();

    for (const order of orders) {
      const email = order.customer.email?.toLowerCase();
      if (!email) continue;

      if (!customerMap.has(email)) {
        const nameParts = order.customer.name?.split(' ') || [];
        customerMap.set(email, {
          email: order.customer.email,
          phone: order.customer.phone,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          fullName: order.customer.name || '',
          orders: [],
          totalSpent: 0,
        });
      }

      const customer = customerMap.get(email)!;
      customer.orders.push(order._id);
      customer.totalSpent += order.total;
    }

    // Process and save customers
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [email, customerData] of customerMap.entries()) {
      try {
        const customerRecord = {
          storeId: store._id,
          owner: store.owner,
          email: customerData.email,
          phone: customerData.phone,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          fullName: customerData.fullName,
          acceptsMarketing: false,
          totalSpent: customerData.totalSpent / 100, // Convert from paise to rupees
          totalOrders: customerData.orders.length,
          tags: [],
          address: undefined,
          metadata: {},
          lastSyncedAt: new Date(),
        };

        const existingCustomer = await Customer.findOne({
          storeId: store._id,
          email: email.toLowerCase(),
        });

        if (existingCustomer) {
          // Update existing customer
          Object.assign(existingCustomer, customerRecord);
          await existingCustomer.save();
          updated++;
        } else {
          // Create new customer
          await Customer.create(customerRecord);
          created++;
        }
      } catch (error: any) {
        console.error(`Error processing customer ${email}:`, error);
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${customerMap.size} customers from ${orders.length} orders`,
      data: {
        total: customerMap.size,
        created,
        updated,
        skipped,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get customers for a user (from their stores)
 * GET /api/customers
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

    const { storeId, page = 1, limit = 50, search, acceptsMarketing } = req.query;

    const query: any = {
      owner: (req.user as any)._id,
    };

    if (storeId) {
      query.storeId = storeId;
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
        .populate('storeId', 'name slug')
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
 * Get customer statistics
 * GET /api/customers/stats
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

    const { storeId } = req.query;

    const query: any = {
      owner: (req.user as any)._id,
    };

    if (storeId) {
      query.storeId = storeId;
    }

    const [total, withEmail, withPhone, acceptsMarketing, totalSpent, totalOrders] =
      await Promise.all([
        Customer.countDocuments(query),
        Customer.countDocuments({ ...query, email: { $exists: true, $ne: null } }),
        Customer.countDocuments({ ...query, phone: { $exists: true, $ne: null } }),
        Customer.countDocuments({ ...query, acceptsMarketing: true }),
        Customer.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$totalSpent' } } },
        ]),
        Customer.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$totalOrders' } } },
        ]),
      ]);

    res.json({
      success: true,
      data: {
        total,
        withEmail,
        withPhone,
        acceptsMarketing,
        totalSpent: totalSpent[0]?.total || 0,
        totalOrders: totalOrders[0]?.total || 0,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

