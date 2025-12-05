import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Customer } from '../models/Customer';
import { StoreConnection } from '../models/StoreConnection';
import { decrypt } from '../utils/encryption';
import { createError } from '../middleware/errorHandler';
import axios from 'axios';

/**
 * Sync customers from Shopify store
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
    const storeConnection = await StoreConnection.findById(storeId);

    if (!storeConnection) {
      throw createError('Store connection not found', 404);
    }

    // Verify ownership or admin
    const isOwner = storeConnection.owner.toString() === (req.user as any)._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw createError('You do not have access to this store', 403);
    }

    if (storeConnection.status !== 'active') {
      throw createError('Store connection is not active', 400);
    }

    // Decrypt access token
    const accessToken = decrypt(storeConnection.accessToken);
    const shopDomain = storeConnection.shopDomain;
    const apiVersion = storeConnection.apiVersion || '2024-01';

    let allCustomers: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    // Fetch all customers using pagination
    while (hasNextPage) {
      const url = `https://${shopDomain}/admin/api/${apiVersion}/customers.json`;
      const params: any = { limit: 250 };
      
      if (cursor) {
        params.page_info = cursor;
      }

      const response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        params,
        timeout: 30000,
      });

      if (response.data?.customers) {
        allCustomers = allCustomers.concat(response.data.customers);
      }

      // Check for next page
      const linkHeader = response.headers['link'];
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(/<([^>]+)>; rel="next"/);
        if (nextMatch) {
          const nextUrl = new URL(nextMatch[1]);
          cursor = nextUrl.searchParams.get('page_info');
          hasNextPage = !!cursor;
        } else {
          hasNextPage = false;
        }
      } else {
        hasNextPage = false;
      }

      // Rate limiting - wait a bit between requests
      if (hasNextPage) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Process and save customers
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const shopifyCustomer of allCustomers) {
      try {
        const customerData = {
          storeConnectionId: storeConnection._id,
          owner: storeConnection.owner,
          shopifyCustomerId: shopifyCustomer.id.toString(),
          email: shopifyCustomer.email || undefined,
          phone: shopifyCustomer.phone || undefined,
          firstName: shopifyCustomer.first_name || undefined,
          lastName: shopifyCustomer.last_name || undefined,
          fullName: shopifyCustomer.first_name && shopifyCustomer.last_name
            ? `${shopifyCustomer.first_name} ${shopifyCustomer.last_name}`
            : shopifyCustomer.first_name || shopifyCustomer.last_name || undefined,
          acceptsMarketing: shopifyCustomer.accepts_marketing || false,
          totalSpent: parseFloat(shopifyCustomer.total_spent || '0'),
          totalOrders: parseInt(shopifyCustomer.orders_count || '0', 10),
          tags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map((t: string) => t.trim()) : [],
          address: shopifyCustomer.default_address
            ? {
                address1: shopifyCustomer.default_address.address1,
                address2: shopifyCustomer.default_address.address2,
                city: shopifyCustomer.default_address.city,
                province: shopifyCustomer.default_address.province,
                country: shopifyCustomer.default_address.country,
                zip: shopifyCustomer.default_address.zip,
              }
            : undefined,
          metadata: {
            shopifyData: shopifyCustomer,
          },
          lastSyncedAt: new Date(),
        };

        const existingCustomer = await Customer.findOne({
          storeConnectionId: storeConnection._id,
          shopifyCustomerId: shopifyCustomer.id.toString(),
        });

        if (existingCustomer) {
          // Update existing customer
          Object.assign(existingCustomer, customerData);
          await existingCustomer.save();
          updated++;
        } else {
          // Create new customer
          await Customer.create(customerData);
          created++;
        }
      } catch (error: any) {
        console.error(`Error processing customer ${shopifyCustomer.id}:`, error);
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Synced ${allCustomers.length} customers`,
      data: {
        total: allCustomers.length,
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
      query.storeConnectionId = storeId;
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
        .populate('storeConnectionId', 'storeName shopDomain')
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
      query.storeConnectionId = { $in: storeIdArray };
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
        .populate('storeConnectionId', 'storeName shopDomain owner')
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
      query.storeConnectionId = storeId;
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

