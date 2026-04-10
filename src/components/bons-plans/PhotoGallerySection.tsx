'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, ZoomIn } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface GalleryItem {
  url: string;
  caption?: string;
}

interface PhotoGallerySectionProps {
  images: string[];
  gallery?: GalleryItem[];
  coverImage?: string;
}

export default function PhotoGallerySection({ images, gallery, coverImage }: PhotoGallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Combine gallery items (with captions) and plain images
  const allItems: GalleryItem[] = [];

  if (gallery && gallery.length > 0) {
    allItems.push(...gallery);
  }

  // Add plain images that aren't already in gallery
  const galleryUrls = new Set(allItems.map((g) => g.url));
  if (coverImage && !galleryUrls.has(coverImage)) {
    allItems.unshift({ url: coverImage, caption: 'Photo principale' });
  }
  images.forEach((img) => {
    if (!galleryUrls.has(img)) {
      allItems.push({ url: img });
    }
  });

  if (allItems.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = useCallback(() => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : allItems.length - 1)), [allItems.length]);
  const nextImage = useCallback(() => setLightboxIndex((i) => (i !== null && i < allItems.length - 1 ? i + 1 : 0)), [allItems.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, prevImage, nextImage]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  return (
    <>
      <section className="bg-[#1a1a24] rounded-2xl p-4 sm:p-6 md:p-8 border border-[#2a2a36]">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Camera className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg sm:text-xl font-bold text-white">Galerie Photos</h2>
          <span className="text-xs sm:text-sm text-slate-500">({allItems.length})</span>
        </div>

        {/* Grid - 2 cols mobile, 3 tablet, 4 desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {allItems.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden cursor-pointer bg-[#0a0a0f]"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={getImageUrl(item.url)}
                alt={item.caption || `Photo ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {/* Hover/tap overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 active:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 sm:w-8 sm:h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Caption */}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3">
                  <p className="text-white text-[10px] sm:text-xs font-medium line-clamp-2">{item.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full z-10"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 text-white/70 text-xs sm:text-sm z-10 bg-black/40 px-2 py-1 rounded-lg">
              {lightboxIndex + 1} / {allItems.length}
            </div>

            {/* Navigation - hidden on mobile (swipe instead), visible on desktop */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="hidden sm:block absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="hidden sm:block absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/10 rounded-full text-white hover:bg-white/20 z-10"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Mobile nav buttons (bottom) */}
            <div className="sm:hidden absolute bottom-28 left-0 right-0 flex justify-between px-4 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="p-3 bg-white/10 rounded-full text-white active:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="p-3 bg-white/10 rounded-full text-white active:bg-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <div
              className="relative w-full max-w-4xl h-[55vh] sm:h-[65vh] md:h-[70vh] mx-2 sm:mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={getImageUrl(allItems[lightboxIndex].url)}
                alt={allItems[lightboxIndex].caption || `Photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>

            {/* Caption */}
            {allItems[lightboxIndex].caption && (
              <div className="mt-3 sm:mt-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                <p className="text-white text-sm sm:text-base font-medium">{allItems[lightboxIndex].caption}</p>
              </div>
            )}

            {/* Thumbnails */}
            <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2 overflow-x-auto px-4 max-w-full pb-2" onClick={(e) => e.stopPropagation()}>
              {allItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`relative w-12 h-9 sm:w-16 sm:h-12 rounded-md sm:rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    i === lightboxIndex ? 'border-orange-500' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={getImageUrl(item.url)}
                    alt={item.caption || `Thumb ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
