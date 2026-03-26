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
}

export default function CategorizedGallery({
  coverImage,
  images,
  categories = [],
  establishmentName,
}: CategorizedGalleryProps) {
  const allImages = [coverImage, ...images].filter(Boolean).map((img) => getImageUrl(img as string)) as string[];

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
      <div className="relative h-[50vh] md:h-[60vh] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
        <Building2 className="w-24 h-24 text-slate-500" />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[50vh] md:h-[60vh] bg-slate-900 group">
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Category tabs */}
        {tabs.length > 1 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => switchTab(i)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm transition-all ${
                  activeTab === i
                    ? 'bg-orange-500 text-white'
                    : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'
                }`}
              >
                {tab.label} ({tab.images.length})
              </button>
            ))}
          </div>
        )}

        {/* Prev/Next */}
        {currentImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Zoom button */}
        <button
          onClick={() => setLightbox(true)}
          className="absolute bottom-20 right-4 p-2.5 bg-black/50 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-black/70 transition-all z-10"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Thumbnail strip */}
        {currentImages.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {currentImages.slice(0, 8).map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  currentIndex === i ? 'border-orange-500 scale-110' : 'border-white/30 opacity-70 hover:opacity-100'
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
              <span className="text-xs text-white/60 ml-1">+{currentImages.length - 8}</span>
            )}
          </div>
        )}

        {/* Counter */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-sm text-white/80 z-10">
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
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {currentImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20"
                >
                  <ChevronRight className="w-8 h-8" />
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

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              {currentIndex + 1} / {currentImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
