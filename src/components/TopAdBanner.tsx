'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface AdData {
  id: string;
  imageUrl: string;
  linkUrl?: string | null;
  altText?: string | null;
}

interface TopAdBannerProps {
  ad?: AdData;
}

export default function TopAdBanner({ ad }: TopAdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentAd, setCurrentAd] = useState<AdData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Fetch active top banner ad from API
  useEffect(() => {
    const fetchTopAd = async () => {
      try {
        const res = await fetch('/api/ads?position=top_banner&limit=1');
        const data = await res.json();
        if (data.success && data.ads && data.ads.length > 0) {
          setCurrentAd(data.ads[0]);
        }
      } catch (error) {
        console.error('Error fetching top ad:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (ad) {
      setCurrentAd(ad);
      setIsLoading(false);
    } else {
      fetchTopAd();
    }
  }, [ad]);

  // Check if user has dismissed the ad recently (session storage)
  useEffect(() => {
    const dismissed = sessionStorage.getItem('topAdDismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('topAdDismissed', 'true');
  };

  const handleAdClick = () => {
    if (currentAd?.linkUrl) {
      // Track click via API
      fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: currentAd.id }),
      }).catch(() => {});

      window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Don't render if loading, no ad, or dismissed
  if (isLoading || !currentAd || !currentAd.imageUrl || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full"
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-all opacity-70 hover:opacity-100"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Ad Image - Full width, height for 600x150 images */}
          <div
            className={`w-full h-[120px] md:h-[150px] overflow-hidden ${currentAd.linkUrl ? 'cursor-pointer' : ''}`}
            onClick={handleAdClick}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(currentAd.imageUrl)}
              alt={currentAd.altText || 'Publicité'}
              className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          {/* Subtle PUBLICITÉ label */}
          <div className="absolute bottom-1 right-2">
            <span className="text-[9px] text-white/60 bg-black/30 px-1.5 py-0.5 rounded tracking-wider uppercase">
              Publicité
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
