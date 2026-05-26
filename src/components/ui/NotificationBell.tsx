'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useNotificationToasts } from '@/hooks/useNotificationToasts';

const TYPE_COLORS: Record<string, string> = {
  NEW_MESSAGE: 'bg-blue-500',
  NEW_QUOTE: 'bg-green-500',
  QUOTE_ACCEPTED: 'bg-emerald-500',
  QUOTE_REJECTED: 'bg-orange-500',
  NEW_REVIEW: 'bg-yellow-500',
  SERVICE_REQUEST: 'bg-purple-500',
  REMINDER: 'bg-red-500',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotificationToasts();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fermer le panel quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#64748B]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6B35] text-white text-[10px] font-semibold font-mono rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#0F0F14]">
            <h3 className="font-semibold text-[13px] text-[#0F172A]">
              Notifications {unreadCount > 0 && <span className="text-[#FF6B35] font-mono">({unreadCount})</span>}
            </h3>
            <div className="flex gap-3 items-center">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-[#FF6B35] hover:text-[#F97316] flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Fermer les notifications" className="text-[#94A3B8] hover:text-[#0F172A]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-[#94A3B8] text-[12px]">
                <Bell className="w-7 h-7 mx-auto mb-2 opacity-50" />
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => {
                const dotColor = TYPE_COLORS[notif.type] || 'bg-[#94A3B8]';
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[#E2E8F0] last:border-0 hover:bg-white transition-colors cursor-pointer ${
                      !notif.isRead ? 'bg-[#FF6B35]/5' : ''
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead([notif.id]);
                    }}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#0F172A] truncate">{notif.title}</div>
                      <div className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</div>
                      <div className="text-[10px] font-mono text-[#94A3B8] mt-1">{timeAgo(notif.createdAt)}</div>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead([notif.id]);
                        }}
                        className="shrink-0 p-1 hover:bg-[#FFF7ED] rounded"
                        title="Marquer comme lu"
                        aria-label="Marquer la notification comme lue"
                      >
                        <Check className="w-3 h-3 text-[#FF6B35]" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
