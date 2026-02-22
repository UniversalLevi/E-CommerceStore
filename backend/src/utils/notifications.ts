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

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await Notification.create({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      metadata: params.metadata,
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
