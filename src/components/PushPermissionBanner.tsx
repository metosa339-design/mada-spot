'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useCsrf } from '@/hooks/useCsrf';

const DISMISSED_KEY = 'mada-spot-push-dismissed';

export default function PushPermissionBanner() {
  const { isSupported, permission, isSubscribed, loading, subscribe } = usePushSubscription();
  const { csrfToken } = useCsrf();
  const [dismissed, setDismissed] = useState(true); // Start hidden until check
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Check sessionStorage for dismissal
    const wasDismissed = sessionStorage.getItem(DISMISSED_KEY);
    setDismissed(!!wasDismissed);
  }, []);

  const handleActivate = async () => {
    if (!csrfToken || subscribing) return;
    setSubscribing(true);
    try {
      await subscribe(csrfToken);
    } finally {
      setSubscribing(false);
      setDismissed(true);
      sessionStorage.setItem(DISMISSED_KEY, '1');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  // Don't show if: loading, not supported, already granted/denied, already subscribed, or dismissed
  const shouldShow =
    !loading &&
    isSupported &&
    permission === 'default' &&
    !isSubscribed &&
    !dismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-lg"
        >
          <div className="relative rounded-xl bg-gray-900 border border-gray-700 p-4 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Bell icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Activer les notifications
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recevez des alertes pour vos reservations et messages
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleActivate}
                    disabled={subscribing || !csrfToken}
                    className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {subscribing ? 'Activation...' : 'Activer'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
