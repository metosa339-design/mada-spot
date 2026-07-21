'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Building2 } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';

interface GalleryCategory {
  label: string;
  images: string[];
}

interface CategorizedGalleryProps {
  coverImage?: string | null;
  images: string[];
  categories?: GalleryCategory[];
  establishmentName: string;
  /**
   * Image to use when the establishment has no coverImage / images at all.
   * Should already be an absolute or local path; getImageUrl is applied internally.
   */
  fallbackImage?: string | null;
}

export default function CategorizedGallery({
  coverImage,
  images,
  categories = [],
  establishmentName,
  fallbackImage,
}: CategorizedGalleryProps) {
  const baseImages = [coverImage, ...images].filter(Boolean) as string[];
  const allImages = (
    baseImages.length > 0
      ? baseImages
      : (fallbackImage ? [fallbackImage] : [])
  ).map((img) => getImageUrl(img));

  // Build tabs: "Tous" + each category that has images
  const tabs: { label: string; images: string[] }[] = [
    { label: 'Tous', images: allImages },
    ...categories.filter((c) => c.images.length > 0).map((c) => ({
      ...c,
      images: c.images.map((img) => getImageUrl(img)),
    })),
  ];

  const [activeTab, setActiveTab] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const currentImages = tabs[activeTab]?.images || allImages;

  const switchTab = (idx: number) => {
    setActiveTab(idx);
    setCurrentIndex(0);
  };

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % currentImages.length);
  }, [currentImages.length]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + currentImages.length) % currentImages.length);
  }, [currentImages.length]);

  // Autoplay du carrousel de couverture (toutes les 5 s), en pause quand la
  // visionneuse plein écran est ouverte.
  useEffect(() => {
    if (lightbox || currentImages.length <= 1) return;
    const id = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % currentImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [lightbox, currentImages.length, activeTab]);

  // Navigation clavier dans la visionneuse plein écran.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, prev, next]);

  if (allImages.length === 0) {
    return (
      <div className="relative h-[50vh] md:h-[60vh] bg-white border-y border-[#E2E8F0] flex items-center justify-center">
        <Building2 className="w-20 h-20 text-[#CBD5E1]" />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[50vh] md:h-[60vh] bg-[#F8FAFC] group">
        {/* Main image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <Image
              src={currentImages[currentIndex]}
              alt={`${establishmentName} - photo ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

        {/* Category tabs */}
        {tabs.length > 1 && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => switchTab(i)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium border backdrop-blur-md transition-colors ${
                  activeTab === i
                    ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                    : 'bg-white/80 border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                }`}
              >
                {tab.label} <span className="font-mono opacity-70">({tab.images.length})</span>
              </button>
            ))}
          </div>
        )}

        {/* Prev/Next */}
        {currentImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-md border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-[#0F172A] transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-md border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-[#0F172A] transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom button */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-20 right-4 p-2 bg-white/80 backdrop-blur-md border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-[#0F172A] transition-colors z-10"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Thumbnail strip */}
        {currentImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {currentImages.slice(0, 8).map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-10 h-10 rounded-md overflow-hidden border transition-colors ${
                  currentIndex === i ? 'border-[#FF6B35]' : 'border-[#E2E8F0] opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {currentImages.length > 8 && (
              <span className="text-[11px] font-mono text-[#64748B] ml-1">+{currentImages.length - 8}</span>
            )}
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-md text-[12px] font-mono text-[#0F172A] z-10">
          {currentIndex + 1} / {currentImages.length}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(false)}
          >
            <button
              onClick={() => setLightbox(false)}
              aria-label="Fermer"
              className="absolute top-4 right-4 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Image précédente"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md transition-colors"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Image suivante"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md transition-colors"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}

            <div className="relative w-[95vw] h-[88vh] max-w-[1600px]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={currentImages[currentIndex]}
                alt={`${establishmentName} - photo ${currentIndex + 1}`}
                fill
                sizes="95vw"
                className="object-contain"
                priority
              />
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/80 text-[12px] font-mono">
              {currentIndex + 1} / {currentImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
