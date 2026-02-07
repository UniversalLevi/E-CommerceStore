import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { ZenOrder, ZenOrderStatus } from '../models/ZenOrder';
import { Order } from '../models/Order';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

// Valid status transitions - flexible for admin operations
// Admins can move forward freely but cannot revert from terminal states
const TERMINAL_STATES: ZenOrderStatus[] = ['delivered', 'returned', 'cancelled'];

// Forward progression order
const STATUS_ORDER: ZenOrderStatus[] = [
  'pending',
  'sourcing',
  'sourced',
  'packing',
  'packed',
  'ready_for_dispatch',
  'dispatched',
  'shipped',
  'out_for_delivery',
  'delivered',
];

// RTO progression
const RTO_PROGRESSION: ZenOrderStatus[] = ['rto_initiated', 'rto_delivered', 'returned'];

// Get all valid transitions for a status (more permissive for admin)
const getValidTransitions = (currentStatus: ZenOrderStatus): ZenOrderStatus[] => {
  // Terminal states cannot transition
  if (TERMINAL_STATES.includes(currentStatus)) {
    return [];
  }

  // From failed, can go back to pending to retry
  if (currentStatus === 'failed') {
    return ['pending', 'cancelled'];
  }

  // RTO progression
  if (RTO_PROGRESSION.includes(currentStatus)) {
    const currentIndex = RTO_PROGRESSION.indexOf(currentStatus);
    const forwardStates = RTO_PROGRESSION.slice(currentIndex + 1);
    return [...forwardStates, 'cancelled', 'failed'];
  }

  // Main progression - allow jumping forward to any state + rto + cancel/fail
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const forwardStates = STATUS_ORDER.slice(currentIndex + 1);
  
  return [...forwardStates, 'rto_initiated', 'cancelled', 'failed'];
};

/**
 * List all ZEN orders (Admin)
 * GET /api/admin/zen-orders
 */
