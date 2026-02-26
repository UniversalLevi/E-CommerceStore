import { Notification, NotificationType } from '../models/Notification';
import { sendPushNotification } from '../services/PushNotificationService';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: mongoose.Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  sendPush?: boolean;
  playSound?: boolean;
}

/** Order-related types that should be deduplicated by orderId */
const ORDER_NOTIFICATION_TYPES = ['new_order', 'order_paid'];

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const orderId = params.metadata?.orderId as string | undefined;

    // Deduplicate: only one in-app + push per order per type (e.g. one "new_order" per order)
    if (orderId && ORDER_NOTIFICATION_TYPES.includes(params.type)) {
      const existing = await Notification.findOne({
        userId: params.userId,
        type: params.type,
        'metadata.orderId': orderId,
      });
      if (existing) {
        return; // Already notified for this order + type; skip
      }
    }

    const metadata = { ...params.metadata };
    if (orderId) metadata.orderId = orderId;

    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata,
      playSound: params.playSound ?? false,
      read: false,
    });

    if (params.sendPush) {
      await sendPushNotification(params.userId, {
        title: params.title,
        body: params.message,
        url: params.link,
        tag: params.type,
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
