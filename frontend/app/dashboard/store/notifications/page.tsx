'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Mail, Bell, Volume2, VolumeX } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '@/lib/notificationSound';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-purple-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function StoreNotificationsPage() {
  const { store, refreshStore } = useStore();
  const [soundOn, setSoundOn] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const toggleEmailSetting = async (key: string) => {
    if (!store) return;
    const emailNotifs = store.settings?.emailNotifications || {};
    const current = (emailNotifs as any)[key] !== false;
    try {
      const response = await api.updateStore(store._id, {
        settings: {
          ...store.settings,
          emailNotifications: { ...emailNotifs, [key]: !current },
        },
      });
      if (response.success) {
        refreshStore();
        notify.success(`${key} ${!current ? 'enabled' : 'disabled'}`);
      }
    } catch {
      notify.error('Failed to update settings');
    }
  };

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      notify.error('Push notifications are not supported in this browser');
      return;
    }
    if (Notification.permission === 'granted') {
      // Can't programmatically revoke; tell user
      notify.info('To disable push notifications, update your browser notification settings for this site.');
      return;
    }
    const permission = await Notification.requestPermission();
    setPushEnabled(permission === 'granted');
    if (permission === 'granted') {
      notify.success('Push notifications enabled!');
    } else if (permission === 'denied') {
      notify.info('Push notifications are off. You can enable them later in your browser\'s site settings (click the lock or info icon in the address bar).');
    }
    // "default" = user dismissed without choosing; no message needed
  };

  if (!store) return null;

  const email = store.settings?.emailNotifications || {};

  const emailToggles = [
    { key: 'orderConfirmation', label: 'Order Confirmation (Customer)', desc: 'Send confirmation emails to customers when they place an order' },
    { key: 'newOrderNotification', label: 'New Order Notification (Owner)', desc: 'Receive email notifications when a new order is placed' },
    { key: 'paymentStatus', label: 'Payment Status Updates', desc: 'Send emails to customers when payment status changes' },
    { key: 'fulfillmentStatus', label: 'Fulfillment Status Updates', desc: 'Send emails to customers when fulfillment status changes' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Notification Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure email, push, and sound notification preferences</p>
      </div>

      {/* Push Notifications */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Push Notifications</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">Browser Push Notifications</p>
            <p className="text-sm text-text-secondary">Receive push notifications for new orders and important updates</p>
          </div>
          <Toggle enabled={pushEnabled} onChange={handleTogglePush} />
        </div>
        {!pushEnabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <p className="text-xs text-yellow-400">Enable push notifications to get real-time alerts for new orders even when you&apos;re not on the dashboard.</p>
          </div>
        )}
      </div>

      {/* Sound Alerts */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center">
            {soundOn ? <Volume2 className="h-5 w-5 text-white" /> : <VolumeX className="h-5 w-5 text-white" />}
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Sound Alerts</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary mb-1">Order Sound Alert</p>
            <p className="text-sm text-text-secondary">Play a chime sound when new orders or payments are received</p>
          </div>
          <Toggle
            enabled={soundOn}
            onChange={() => {
              const newVal = !soundOn;
              setSoundOn(newVal);
              setSoundEnabled(newVal);
              notify.success(`Sound alerts ${newVal ? 'enabled' : 'disabled'}`);
            }}
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-4 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Email Notifications</h2>
        </div>
        {emailToggles.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">{item.label}</p>
              <p className="text-sm text-text-secondary">{item.desc}</p>
            </div>
            <Toggle
              enabled={(email as any)[item.key] !== false}
              onChange={() => toggleEmailSetting(item.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
