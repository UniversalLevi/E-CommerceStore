import { PushSubscription } from '../models/PushSubscription';
import mongoose from 'mongoose';

let webpush: any = null;
try {
  webpush = require('web-push');
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@eazyds.com';
  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  }
} catch {
  console.warn('web-push not installed — push notifications disabled. Run: npm install web-push');
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

export async function sendPushNotification(
  userId: mongoose.Types.ObjectId | string,
  payload: PushPayload
): Promise<void> {
  if (!webpush) return;
  try {
    const subscriptions = await PushSubscription.find({ userId });
    const data = JSON.stringify(payload);
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          data
        );
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
      }
    });
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

export async function sendStorePushNotification(
  storeId: mongoose.Types.ObjectId | string,
  payload: PushPayload
): Promise<void> {
  if (!webpush) return;
  try {
    const subscriptions = await PushSubscription.find({ storeId });
    const data = JSON.stringify(payload);
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          data
        );
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.findByIdAndDelete(sub._id);
        }
      }
    });
    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Store push notification error:', error);
  }
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}
