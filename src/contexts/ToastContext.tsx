'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-green-500/15 border-green-500/30 text-green-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  warning: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  info: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000, title?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-4), { id, type, message, title, duration }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const contextValue: ToastContextType = {
    toast: addToast,
    success: useCallback((msg: string, title?: string) => addToast(msg, 'success', 4000, title), [addToast]),
    error: useCallback((msg: string, title?: string) => addToast(msg, 'error', 5000, title), [addToast]),
    warning: useCallback((msg: string, title?: string) => addToast(msg, 'warning', 4000, title), [addToast]),
    info: useCallback((msg: string, title?: string) => addToast(msg, 'info', 4000, title), [addToast]),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg ${STYLES[t.type]}`}
              >
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex-1">
                  {t.title && <p className="text-xs font-semibold text-white/70 mb-0.5">{t.title}</p>}
                  <p className="text-sm font-medium text-white/90">{t.message}</p>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  aria-label="Fermer la notification"
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
