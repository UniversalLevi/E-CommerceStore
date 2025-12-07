import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CallLog } from '../models/CallLog';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { createError } from '../middleware/errorHandler';

/**
 * Create a new call log
 * POST /api/admin/call-logs
 */
export const createCallLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { calledTo, result, customResult, notes, callDuration } = req.body;

    // Validate required fields
    if (!calledTo) {
      throw createError('calledTo (user ID) is required', 400);
    }

    if (!result || !['positive', 'negative', 'custom'].includes(result)) {
      throw createError('result must be one of: positive, negative, custom', 400);
    }

    if (result === 'custom' && !customResult) {
      throw createError('customResult is required when result is "custom"', 400);
    }

    // Verify the user being called exists
    const targetUser = await User.findById(calledTo);
    if (!targetUser) {
      throw createError('User not found', 404);
    }

    // Create call log
    const callLog = await CallLog.create({
      calledBy: (req.user as any)._id,
      calledTo,
      result,
      customResult: result === 'custom' ? customResult : undefined,
      notes,
      callDuration: callDuration ? parseInt(callDuration, 10) : undefined,
    });

    // Populate user details for response
    await callLog.populate('calledBy', 'email name');
    await callLog.populate('calledTo', 'email name mobile');

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'USER_CALL_LOGGED',
      success: true,
      details: {
        calledToUserId: calledTo,
        calledToEmail: targetUser.email,
        result,
        customResult: result === 'custom' ? customResult : undefined,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Call log created successfully',
      data: callLog,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get call logs for a specific user
 * GET /api/admin/call-logs/user/:userId
 */
export const getUserCallLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { userId } = req.params;
    const { limit = '50' } = req.query;

    // Verify user exists
    const targetUser = await User.findById(userId).select('email name mobile');
    if (!targetUser) {
      throw createError('User not found', 404);
    }

    // Get call logs
    const callLogs = await CallLog.find({ calledTo: userId })
      .populate('calledBy', 'email name')
      .populate('calledTo', 'email name mobile')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10))
      .lean();

    res.status(200).json({
      success: true,
      data: {
        user: targetUser,
        callLogs,
        total: callLogs.length,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Get all call logs (admin view)
 * GET /api/admin/call-logs
 */
export const getAllCallLogs = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { userId, result, limit = '100', page = '1' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};
    if (userId) {
      query.calledTo = userId;
    }
    if (result && ['positive', 'negative', 'custom'].includes(result as string)) {
      query.result = result;
    }

    // Get call logs with pagination
    const [callLogs, total] = await Promise.all([
      CallLog.find(query)
        .populate('calledBy', 'email name')
        .populate('calledTo', 'email name mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CallLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        callLogs,
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

/**
 * Update a call log
 * PUT /api/admin/call-logs/:id
 */
export const updateCallLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;
    const { result, customResult, notes, callDuration } = req.body;

    // Find the call log
    const callLog = await CallLog.findById(id);
    if (!callLog) {
      throw createError('Call log not found', 404);
    }

    // Validate result if provided
    if (result && !['positive', 'negative', 'custom'].includes(result)) {
      throw createError('result must be one of: positive, negative, custom', 400);
    }

    if (result === 'custom' && !customResult) {
      throw createError('customResult is required when result is "custom"', 400);
    }

    // Update fields
    if (result !== undefined) {
      callLog.result = result;
      callLog.customResult = result === 'custom' ? customResult : undefined;
    }
    if (notes !== undefined) {
      callLog.notes = notes;
    }
    if (callDuration !== undefined) {
      callLog.callDuration = callDuration ? parseInt(callDuration, 10) : undefined;
    }

    await callLog.save();

    // Populate user details for response
    await callLog.populate('calledBy', 'email name');
    await callLog.populate('calledTo', 'email name mobile');

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'USER_CALL_LOG_UPDATED',
      success: true,
      details: {
        callLogId: id,
        calledToUserId: callLog.calledTo.toString(),
        result: callLog.result,
        customResult: callLog.customResult,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Call log updated successfully',
      data: callLog,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * Delete a call log
 * DELETE /api/admin/call-logs/:id
 */
export const deleteCallLog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;

    // Find the call log
    const callLog = await CallLog.findById(id);
    if (!callLog) {
      throw createError('Call log not found', 404);
    }

    // Store details for audit log before deletion
    const calledToUserId = callLog.calledTo.toString();
    const result = callLog.result;
    const customResult = callLog.customResult;

    // Delete the call log
    await CallLog.findByIdAndDelete(id);

    // Create audit log
    await AuditLog.create({
      userId: (req.user as any)._id,
      action: 'USER_CALL_LOG_DELETED',
      success: true,
      details: {
        callLogId: id,
        calledToUserId,
        result,
        customResult,
      },
      ipAddress: req.ip,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Call log deleted successfully',
    });
  } catch (error: any) {
    next(error);
  }
};

