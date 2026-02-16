import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { ManualOrder, IManualOrderItem } from '../models/ManualOrder';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { createError } from '../middleware/errorHandler';

function getAllowedProductIds(userStores: { productId: mongoose.Types.ObjectId }[]): Set<string> {
  const ids = new Set<string>();
  for (const s of userStores || []) {
    if (s.productId) ids.add(s.productId.toString());
  }
  return ids;
}

async function validateItemsBelongToUser(
  userId: mongoose.Types.ObjectId,
  items: { productId: string; title: string; quantity: number; price: number }[]
): Promise<void> {
  const user = await User.findById(userId).lean();
  if (!user) throw createError('User not found', 404);
  const allowedIds = getAllowedProductIds((user as any).stores || []);
  for (const item of items) {
    if (!allowedIds.has(item.productId)) {
      throw createError(`Product ${item.productId} is not in your product list`, 400);
    }
    const product = await Product.findById(item.productId).lean();
    if (!product) throw createError(`Product ${item.productId} not found`, 400);
  }
}

function computeTotals(items: IManualOrderItem[], shippingPaise: number): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { subtotal, total: subtotal + shippingPaise };
}

/**
 * GET /api/manual-orders – list manual orders for authenticated user
 */
export const list = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw createError('Authentication required', 401);
    const userId = (req.user as any)._id;
    const { status, startDate, endDate, limit = '50', page = '1' } = req.query;

    const query: any = { userId };
    if (status && status !== 'all') query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      ManualOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      ManualOrder.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * POST /api/manual-orders – create manual order
 */
export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw createError('Authentication required', 401);
    const userId = (req.user as any)._id;
    const { customer, shippingAddress, items, shipping = 0, currency = 'INR', status = 'pending' } = req.body;

    if (!customer?.name || !customer?.email || !customer?.phone) {
      throw createError('Customer name, email and phone are required', 400);
    }
    if (
      !shippingAddress?.name ||
      !shippingAddress?.address1 ||
      !shippingAddress?.city ||
      !shippingAddress?.state ||
      !shippingAddress?.zip ||
      !shippingAddress?.country ||
      !shippingAddress?.phone
    ) {
      throw createError('Complete shipping address is required', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw createError('At least one order item is required', 400);
    }

    const normalizedItems: IManualOrderItem[] = items.map((i: any) => ({
      productId: new mongoose.Types.ObjectId(i.productId),
      title: String(i.title || '').trim(),
      quantity: Math.max(1, parseInt(String(i.quantity), 10) || 1),
      price: Math.max(0, Math.round(Number(i.price) || 0)),
    }));

    await validateItemsBelongToUser(userId, normalizedItems as any);
    const shippingPaise = Math.max(0, Math.round(Number(shipping) || 0));
    const { subtotal, total } = computeTotals(normalizedItems, shippingPaise);

    const order = await ManualOrder.create({
      userId,
      orderId: '',
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
      },
      shippingAddress: {
        name: shippingAddress.name.trim(),
        address1: shippingAddress.address1.trim(),
        address2: shippingAddress.address2?.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        zip: shippingAddress.zip.trim(),
        country: shippingAddress.country.trim(),
        phone: shippingAddress.phone.trim(),
      },
      items: normalizedItems,
      subtotal,
      shipping: shippingPaise,
      total,
      currency: (currency || 'INR').toString().toUpperCase(),
      status: ['draft', 'pending', 'paid', 'fulfilled', 'cancelled'].includes(status) ? status : 'pending',
    });

    res.status(201).json({ success: true, data: order.toObject() });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/manual-orders/:id – get one manual order
 */
export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw createError('Authentication required', 401);
    const userId = (req.user as any)._id;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid order id', 400);
    }

    const order = await ManualOrder.findOne({ _id: id, userId }).lean();
    if (!order) throw createError('Manual order not found', 404);

    res.status(200).json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
};

/**
 * PUT /api/manual-orders/:id – update manual order
 */
export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw createError('Authentication required', 401);
    const userId = (req.user as any)._id;
    const id = req.params.id;
    const { customer, shippingAddress, items, shipping, currency, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid order id', 400);
    }

    const order = await ManualOrder.findOne({ _id: id, userId });
    if (!order) throw createError('Manual order not found', 404);

    if (customer != null) {
      if (customer.name != null) order.customer.name = customer.name.trim();
      if (customer.email != null) order.customer.email = customer.email.trim().toLowerCase();
      if (customer.phone != null) order.customer.phone = customer.phone.trim();
    }
    if (shippingAddress != null) {
      if (shippingAddress.name != null) order.shippingAddress.name = shippingAddress.name.trim();
      if (shippingAddress.address1 != null) order.shippingAddress.address1 = shippingAddress.address1.trim();
      if (shippingAddress.address2 !== undefined) order.shippingAddress.address2 = shippingAddress.address2?.trim();
      if (shippingAddress.city != null) order.shippingAddress.city = shippingAddress.city.trim();
      if (shippingAddress.state != null) order.shippingAddress.state = shippingAddress.state.trim();
      if (shippingAddress.zip != null) order.shippingAddress.zip = shippingAddress.zip.trim();
      if (shippingAddress.country != null) order.shippingAddress.country = shippingAddress.country.trim();
      if (shippingAddress.phone != null) order.shippingAddress.phone = shippingAddress.phone.trim();
    }
    if (Array.isArray(items) && items.length > 0) {
      const normalizedItems: IManualOrderItem[] = items.map((i: any) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        title: String(i.title || '').trim(),
        quantity: Math.max(1, parseInt(String(i.quantity), 10) || 1),
        price: Math.max(0, Math.round(Number(i.price) || 0)),
      }));
      await validateItemsBelongToUser(userId, normalizedItems as any);
      order.items = normalizedItems;
      const shippingPaise = Math.max(0, Math.round(Number(shipping ?? order.shipping) || 0));
      const { subtotal, total } = computeTotals(normalizedItems, shippingPaise);
      order.subtotal = subtotal;
      order.shipping = shippingPaise;
      order.total = total;
    } else if (shipping !== undefined) {
      const shippingPaise = Math.max(0, Math.round(Number(shipping) || 0));
      order.shipping = shippingPaise;
      order.total = order.subtotal + shippingPaise;
    }
    if (currency != null) order.currency = String(currency).toUpperCase();
    if (status != null && ['draft', 'pending', 'paid', 'fulfilled', 'cancelled'].includes(status)) {
      order.status = status;
    }

    await order.save();
    res.status(200).json({ success: true, data: order.toObject() });
  } catch (e) {
    next(e);
  }
};

/**
 * PATCH /api/manual-orders/:id/status – update status only
 */
export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw createError('Authentication required', 401);
    const userId = (req.user as any)._id;
    const id = req.params.id;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid order id', 400);
    }
    if (!status || !['draft', 'pending', 'paid', 'fulfilled', 'cancelled'].includes(status)) {
      throw createError('Valid status is required', 400);
    }

    const order = await ManualOrder.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status } },
      { new: true }
    ).lean();
    if (!order) throw createError('Manual order not found', 404);

    res.status(200).json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
};
