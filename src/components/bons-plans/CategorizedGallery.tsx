'use client';

import { useState, useCallback } from 'react';
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

  if (allImages.length === 0) {
    return (
      <div className="relative h-[50vh] md:h-[60vh] bg-[#111114] border-y border-[#27272A] flex items-center justify-center">
        <Building2 className="w-20 h-20 text-[#3F3F46]" />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[50vh] md:h-[60vh] bg-[#0A0A0F] group">
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

        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/70 via-transparent to-[#0A0A0F]/30 pointer-events-none" />

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
                    : 'bg-[#111114]/80 border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46]'
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
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#FAFAFA] transition-colors z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#FAFAFA] transition-colors z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom button */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-20 right-4 p-2 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#FAFAFA] transition-colors z-10"
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
                  currentIndex === i ? 'border-[#FF6B35]' : 'border-[#27272A] opacity-70 hover:opacity-100'
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
              <span className="text-[11px] font-mono text-[#A1A1AA] ml-1">+{currentImages.length - 8}</span>
            )}
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-4 right-4 px-2.5 py-1 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] rounded-md text-[12px] font-mono text-[#FAFAFA] z-10">
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
              className="absolute top-4 right-4 p-2.5 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#FAFAFA] z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#FAFAFA]"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[#111114]/80 backdrop-blur-md border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#FAFAFA]"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            <div className="relative w-full h-full max-w-5xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
              <Image
                src={currentImages[currentIndex]}
                alt={`${establishmentName} - photo ${currentIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[#A1A1AA] text-[12px] font-mono">
              {currentIndex + 1} / {currentImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
