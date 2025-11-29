import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { createError } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { read, limit = '20' } = req.query;

    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    const query: any = { userId };
    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch notifications', 500));
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId,
    });

    if (!notification) {
      throw createError('Notification not found', 404);
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to mark notification as read', 500));
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to mark all notifications as read', 500));
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const userId = (req.user as any)._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      throw createError('Notification not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to delete notification', 500));
  }
};

/**
 * Admin: Send notification to user(s)
 * POST /api/admin/notifications/send
 */
export const sendNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { userIds, title, message, type = 'admin_sent' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw createError('User IDs are required', 400);
    }

    if (!title || !message) {
      throw createError('Title and message are required', 400);
    }

    // Validate user IDs exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      throw createError('One or more user IDs are invalid', 400);
    }

    // Create notifications for all users
    const notifications = userIds.map((userId: string) => ({
      userId,
      type,
      title,
      message,
      read: false,
      metadata: {
        sentBy: (req.user as any)._id,
        sentAt: new Date(),
        recipientCount: userIds.length,
      },
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${userIds.length} user(s)`,
      count: userIds.length,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to send notification', 500));
  }
};

/**
 * Admin: Get notification history
 * GET /api/admin/notifications/history
 */
export const getNotificationHistory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { limit = '20' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    // Get admin_sent notifications grouped by title, message, and sent time
    const notifications = await Notification.find({
      type: 'admin_sent',
    })
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .lean();

    // Group by title and message to show unique notifications
    const grouped: Record<string, any> = {};
    notifications.forEach((notif: any) => {
      const key = `${notif.title}|${notif.message}|${new Date(notif.createdAt).toDateString()}`;
      if (!grouped[key]) {
        grouped[key] = {
          _id: notif._id,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt,
          recipientCount: 1,
        };
      } else {
        grouped[key].recipientCount += 1;
      }
    });

    const history = Object.values(grouped);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch notification history', 500));
  }
};

/**
 * Admin: Get notification details (recipients)
 * GET /api/admin/notifications/details
 */
export const getNotificationDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { title, message, date } = req.query;

    if (!title || !message || !date) {
      throw createError('Title, message, and date are required', 400);
    }

    // Parse the date to get start and end of day
    const targetDate = new Date(date as string);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all notifications matching title, message, and date
    const notifications = await Notification.find({
      type: 'admin_sent',
      title: title as string,
      message: message as string,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('userId', 'email mobile')
      .sort({ createdAt: -1 })
      .lean();

    // Format the response with user info
    const details = notifications.map((notif: any) => ({
      _id: notif._id,
      userEmail: notif.userId?.email,
      userMobile: notif.userId?.mobile,
      read: notif.read,
      readAt: notif.readAt,
      createdAt: notif.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return next(error);
    }
    next(createError(error.message || 'Failed to fetch notification details', 500));
  }
};
