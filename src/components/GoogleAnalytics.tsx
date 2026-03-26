'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;

    const checkConsent = () => {
      const consent = localStorage.getItem('mada-spot-cookie-consent');
      setConsentGiven(consent === 'accepted');
    };

    checkConsent();

    // Listen for consent changes (same-tab event from CookieConsent)
    window.addEventListener('cookie-consent-changed', checkConsent);
    // Also listen for cross-tab storage changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'mada-spot-cookie-consent') checkConsent();
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('cookie-consent-changed', checkConsent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!GA_ID || !consentGiven) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}
