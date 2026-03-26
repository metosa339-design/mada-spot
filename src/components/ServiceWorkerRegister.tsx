'use client';

import { useEffect } from 'react';
import PushPermissionBanner from '@/components/PushPermissionBanner';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently
      });
    }
  }, []);

  return <PushPermissionBanner />;
}
