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
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-sm">
              Notifications {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Fermer les notifications" className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => {
                const dotColor = TYPE_COLORS[notif.type] || 'bg-gray-400';
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.isRead ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead([notif.id]);
                    }}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${dotColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{notif.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</div>
                      <div className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</div>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead([notif.id]);
                        }}
                        className="shrink-0 p-1 hover:bg-blue-100 rounded"
                        title="Marquer comme lu"
                        aria-label="Marquer la notification comme lue"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-500" />
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
