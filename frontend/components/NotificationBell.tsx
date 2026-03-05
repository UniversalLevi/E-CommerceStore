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
  type ToastItem = { id: string; title: string; message: string };
  const [visibleToasts, setVisibleToasts] = useState<ToastItem[]>([]);
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const hydratedRef = useRef(false);
  const MAX_VISIBLE = 5;
  const TOAST_AUTO_DISMISS_MS = 5500;

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

  // Refill visible toasts from queue when there's space (max 5 on screen).
  // Stagger auto-dismiss so they leave one-by-one and the next from queue appears in the freed slot.
  useEffect(() => {
    if (visibleToasts.length >= MAX_VISIBLE || toastQueue.length === 0) return;
    const space = MAX_VISIBLE - visibleToasts.length;
    const toAdd = toastQueue.slice(0, Math.min(space, toastQueue.length));
    if (toAdd.length === 0) return;

    setVisibleToasts((prev) => [...prev, ...toAdd]);
    setToastQueue((prev) => prev.slice(toAdd.length));

    const STAGGER_MS = 600;
    toAdd.forEach((t, i) => {
      if (isSoundEnabled()) setTimeout(() => playOrderSound(), i * 400);
      setTimeout(() => {
        setVisibleToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, TOAST_AUTO_DISMISS_MS + i * STAGGER_MS);
    });
  }, [visibleToasts.length, toastQueue.length]);

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
      const toAnnounce: Notification[] = [];
      for (const notif of newNotifs) {
        // Skip already-read notifications for toast logic so they never re-announce
        if (notif.read) continue;
        if (!orderTypes.includes(notif.type) && !notif.playSound) continue;
        if (announcedIdsRef.current.has(notif._id)) continue;
        announcedIdsRef.current.add(notif._id);
        toAnnounce.push(notif);
      }
      if (toAnnounce.length > 0) {
        // Mark announced notifications as read in the backend so they won't reappear on future sessions/devices
        try {
          await Promise.all(
            toAnnounce.map((n) =>
              api.put(`/api/notifications/${n._id}/read`).catch(() => {
                // ignore individual failures; they'll just appear again once
              })
            )
          );
        } catch {
          // ignore batch failure
        }

        const newToasts: ToastItem[] = toAnnounce.map((n) => ({ id: n._id, title: n.title, message: n.message }));
        setToastQueue((prev) => [...prev, ...newToasts]);
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
      {/* Visible toasts (max 5); queue drains one-by-one as these dismiss */}
      {(visibleToasts.length > 0 || toastQueue.length > 0) && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-[380px]">
          {visibleToasts.map((t, idx) => (
            <div
              key={t.id}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12] backdrop-blur-xl shadow-2xl transition-all duration-200 hover:border-violet-500/30 animate-[slideInRight_0.35s_ease-out_both]"
              style={{
                boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
                animationDelay: `${idx * 50}ms`,
              }}
            >
              {/* Live indicator */}
              <div className="absolute top-3 right-12 flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 border border-emerald-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-[toast-live-pulse_1.5s_ease-in-out_infinite]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Live</span>
              </div>
              {/* Gradient accent stripe */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-purple-500 to-blue-500" />
              {/* Subtle theme gradient overlay */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-[0.07]"
                style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, transparent 50%, rgba(59,130,246,0.2) 100%)' }}
              />
              <div className="relative flex gap-3 pl-4 pr-3 pt-3.5 pb-4">
                {/* Icon pill – theme gradient */}
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1 pt-0.5 pr-16">
                  <p className="font-semibold text-[15px] tracking-tight bg-gradient-to-r from-violet-300 via-purple-300 to-blue-300 bg-clip-text text-transparent">
                    {t.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[var(--text-secondary)]">{t.message}</p>
                </div>
                <button
                  onClick={() => setVisibleToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="absolute top-3 right-3 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-violet-300 hover:bg-violet-500/15 transition-colors text-lg leading-none"
                  aria-label="Dismiss"
                >
                  &times;
                </button>
              </div>
              {/* Countdown bar – live "time left" */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                <div
                  className="h-full w-full origin-left rounded-b-2xl bg-gradient-to-r from-emerald-500 to-violet-500"
                  style={{ animation: 'toast-live-shrink 5.5s linear forwards' }}
                />
              </div>
            </div>
          ))}
          {toastQueue.length > 0 && (
            <p className="text-[11px] text-[var(--text-tertiary)] px-1 py-0.5 animate-pulse">
              {toastQueue.length} more notification{toastQueue.length !== 1 ? 's' : ''} coming…
            </p>
          )}
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
