'use client';

import { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import IconBadge from './IconBadge';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onNotificationClick: (link?: string) => void;
}

export default function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
  onNotificationClick,
}: NotificationDropdownProps) {
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'store_connection':
        return { text: 'SC', label: 'Store connection', variant: 'success' as const };
      case 'product_added':
        return { text: 'PR', label: 'Product added', variant: 'primary' as const };
      case 'store_test':
        return { text: 'QA', label: 'Store test', variant: 'warning' as const };
      case 'system_update':
        return { text: 'UP', label: 'System update', variant: 'neutral' as const };
      default:
        return { text: 'NT', label: 'Notification', variant: 'neutral' as const };
    }
  };

  return (
    <Transition
      as={Fragment}
      show={true}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div className="absolute right-0 mt-2 w-80 bg-[#1A1A1A] rounded-lg shadow-lg border border-[#5D737E] z-50 max-h-96 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#5D737E] flex items-center justify-between">
          <h3 className="font-semibold text-[#F0F7EE]">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-[#1AC8ED] hover:text-[#1AC8ED]/80 transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-[#5D737E] space-y-2">
              <div className="flex justify-center">
                <IconBadge label="Notifications" text="NT" size="lg" variant="neutral" />
              </div>
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-[#5D737E]">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-[#2A2A2A] cursor-pointer transition-colors ${
                    !notification.read ? 'bg-[#1AC8ED]/10' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead(notification._id);
                    }
                    onNotificationClick(notification.link);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <IconBadge
                      {...getNotificationBadge(notification.type)}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-[#F0F7EE] text-sm">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#1AC8ED] rounded-full flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                      <p className="text-sm text-[#5D737E] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#5D737E]/70 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-4 border-t border-[#5D737E] text-center">
            <button
              onClick={() => {
                onClose();
                // Navigate to notifications page if it exists
              }}
              className="text-sm text-[#1AC8ED] hover:text-[#1AC8ED]/80 transition-colors"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </Transition>
  );
}

