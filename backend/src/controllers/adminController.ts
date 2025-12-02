import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { StoreConnection } from '../models/StoreConnection';
import { AuditLog } from '../models/AuditLog';
import { Product } from '../models/Product';
import { Contact } from '../models/Contact';
import mongoose from 'mongoose';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

// In-memory cache for dashboard stats
let statsCache: any = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Return cached data if available and fresh
    if (statsCache && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: statsCache,
      });
    }

    // Calculate stats
    const [
      totalUsers,
      activeUsers,
      totalStores,
      activeStores,
      invalidStores,
      revokedStores,
      totalProducts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      StoreConnection.countDocuments(),
      StoreConnection.countDocuments({ status: 'active' }),
      StoreConnection.countDocuments({ status: 'invalid' }),
      StoreConnection.countDocuments({ status: 'revoked' }),
      Product.countDocuments(),
    ]);

    // Get registration trends (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const registrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get store connection trends (last 30 days)
    const storeConnections = await StoreConnection.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Store status distribution
    const storeStatusDistribution = await StoreConnection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Recent activity (last 10 audit logs)
    const recentActivity = await AuditLog.find()
      .populate('userId', 'email')
      .populate('storeId', 'storeName')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      stores: {
        total: totalStores,
        active: activeStores,
        invalid: invalidStores,
        revoked: revokedStores,
      },
      products: {
        total: totalProducts,
      },
      trends: {
        registrations,
        storeConnections,
      },
      storeStatusDistribution,
      recentActivity: recentActivity.map((log) => ({
        id: log._id,
        timestamp: log.timestamp,
        userEmail: (log.userId as any)?.email || 'System',
        action: log.action,
        target: (log.storeId as any)?.storeName || 'N/A',
        success: log.success,
        details: log.details,
      })),
    };

    // Cache the results
    statsCache = stats;
    cacheTime = Date.now();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getSystemHealth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const startTime = Date.now();
    if (!mongoose.connection.db) {
      throw createError('Database not connected', 503);
    }
    await mongoose.connection.db.command({ ping: 1 });
    const latency = Date.now() - startTime;

    const status =
      latency < 100 ? 'healthy' : latency < 300 ? 'degraded' : 'unhealthy';

    res.status(200).json({
      success: true,
      data: {
        status,
        dbLatency: latency,
        uptime: process.uptime(),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

// User Management Functions
export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      role = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }
    if (role) {
      query.role = role;
    }
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // Get store counts for each user
    const userIds = users.map((u: any) => u._id);
    const storeCounts = await StoreConnection.aggregate([
      { $match: { owner: { $in: userIds } } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);

    const storeCountMap = new Map(
      storeCounts.map((s: any) => [s._id.toString(), s.count])
    );

    const usersWithStats = users.map((user: any) => ({
      ...user,
      storesCount: storeCountMap.get(user._id.toString()) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUserRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      throw createError('Invalid role. Must be "admin" or "user"', 400);
    }

    const user = await User.findById(id).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.role === role) {
      return res.status(200).json({
        success: true,
        message: 'User role unchanged',
      });
    }

    await User.findByIdAndUpdate(id, { role });

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'UPDATE_USER_ROLE',
      success: true,
      details: {
        targetUserId: id,
        targetEmail: user.email,
        oldRole: user.role,
        newRole: role,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

export const toggleUserStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    const newStatus = !user.isActive;
    await User.findByIdAndUpdate(id, { isActive: newStatus });

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: newStatus ? 'ENABLE_USER' : 'DISABLE_USER',
      success: true,
      details: {
        targetUserId: id,
        targetEmail: user.email,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `User ${newStatus ? 'enabled' : 'disabled'} successfully`,
      data: { isActive: newStatus },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUserDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Get user with all fields (excluding password)
    const user = await User.findById(id)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .lean();

    if (!user) {
      throw createError('User not found', 404);
    }

    // Get all stores for this user
    const stores = await StoreConnection.find({ owner: id })
      .select('-accessToken -apiKey -apiSecret')
      .sort({ createdAt: -1 })
      .lean();

    // Get password change history from audit logs
    const passwordChanges = await AuditLog.find({
      userId: id,
      action: { $in: ['CHANGE_PASSWORD', 'RESET_PASSWORD'] },
    })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    // Get recent audit logs (last 20)
    const recentActivity = await AuditLog.find({
      userId: id,
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    // Get subscription info
    const subscriptionStatus = user.isLifetime
      ? 'lifetime'
      : user.plan && user.planExpiresAt && user.planExpiresAt > new Date()
      ? 'active'
      : user.plan
      ? 'expired'
      : 'none';

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          country: user.country,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
          passwordChangedAt: user.passwordChangedAt,
          emailLinkedAt: user.emailLinkedAt,
          mobileLinkedAt: user.mobileLinkedAt,
          deletedAt: user.deletedAt,
          pendingEmail: user.pendingEmail,
          // Subscription
          plan: user.plan,
          planExpiresAt: user.planExpiresAt,
          isLifetime: user.isLifetime,
          subscriptionStatus,
          // Products
          productsAdded: user.productsAdded,
          // Onboarding
          onboarding: user.onboarding,
        },
        stores,
        passwordChanges,
        recentActivity,
        stats: {
          totalStores: stores.length,
          activeStores: stores.filter((s: any) => s.status === 'active').length,
          totalPasswordChanges: passwordChanges.length,
          lastPasswordChange: passwordChanges[0]?.timestamp || null,
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).lean();
    if (!user) {
      throw createError('User not found', 404);
    }

    // Prevent deleting yourself
    if ((req.user as any)._id.toString() === id) {
      throw createError('Cannot delete your own account', 400);
    }

    // Cascade delete: stores and audit logs
    await Promise.all([
      StoreConnection.deleteMany({ owner: id }),
      AuditLog.deleteMany({ userId: id }),
      User.findByIdAndDelete(id),
    ]);

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'DELETE_USER',
      success: true,
      details: {
        targetUserId: id,
        targetEmail: user.email,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

// Audit Log Functions
export const getAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId = '',
      storeId = '',
      action = '',
      success = '',
      startDate = '',
      endDate = '',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (action) query.action = action;
    if (success === 'true') query.success = true;
    if (success === 'false') query.success = false;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    // Get audit logs with pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'email')
        .populate('storeId', 'storeName')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs: logs.map((log: any) => ({
          id: log._id,
          timestamp: log.timestamp,
          userEmail: log.userId?.email || 'System',
          action: log.action,
          target: log.storeId?.storeName || 'N/A',
          success: log.success,
          errorMessage: log.errorMessage,
          details: log.details,
          ipAddress: log.ipAddress,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const exportAuditLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      userId = '',
      storeId = '',
      action = '',
      success = '',
      startDate = '',
      endDate = '',
    } = req.query;

    // Build query (same as getAuditLogs)
    const query: any = {};
    if (userId) query.userId = userId;
    if (storeId) query.storeId = storeId;
    if (action) query.action = action;
    if (success === 'true') query.success = true;
    if (success === 'false') query.success = false;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate as string);
      if (endDate) query.timestamp.$lte = new Date(endDate as string);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'email')
      .populate('storeId', 'storeName')
      .sort({ timestamp: -1 })
      .lean();

    // Generate CSV
    const headers = ['Timestamp', 'User Email', 'Action', 'Target', 'Success', 'Error Message', 'IP Address', 'Details'];
    const rows = logs.map((log: any) => [
      new Date(log.timestamp).toISOString(),
      log.userId?.email || 'System',
      log.action,
      log.storeId?.storeName || 'N/A',
      log.success ? 'Yes' : 'No',
      log.errorMessage || '',
      log.ipAddress || '',
      JSON.stringify(log.details || {}),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get all contact submissions with pagination and filters
 * GET /api/admin/contacts
 */
export const getContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .populate('userId', 'email')
        .populate('repliedBy', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get a single contact submission
 * GET /api/admin/contacts/:id
 */
export const getContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid contact ID', 400);
    }

    const contact = await Contact.findById(id)
      .populate('userId', 'email')
      .populate('repliedBy', 'email')
      .lean();

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Reply to a contact submission
 * POST /api/admin/contacts/:id/reply
 */
export const replyToContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length === 0) {
      throw createError('Reply message is required', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid contact ID', 400);
    }

    const contact = await Contact.findById(id);

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    // Update contact with reply
    contact.adminReply = reply.trim();
    contact.repliedBy = (req.user as any)._id;
    contact.repliedAt = new Date();
    contact.status = 'replied';
    await contact.save();

    // Send email notification to user
    try {
      const { sendEmail } = await import('../utils/email');
      const originalMessage = contact.message || 'No message provided';
      await sendEmail({
        to: contact.email,
        subject: `Re: ${contact.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a1a; color: #e0e0e0;">
            <h2 style="color: #ffffff; margin-bottom: 20px;">Hello ${contact.name},</h2>
            
            <p style="color: #a0a0a0; margin-bottom: 20px;">Thank you for contacting us. We've received your message and here is our response:</p>
            
            <div style="background-color: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1ac8ed;">
              <h3 style="color: #1ac8ed; margin-top: 0; margin-bottom: 10px;">Your Original Message:</h3>
              <p style="color: #c0c0c0; white-space: pre-wrap; margin: 0;">${originalMessage.replace(/\n/g, '<br>')}</p>
            </div>
            
            <div style="background-color: #2a2a2a; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #10b981; margin-top: 0; margin-bottom: 10px;">Our Response:</h3>
              <p style="color: #c0c0c0; white-space: pre-wrap; margin: 0;">${reply.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p style="color: #a0a0a0; margin-top: 20px;">If you have any further questions, please don't hesitate to contact us again.</p>
            
            <p style="color: #808080; margin-top: 30px; border-top: 1px solid #404040; padding-top: 20px;">
              Best regards,<br>
              <strong style="color: #e0e0e0;">Support Team</strong><br>
              EAZY DROPSHIPPING
            </p>
          </div>
        `,
        text: `Hello ${contact.name},\n\nThank you for contacting us. We've received your message and here is our response:\n\n--- Your Original Message ---\n${originalMessage}\n\n--- Our Response ---\n${reply}\n\nIf you have any further questions, please don't hesitate to contact us again.\n\nBest regards,\nSupport Team\nEAZY DROPSHIPPING`,
      });
    } catch (emailError) {
      // Log but don't fail if email fails
      console.error('Failed to send reply email:', emailError);
    }

    // Create notification for user if they have an account
    // Try to find user by email if userId is not set
    let userIdToNotify: mongoose.Types.ObjectId | string | undefined = contact.userId;
    
    // If userId is not set, try to find user by email
    if (!userIdToNotify) {
      try {
        const userByEmail = await User.findOne({ email: contact.email.toLowerCase() }).select('_id').lean();
        if (userByEmail && userByEmail._id) {
          userIdToNotify = userByEmail._id as mongoose.Types.ObjectId;
          console.log(`Found user by email for notification: ${userByEmail._id}`);
        }
      } catch (userLookupError) {
        console.error('Failed to lookup user by email:', userLookupError);
      }
    }

    if (userIdToNotify) {
      try {
        console.log(`Creating notification for user: ${userIdToNotify}, contact: ${contact.email}`);
        await createNotification({
          userId: userIdToNotify,
          type: 'system_update',
          title: 'Response to Your Contact Request',
          message: `We've replied to your contact request: "${contact.subject}". Check your email for details.`,
          link: `/contact`,
        });
        console.log(`Notification created successfully for user: ${userIdToNotify}`);
      } catch (notifError) {
        // Log but don't fail
        console.error('Failed to create notification:', notifError);
      }
    } else {
      console.log(`No user found for contact email: ${contact.email}, notification not created`);
    }

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'REPLY_TO_CONTACT',
      success: true,
      details: {
        contactId: contact._id,
        contactEmail: contact.email,
        contactSubject: contact.subject,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Reply sent successfully',
      data: contact,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Update contact status
 * PUT /api/admin/contacts/:id/status
 */
export const updateContactStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'replied', 'resolved', 'archived'].includes(status)) {
      throw createError('Invalid status', 400);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid contact ID', 400);
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('userId', 'email')
      .populate('repliedBy', 'email')
      .lean();

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete a contact submission
 * DELETE /api/admin/contacts/:id
 */
export const deleteContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw createError('Invalid contact ID', 400);
    }

    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      throw createError('Contact not found', 404);
    }

    // Audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'DELETE_CONTACT',
      success: true,
      details: {
        contactId: id,
        contactEmail: contact.email,
        contactSubject: contact.subject,
      },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

