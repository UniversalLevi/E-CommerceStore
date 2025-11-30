'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import LoadingScreen from '@/components/LoadingScreen';
import Button from '@/components/Button';
import { notify } from '@/lib/toast';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
  readAt?: string;
}

export default function NotificationsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'unread') {
        params.append('read', 'false');
      } else if (filter === 'read') {
        params.append('read', 'true');
      }
      params.append('limit', '50');

      const response = await api.get<{
        success: boolean;
        data: Notification[];
        unreadCount: number;
      }>(`/api/notifications?${params.toString()}`);

      setNotifications(response.data);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      notify.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      notify.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      notify.success('All notifications marked as read');
    } catch (error: any) {
      notify.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      notify.success('Notification deleted');
    } catch (error: any) {
      notify.error('Failed to delete notification');
    }
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Notifications</h1>
          <p className="text-text-secondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="secondary" iconLeft={<CheckCheck className="h-4 w-4" />}>
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-yellow-500 text-black font-semibold'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-yellow-500 text-black font-semibold'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'read'
              ? 'bg-yellow-500 text-black font-semibold'
              : 'bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          Read
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-surface-raised border border-border-default rounded-lg overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 hover:bg-surface-hover transition-colors ${
                  !notification.read ? 'bg-surface-elevated' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${!notification.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="h-2 w-2 bg-primary-500 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-text-secondary text-sm mb-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      {notification.read && notification.readAt && (
                        <span>Read {new Date(notification.readAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead(notification._id)}    
                        variant="secondary"
                        className="text-sm"
                        iconLeft={<Check className="h-4 w-4" />}
                      >
                        Mark Read
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteNotification(notification._id)}                                                                              
                      variant="ghost"
                      className="text-sm"
                      iconLeft={<Trash2 className="h-4 w-4" />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

