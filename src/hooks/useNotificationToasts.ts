'use client';

import { useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/contexts/ToastContext';

const TYPE_TO_TOAST: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  BOOKING_NEW: 'info',
  BOOKING_CONFIRMED: 'success',
  BOOKING_CANCELLED: 'warning',
  BOOKING_COMPLETED: 'success',
  REVIEW_NEW: 'info',
  MESSAGE_NEW: 'info',
  EVENT_NEW: 'info',
  GHOST_CREATED: 'info',
  CLAIM_SUBMITTED: 'info',
  CLAIM_APPROVED: 'success',
  CLAIM_REJECTED: 'warning',
  IMPORT_COMPLETED: 'success',
  SYSTEM: 'info',
};

const MAX_TOASTS_PER_CYCLE = 3;

export function useNotificationToasts() {
  const result = useNotifications();
  const { toast } = useToast();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (result.loading) return;

    // On first load, populate seen set without toasting
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      for (const n of result.notifications) {
        seenIdsRef.current.add(n.id);
      }
      return;
    }

    // Detect new unread notifications
    const newNotifications = result.notifications.filter(
      (n) => !seenIdsRef.current.has(n.id) && !n.isRead
    );

    if (newNotifications.length === 0) return;

    // Add all to seen set
    for (const n of newNotifications) {
      seenIdsRef.current.add(n.id);
    }

    // Fire toasts (capped)
    const toShow = newNotifications.slice(0, MAX_TOASTS_PER_CYCLE);
    for (const n of toShow) {
      const toastType = TYPE_TO_TOAST[n.type] || 'info';
      toast(n.message || n.title, toastType, 6000, n.title);
    }

    // Summary toast for overflow
    const remaining = newNotifications.length - MAX_TOASTS_PER_CYCLE;
    if (remaining > 0) {
      toast(
        `Vous avez ${remaining} autre${remaining > 1 ? 's' : ''} notification${remaining > 1 ? 's' : ''}`,
        'info',
        5000
      );
    }
  }, [result.notifications, result.loading, toast]);

  // Keep seen set trimmed (prevent memory leak over very long sessions)
  useEffect(() => {
    if (seenIdsRef.current.size > 200) {
      const currentIds = new Set(result.notifications.map((n) => n.id));
      seenIdsRef.current = currentIds;
    }
  }, [result.notifications]);

  return result;
}
