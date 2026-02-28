'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { playOrderSound, isSoundEnabled } from '@/lib/notificationSound';
import NotificationDropdown from './NotificationDropdown';

const ANNOUNCED_STORAGE_KEY = 'eazyds_announced_notif_ids';
const MAX_ANNOUNCED_STORED = 200;

function loadAnnouncedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(ANNOUNCED_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr.slice(-MAX_ANNOUNCED_STORED)) : new Set();
  } catch {
    return new Set();
  }
}

function saveAnnouncedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(ids).slice(-MAX_ANNOUNCED_STORED);
    localStorage.setItem(ANNOUNCED_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  playSound?: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);
  const announcedIdsRef = useRef<Set<string>>(new Set());
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hydratedRef.current) {
      announcedIdsRef.current = loadAnnouncedIds();
      hydratedRef.current = true;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Auto-hide toast after 5s
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: Notification[];
        unreadCount: number;
      }>('/api/notifications?limit=20');
      const list = response?.data;
      const newNotifs = Array.isArray(list) ? list : [];
      const newCount = typeof response?.unreadCount === 'number' ? response.unreadCount : 0;

      const orderTypes = ['new_order', 'order_paid'];
      const shouldPlaySound = (n: Notification) =>
        (orderTypes.includes(n.type) || n.playSound === true) && isSoundEnabled();

      const toAnnounce: Notification[] = [];
      for (const notif of newNotifs) {
        if (!orderTypes.includes(notif.type) && !notif.playSound) continue;
        if (announcedIdsRef.current.has(notif._id)) continue;
        announcedIdsRef.current.add(notif._id);
        toAnnounce.push(notif);
      }
      if (toAnnounce.length > 0) {
        const latest = toAnnounce[0];
        setToast({ title: latest.title, message: latest.message });
        if (isSoundEnabled()) {
          toAnnounce.forEach((notif, i) => {
            if (!shouldPlaySound(notif)) return;
            setTimeout(() => playOrderSound(), i * 300);
          });
        }
      }

      if (announcedIdsRef.current.size > MAX_ANNOUNCED_STORED) {
        const ids = Array.from(announcedIdsRef.current);
        announcedIdsRef.current = new Set(ids.slice(-MAX_ANNOUNCED_STORED));
        saveAnnouncedIds(announcedIdsRef.current);
      } else if (toAnnounce.length > 0) {
        saveAnnouncedIds(announcedIdsRef.current);
      }

      prevUnreadRef.current = newCount;
      setNotifications(newNotifs);
      setUnreadCount(newCount);
    } catch (err) {
      console.error('Notifications fetch failed:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      console.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      console.error('Failed to mark all as read');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* New order toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{toast.title}</p>
                <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-white/70 hover:text-white ml-2 text-lg leading-none">&times;</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 text-gray-300 hover:text-primary-400 transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {showDropdown && (
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClose={() => setShowDropdown(false)}
            onNotificationClick={(link) => {
              if (link) {
                router.push(link);
                setShowDropdown(false);
              }
            }}
          />
        )}
      </div>
    </>
  );
}
