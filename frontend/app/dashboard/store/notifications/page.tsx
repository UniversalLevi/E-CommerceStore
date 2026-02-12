'use client';

import { useStore } from '@/contexts/StoreContext';
import { api } from '@/lib/api';
import { notify } from '@/lib/toast';
import { Mail } from 'lucide-react';

export default function StoreNotificationsPage() {
  const { store, refreshStore } = useStore();

  if (!store) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Email Notifications</h1>
        <p className="text-sm text-text-secondary mt-1">Configure email notification settings</p>
      </div>

      <div className="bg-surface-raised rounded-xl border border-border-default p-6 space-y-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Email Notifications</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Order Confirmation (Customer)</p>
              <p className="text-sm text-text-secondary">Send confirmation emails to customers when they place an order</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.orderConfirmation !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        orderConfirmation: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`Order confirmation emails ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.orderConfirmation !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.orderConfirmation !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">New Order Notification (Owner)</p>
              <p className="text-sm text-text-secondary">Receive email notifications when a new order is placed</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.newOrderNotification !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        newOrderNotification: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`New order notifications ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.newOrderNotification !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.newOrderNotification !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Payment Status Updates</p>
              <p className="text-sm text-text-secondary">Send emails to customers when payment status changes</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.paymentStatus !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        paymentStatus: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`Payment status emails ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.paymentStatus !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.paymentStatus !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary mb-1">Fulfillment Status Updates</p>
              <p className="text-sm text-text-secondary">Send emails to customers when fulfillment status changes</p>
            </div>
            <button
              onClick={async () => {
                const current = store.settings?.emailNotifications?.fulfillmentStatus !== false;
                const newValue = !current;
                try {
                  const response = await api.updateStore(store._id, {
                    settings: {
                      ...store.settings,
                      emailNotifications: {
                        ...(store.settings?.emailNotifications || {}),
                        fulfillmentStatus: newValue,
                      },
                    },
                  });
                  if (response.success) {
                    refreshStore();
                    notify.success(`Fulfillment status emails ${newValue ? 'enabled' : 'disabled'}`);
                  }
                } catch (error: any) {
                  notify.error('Failed to update email settings');
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                store.settings?.emailNotifications?.fulfillmentStatus !== false
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  store.settings?.emailNotifications?.fulfillmentStatus !== false
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
