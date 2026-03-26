'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('mada-spot-cookie-consent');
    if (!consent) {
      // Afficher après un court délai pour ne pas bloquer le rendu initial
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleAccept = () => {
    localStorage.setItem('mada-spot-cookie-consent', 'accepted');
    window.dispatchEvent(new Event('cookie-consent-changed'));
    setVisible(false);
  };

  const handleRefuse = () => {
    localStorage.setItem('mada-spot-cookie-consent', 'refused');
    window.dispatchEvent(new Event('cookie-consent-changed'));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[var(--card-bg)] rounded-xl shadow-2xl border dark:border-[var(--card-border)] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Nous utilisons des cookies essentiels pour le fonctionnement du site (sessions, préférences).
            En continuant, vous acceptez notre{' '}
            <Link href="/politique-confidentialite" className="text-orange-500 underline hover:text-orange-600">
              politique de confidentialité
            </Link>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleRefuse}
            className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
