'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';

interface Ad {
  id: string;
  position: string;
  format: string;
  imageUrl: string;
  linkUrl?: string;
  altText?: string;
}

// Placeholder component when no ad is available
function AdPlaceholder({ height, label }: { width: number; height: number; label: string }) {
  return (
    <div className="bg-white/10 flex items-center justify-center" style={{ height: `${height}px` }}>
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">📢</div>
        <p className="text-sm font-medium">Espace Publicitaire</p>
        <p className="text-xs">{label}</p>
      </div>
    </div>
  );
}

// Rotating Ad Display component - supports multiple ads with auto-rotation
function RotatingAdDisplay({
  ads,
  width,
  height,
  label,
  rotationInterval = 5000 // 5 seconds par défaut
}: {
  ads: Ad[];
  width: number;
  height: number;
  label: string;
  rotationInterval?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Rotation automatique si plusieurs pubs
  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
        setIsTransitioning(false);
      }, 300); // Durée de la transition
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [ads.length, rotationInterval]);

  const handleClick = useCallback(async (ad: Ad) => {
    if (ad?.id) {
      try {
        await fetch('/api/ads/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: ad.id }),
        });
      } catch (error) {
        console.error('Error tracking ad click:', error);
      }
    }
  }, []);

  // Aucune pub
  if (ads.length === 0) {
    return <AdPlaceholder width={width} height={height} label={label} />;
  }

  const currentAd = ads[currentIndex];

  if (!currentAd || !currentAd.imageUrl) {
    return <AdPlaceholder width={width} height={height} label={label} />;
  }

  const content = (
    <div className="relative w-full overflow-hidden" style={{ height: `${height}px` }}>
      <Image
        src={getImageUrl(currentAd.imageUrl)}
        alt={currentAd.altText || 'Publicité'}
        fill
        sizes={`${width}px`}
        className={`object-cover transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {/* Indicateurs si plusieurs pubs */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Publicité ${idx + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-white scale-110'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (currentAd.linkUrl) {
    return (
      <a
        href={currentAd.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleClick(currentAd)}
        className="block"
      >
        {content}
      </a>
    );
  }

  return <div onClick={() => handleClick(currentAd)}>{content}</div>;
}

// Hook to fetch ads
function useAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        const data = await res.json();
        if (data.success) {
          setAds(data.ads);
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  return { ads, loading };
}

// Get all ads for a specific position (pour rotation)
function getAdsForPosition(ads: Ad[], position: string): Ad[] {
  return ads.filter(ad => ad.position === position);
}

// Mode Desktop - Sidebar à droite
export function AdSidebarDesktop() {
  const { ads, loading } = useAds();

  if (loading) {
    return (
      <aside className="space-y-6">
        <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
          <div className="bg-white/10 h-[300px]"></div>
        </div>
        <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
          <div className="bg-white/10 h-[250px]"></div>
        </div>
        <div className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
          <div className="bg-white/10 h-[600px]"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="space-y-6">
      {/* Espace Pub 1 - Grande (300x300) - avec rotation */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <RotatingAdDisplay
          ads={getAdsForPosition(ads, 'sidebar_top')}
          width={300}
          height={300}
          label="300 x 300"
        />
      </div>

      {/* Espace Pub 2 - Moyenne (300x250) - avec rotation */}
      <div className="bg-white/5 rounded-xl overflow-hidden">
        <RotatingAdDisplay
          ads={getAdsForPosition(ads, 'sidebar_middle')}
          width={300}
          height={250}
          label="300 x 250"
        />
      </div>

      {/* Espace Pub 3 - Sticky (300x600) - avec rotation */}
      <div className="sticky top-4">
        <div className="bg-white/5 rounded-xl overflow-hidden">
          <RotatingAdDisplay
            ads={getAdsForPosition(ads, 'sidebar_bottom')}
            width={300}
            height={600}
            label="300 x 600"
          />
        </div>
      </div>
    </aside>
  );
}

// Mode Mobile - Bannière horizontale (320x100) - avec rotation
export function AdBannerMobile() {
  const { ads, loading } = useAds();

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl overflow-hidden my-6 animate-pulse">
        <div className="bg-white/10 h-[100px]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden my-6">
      <RotatingAdDisplay
        ads={getAdsForPosition(ads, 'mobile_banner')}
        width={320}
        height={100}
        label="320 x 100 (Mobile)"
      />
    </div>
  );
}

// Mode Mobile - Bannière carrée entre les sections (300x250) - avec rotation
export function AdSquareMobile() {
  const { ads, loading } = useAds();

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl overflow-hidden my-6 animate-pulse">
        <div className="bg-white/10 h-[250px]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl overflow-hidden my-6">
      <RotatingAdDisplay
        ads={getAdsForPosition(ads, 'mobile_square')}
        width={300}
        height={250}
        label="300 x 250 (Mobile)"
      />
    </div>
  );
}

// Export par défaut pour compatibilité
export default function AdSidebar() {
  return <AdSidebarDesktop />;
}
