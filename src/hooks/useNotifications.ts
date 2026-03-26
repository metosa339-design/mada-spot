'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

const POLL_INTERVAL = 5_000; // 5 secondes
const POLL_INTERVAL_HIDDEN = 30_000; // 30s quand l'onglet est en arrière-plan

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationIds }),
      });
      setNotifications((prev) =>
        prev.map((n) => (notificationIds.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch {
      // silently fail
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  const startPolling = useCallback((interval: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchNotifications, interval);
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    startPolling(POLL_INTERVAL);

    // Visibility-aware polling: slow down when tab is hidden
    const handleVisibility = () => {
      if (document.hidden) {
        startPolling(POLL_INTERVAL_HIDDEN);
      } else {
        fetchNotifications();
        startPolling(POLL_INTERVAL);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // BroadcastChannel: instant refresh when push arrives via service worker
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('mada-notifications');
      bc.onmessage = () => fetchNotifications();
    } catch {
      // BroadcastChannel not supported
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      bc?.close();
    };
  }, [fetchNotifications, startPolling]);

  return { notifications, unreadCount, loading, markAsRead, markAllRead, refresh: fetchNotifications };
}