export const listZenOrders = async (
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

    const {
      status,
      userId,
      storeId,
      assignedPicker,
      isPriority,
      hasIssue,
      search,
      startDate,
      endDate,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Build query
    const query: any = {};

    if (status) {
      if (status === 'active') {
        // Active = not in terminal states
        query.status = { $nin: ['delivered', 'returned', 'cancelled', 'failed'] };
      } else {
        query.status = status;
      }
    }

    if (userId) {
      query.userId = new mongoose.Types.ObjectId(userId as string);
    }

    if (storeId) {
      query.storeId = new mongoose.Types.ObjectId(storeId as string);
    }

    if (assignedPicker) {
      query.assignedPicker = new mongoose.Types.ObjectId(assignedPicker as string);
    }

    if (isPriority === 'true') {
      query.isPriority = true;
    }

    if (hasIssue === 'true') {
      query.hasIssue = true;
    }

    if (search) {
      query.$or = [
        { orderName: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
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

    // Build sort
    const sort: any = {};
    // Priority orders first, then by specified sort
    sort.isPriority = -1;
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [orders, total, statusCounts] = await Promise.all([
      ZenOrder.find(query)
        .sort(sort)
        .skip(offsetNum)
        .limit(limitNum)
        .populate('userId', 'name email')
        .populate('assignedPicker', 'name email')
        .populate('assignedPacker', 'name email')
        .lean(),
      ZenOrder.countDocuments(query),
      ZenOrder.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Format status counts
    const statusCountsMap: Record<string, number> = {};
    statusCounts.forEach((s) => {
      statusCountsMap[s._id] = s.count;
    });

    res.json({
      success: true,
      data: orders.map((order) => ({
        id: order._id,
        orderId: order.orderId,
        orderName: order.orderName,
        storeName: order.storeName,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        sku: order.sku,
        itemCount: order.itemCount,
        orderValue: order.orderValue,
        orderValueFormatted: `₹${(order.orderValue / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        walletDeductedAmount: order.walletDeductedAmount,
        walletDeductedAmountFormatted: `₹${(order.walletDeductedAmount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        profit: order.profit,
        profitFormatted: `₹${(order.profit / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        status: order.status,
        isPriority: order.isPriority,
        isDelayed: order.isDelayed,
        hasIssue: order.hasIssue,
        trackingNumber: order.trackingNumber,
        courierProvider: order.courierProvider,
        user: order.userId,
        assignedPicker: order.assignedPicker,
        assignedPacker: order.assignedPacker,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      })),
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total,
      },
      stats: {
        statusCounts: statusCountsMap,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single ZEN order details (Admin)
 * GET /api/admin/zen-orders/:zenOrderId
 */
export const getZenOrderDetails = async (
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

    const { zenOrderId } = req.params;

    const zenOrder = await ZenOrder.findById(zenOrderId)
      .populate('userId', 'name email mobile')
      .populate('orderId')
      .populate('assignedPicker', 'name email')
      .populate('assignedPacker', 'name email')
      .populate('assignedQc', 'name email')
      .populate('assignedCourierPerson', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!zenOrder) {
      throw createError('ZEN order not found', 404);
    }

    res.json({
      success: true,
      data: zenOrder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ZEN order status (Admin)
 * POST /api/admin/zen-orders/:zenOrderId/status
 */
export const updateZenOrderStatus = async (
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

    const { zenOrderId } = req.params;
    const rawStatus = req.body?.status;
    const note = req.body?.note;
    const adminId = (req.user as any)?._id;

    if (!rawStatus) {
      throw createError('Status is required', 400);
    }
    // Normalize status (may be string or array from form data)
    const status = Array.isArray(rawStatus) ? String(rawStatus[0]) : String(rawStatus);

    if (!adminId) {
      throw createError('Invalid session', 401);
    }

    // Load only fields needed for validation and side effects (avoid full-doc validation on save)
    const zenOrder = await ZenOrder.findById(zenOrderId)
      .select('orderId userId orderName status statusHistory')
      .lean();
    if (!zenOrder) {
      throw createError('ZEN order not found', 404);
    }

    // Validate transition
    const validTransitions = getValidTransitions(zenOrder.status as ZenOrderStatus);
    if (!validTransitions.includes(status as ZenOrderStatus)) {
      throw createError(
        `Invalid status transition from ${zenOrder.status} to ${status}. Valid transitions: ${validTransitions.join(', ') || 'none (terminal state)'}`,
        400
      );
    }

    const adminObjectId = mongoose.Types.ObjectId.isValid(adminId) ? (adminId instanceof mongoose.Types.ObjectId ? adminId : new mongoose.Types.ObjectId(adminId)) : null;
    if (!adminObjectId) {
      throw createError('Invalid session', 401);
    }

    // Update via findByIdAndUpdate so we don't re-validate entire document (legacy docs may lack orderName/storeId)
    const statusHistoryEntry = {
      status: status as ZenOrderStatus,
      changedBy: adminObjectId,
      changedAt: new Date(),
      note: note || '',
    };
    const timestampUpdates: Record<string, Date> = { updatedAt: new Date() };
    if (status === 'sourced') timestampUpdates.sourcedAt = new Date();
    else if (status === 'packed') timestampUpdates.packedAt = new Date();
    else if (status === 'dispatched') timestampUpdates.dispatchedAt = new Date();
    else if (status === 'shipped') timestampUpdates.shippedAt = new Date();
    else if (status === 'delivered') timestampUpdates.deliveredAt = new Date();

    const updated = await ZenOrder.findByIdAndUpdate(
      zenOrderId,
      {
        $set: { status, ...timestampUpdates },
        $push: { statusHistory: statusHistoryEntry },
      },
      { new: true, runValidators: false }
    );

    if (!updated) {
      throw createError('ZEN order not found', 404);
    }

    // Also update the local Order zenStatus (if orderId exists)
    const orderIdRef = zenOrder.orderId;
    if (orderIdRef) {
      try {
        // Map ZenOrderStatus to Order ZenStatus
        const orderStatusMap: Partial<Record<ZenOrderStatus, string>> = {
          'pending': 'pending',
          'sourcing': 'sourcing',
          'sourced': 'sourcing', // Order doesn't have 'sourced', use 'sourcing'
          'packing': 'packing',
          'packed': 'packing', // Order doesn't have 'packed', use 'packing'
          'ready_for_dispatch': 'ready_for_dispatch',
          'dispatched': 'dispatched',
          'shipped': 'shipped',
          'out_for_delivery': 'out_for_delivery',
          'delivered': 'delivered',
          'rto_initiated': 'rto_initiated',
          'rto_delivered': 'rto_delivered',
          'returned': 'returned',
          'cancelled': 'failed', // Order doesn't have 'cancelled', use 'failed'
          'failed': 'failed',
        };
        
        const mappedStatus = (orderStatusMap[status as ZenOrderStatus] || status) as string;
        await Order.findByIdAndUpdate(orderIdRef, { zenStatus: mappedStatus });
      } catch (orderError: any) {
        console.warn(`Failed to update Order zenStatus for ${orderIdRef}:`, orderError.message);
      }
    }

    const orderName = (zenOrder as any).orderName || (updated as any).orderName || 'Order';
    const userId = zenOrder.userId || (updated as any).userId;

    createNotification({
      userId,
      type: 'system_update',
      title: 'Order Status Updated',
      message: `Your order ${orderName} status has been updated to: ${String(status).replace(/_/g, ' ').toUpperCase()}`,
      link: '/dashboard/orders',
      metadata: {
        zenOrderId: zenOrderId,
        status,
      },
    }).catch((err) => console.warn('Notification create failed:', err?.message));

    const prevHistory = Array.isArray(zenOrder.statusHistory) ? zenOrder.statusHistory : [];
    AuditLog.create({
      userId: adminId,
      action: 'ZEN_ORDER_STATUS_UPDATE',
      success: true,
      details: {
        zenOrderId: zenOrderId,
        previousStatus: prevHistory[prevHistory.length - 2]?.status,
        newStatus: status,
        note: note || '',
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    }).catch((err) => console.warn('AuditLog create failed:', err?.message));

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        id: updated._id,
        status: updated.status,
        statusHistory: updated.statusHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign staff to ZEN order (Admin)
 * POST /api/admin/zen-orders/:zenOrderId/assign
 */
export const assignStaff = async (
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

    const { zenOrderId } = req.params;
    const { pickerId, packerId, qcId, courierPersonId } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (pickerId !== undefined) update.assignedPicker = pickerId ? new mongoose.Types.ObjectId(pickerId) : null;
    if (packerId !== undefined) update.assignedPacker = packerId ? new mongoose.Types.ObjectId(packerId) : null;
    if (qcId !== undefined) update.assignedQc = qcId ? new mongoose.Types.ObjectId(qcId) : null;
    if (courierPersonId !== undefined) {
      update.assignedCourierPerson = courierPersonId ? new mongoose.Types.ObjectId(courierPersonId) : null;
    }

    const updated = await ZenOrder.findByIdAndUpdate(
      zenOrderId,
      { $set: update },
      { new: true, runValidators: false }
    ).select('assignedPicker assignedPacker assignedQc assignedCourierPerson');

    if (!updated) {
      throw createError('ZEN order not found', 404);
    }

    res.json({
      success: true,
      message: 'Staff assignments updated',
      data: {
        id: updated._id,
        assignedPicker: (updated as any).assignedPicker,
        assignedPacker: (updated as any).assignedPacker,
        assignedQc: (updated as any).assignedQc,
        assignedCourierPerson: (updated as any).assignedCourierPerson,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tracking info (Admin)
 * POST /api/admin/zen-orders/:zenOrderId/tracking
 */
export const updateTracking = async (
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

    const { zenOrderId } = req.params;
    const { trackingNumber, trackingUrl, courierProvider, estimatedDeliveryDate } = req.body;

    // Build update object (only set provided fields) – use findByIdAndUpdate to avoid full-doc validation
    const update: Record<string, any> = { updatedAt: new Date() };
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) update.trackingUrl = trackingUrl;
    if (courierProvider !== undefined) update.courierProvider = courierProvider;
    if (estimatedDeliveryDate !== undefined) {
      update.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null;
    }

    const updated = await ZenOrder.findByIdAndUpdate(
      zenOrderId,
      { $set: update },
      { new: true, runValidators: false }
    ).select('orderId userId orderName trackingNumber trackingUrl courierProvider estimatedDeliveryDate');

    if (!updated) {
      throw createError('ZEN order not found', 404);
    }

    if ((updated as any).orderId) {
      try {
        const orderUpdate: Record<string, string | null> = {};
        if ((updated as any).trackingNumber != null) orderUpdate.trackingNumber = (updated as any).trackingNumber;
        if ((updated as any).trackingUrl != null) orderUpdate.trackingUrl = (updated as any).trackingUrl;
        if ((updated as any).courierProvider != null) orderUpdate.courierProvider = (updated as any).courierProvider;
        if (Object.keys(orderUpdate).length > 0) {
          await Order.findByIdAndUpdate((updated as any).orderId, orderUpdate);
        }
      } catch (orderErr: any) {
        console.warn('Order tracking update failed:', orderErr?.message);
      }
    }

    if (trackingNumber) {
      const orderName = (updated as any).orderName || 'Order';
      createNotification({
        userId: (updated as any).userId,
        type: 'system_update',
        title: 'Tracking Info Added',
        message: `Tracking number ${trackingNumber} has been added to your order ${orderName}`,
        link: '/dashboard/orders',
        metadata: {
          zenOrderId,
          trackingNumber,
          courierProvider: (updated as any).courierProvider,
        },
      }).catch((err) => console.warn('Notification create failed:', err?.message));
    }

    res.json({
      success: true,
      message: 'Tracking info updated',
      data: {
        id: updated._id,
        trackingNumber: (updated as any).trackingNumber,
        trackingUrl: (updated as any).trackingUrl,
        courierProvider: (updated as any).courierProvider,
        estimatedDeliveryDate: (updated as any).estimatedDeliveryDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update RTO address (Admin)
 * POST /api/admin/zen-orders/:zenOrderId/rto-address
 */
export const updateRtoAddress = async (
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

    const { zenOrderId } = req.params;
    const body = req.body || {};
    const str = (v: any) => (v == null || v === '') ? '' : String(Array.isArray(v) ? v[0] : v);

    const rtoAddress = {
      name: str(body.name),
      phone: str(body.phone),
      addressLine1: str(body.addressLine1),
      addressLine2: str(body.addressLine2),
      city: str(body.city),
      state: str(body.state),
      pincode: str(body.pincode),
      country: str(body.country) || 'India',
    };

    const updated = await ZenOrder.findByIdAndUpdate(
      zenOrderId,
      { $set: { rtoAddress, updatedAt: new Date() } },
      { new: true, runValidators: false }
    ).select('rtoAddress');

    if (!updated) {
      throw createError('ZEN order not found', 404);
    }

    res.json({
      success: true,
      message: 'RTO address updated successfully',
      data: {
        id: updated._id,
        rtoAddress: (updated as any).rtoAddress ?? rtoAddress,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add internal note (Admin)
 * POST /api/admin/zen-orders/:zenOrderId/notes
 */
export const addInternalNote = async (
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

    const { zenOrderId } = req.params;
    const { note } = req.body;

    if (!note || typeof note !== 'string') {
      throw createError('Note is required', 400);
    }

    const zenOrder = await ZenOrder.findById(zenOrderId);
    if (!zenOrder) {
      throw createError('ZEN order not found', 404);
    }

    // Append note with timestamp
    const timestamp = new Date().toISOString();
    const adminEmail = req.user.email || 'Admin';
    const newNote = zenOrder.internalNotes
      ? `${zenOrder.internalNotes}\n\n[${timestamp}] ${adminEmail}:\n${note}`
      : `[${timestamp}] ${adminEmail}:\n${note}`;

    zenOrder.internalNotes = newNote;
    await zenOrder.save();

    res.json({
      success: true,
      message: 'Note added',
      data: {
        id: zenOrder._id,
        internalNotes: zenOrder.internalNotes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark order as priority/delayed/issue (Admin)
 * POST /api/admin/zen-orders/:zenOrderId/flags
 */
export const updateFlags = async (
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

    const { zenOrderId } = req.params;
    const { isPriority, isDelayed, hasIssue, issueDescription } = req.body;

    const zenOrder = await ZenOrder.findById(zenOrderId);
    if (!zenOrder) {
      throw createError('ZEN order not found', 404);
    }

    if (isPriority !== undefined) zenOrder.isPriority = isPriority;
    if (isDelayed !== undefined) zenOrder.isDelayed = isDelayed;
    if (hasIssue !== undefined) zenOrder.hasIssue = hasIssue;
    if (issueDescription !== undefined) zenOrder.issueDescription = issueDescription;

    await zenOrder.save();

    res.json({
      success: true,
      message: 'Flags updated',
      data: {
        id: zenOrder._id,
        isPriority: zenOrder.isPriority,
        isDelayed: zenOrder.isDelayed,
        hasIssue: zenOrder.hasIssue,
        issueDescription: zenOrder.issueDescription,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update ZEN orders (Admin)
 * POST /api/admin/zen-orders/bulk
 */
export const bulkUpdateZenOrders = async (
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

    const { ids, action, status, note, pickerId, packerId } = req.body;
    const adminId = (req.user as any)._id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw createError('Order IDs are required', 400);
    }

    if (!action) {
      throw createError('Action is required', 400);
    }

    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: [],
    };

    for (const id of ids) {
      try {
        const zenOrder = await ZenOrder.findById(id);
        if (!zenOrder) {
          results.failed.push({ id, error: 'Order not found' });
          continue;
        }

        switch (action) {
          case 'update_status':
            if (!status) {
              results.failed.push({ id, error: 'Status required for status update' });
              continue;
            }
            const bulkValidTransitions = getValidTransitions(zenOrder.status);
            if (!bulkValidTransitions.includes(status)) {
              results.failed.push({
                id,
                error: `Invalid transition from ${zenOrder.status} to ${status}`,
              });
              continue;
            }
            zenOrder.addStatusChange(status, adminId, note || 'Bulk status update');
            await zenOrder.save();
            await Order.findByIdAndUpdate(zenOrder.orderId, { zenStatus: status });
            break;

          case 'assign_picker':
            if (pickerId) {
              zenOrder.assignedPicker = new mongoose.Types.ObjectId(pickerId);
              await zenOrder.save();
            }
            break;

          case 'assign_packer':
            if (packerId) {
              zenOrder.assignedPacker = new mongoose.Types.ObjectId(packerId);
              await zenOrder.save();
            }
            break;

          case 'mark_priority':
            zenOrder.isPriority = true;
            await zenOrder.save();
            break;

          case 'unmark_priority':
            zenOrder.isPriority = false;
            await zenOrder.save();
            break;

          default:
            results.failed.push({ id, error: `Unknown action: ${action}` });
            continue;
        }

        results.success.push(id);
      } catch (err: any) {
        results.failed.push({ id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.success.length} orders, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ZEN order stats (Admin)
 * GET /api/admin/zen-orders/stats
 */
export const getZenOrderStats = async (
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

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const [
      totalOrders,
      statusCounts,
      totalRevenue,
      totalProfit,
      avgProcessingTime,
      priorityCount,
      issueCount,
    ] = await Promise.all([
      ZenOrder.countDocuments(dateFilter),
      ZenOrder.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      ZenOrder.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: '$orderValue' } } },
      ]),
      ZenOrder.aggregate([
        { $match: { ...dateFilter, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$profit' } } },
      ]),
      ZenOrder.aggregate([
        { $match: { ...dateFilter, status: 'delivered', deliveredAt: { $ne: null } } },
        {
          $project: {
            processingTime: {
              $subtract: ['$deliveredAt', '$walletDeductedAt'],
            },
          },
        },
        { $group: { _id: null, avgTime: { $avg: '$processingTime' } } },
      ]),
      ZenOrder.countDocuments({ ...dateFilter, isPriority: true }),
      ZenOrder.countDocuments({ ...dateFilter, hasIssue: true }),
    ]);

    // Format status counts
    const statusCountsMap: Record<string, number> = {};
    statusCounts.forEach((s) => {
      statusCountsMap[s._id] = s.count;
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        statusCounts: statusCountsMap,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalRevenueFormatted: `₹${((totalRevenue[0]?.total || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        totalProfit: totalProfit[0]?.total || 0,
        totalProfitFormatted: `₹${((totalProfit[0]?.total || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        avgProcessingTimeMs: avgProcessingTime[0]?.avgTime || 0,
        avgProcessingTimeHours: Math.round((avgProcessingTime[0]?.avgTime || 0) / (1000 * 60 * 60)),
        priorityCount,
        issueCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

