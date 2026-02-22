'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

export default function PushNotificationRegistrar() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    registerServiceWorker();
  }, [isAuthenticated]);

  return null;
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const vapidRes = await api.getVapidKey();
    const vapidPublicKey = vapidRes.vapidPublicKey;
    if (!vapidPublicKey) return;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const key = urlBase64ToUint8Array(vapidPublicKey);
      const buf = new ArrayBuffer(key.byteLength);
      new Uint8Array(buf).set(key);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: buf,
      });
    }

    const subJson = subscription.toJSON();
    await api.subscribePush({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    });
  } catch (err) {
    console.warn('Push notification registration failed:', err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
