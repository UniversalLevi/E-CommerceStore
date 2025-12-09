import { Notification } from '../models/Notification';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId | string;
  type: 'store_connection' | 'product_added' | 'store_test' | 'system_update' | 'mentorship_application' | 'admin_sent' | 'withdrawal_status' | 'template_applied';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata,
      read: false,
    });
  } catch (error) {
    // Log error but don't throw - notifications are non-critical
    console.error('Failed to create notification:', error);
  }
}

