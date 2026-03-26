'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [images.length]);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[currentIndex].src;
    link.download = images[currentIndex].title || `image-${currentIndex + 1}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="lightbox-overlay"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="lightbox-close"
          aria-label="Fermer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation - Previous */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="lightbox-nav lightbox-nav-prev"
            aria-label="Image précédente"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Main image */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative flex flex-col items-center justify-center max-w-full max-h-full p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.img
            src={getImageUrl(currentImage.src)}
            alt={currentImage.alt || `Image ${currentIndex + 1}`}
            className={`lightbox-content rounded-lg transition-transform duration-300 ${
              isZoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'
            }`}
            onClick={toggleZoom}
            style={{ maxWidth: isZoomed ? '150%' : '90vw', maxHeight: isZoomed ? '150%' : '80vh' }}
          />

          {/* Image title */}
          {currentImage.title && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white text-lg font-medium mt-4 text-center"
            >
              {currentImage.title}
            </motion.p>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={toggleZoom}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              aria-label={isZoomed ? 'Dézoomer' : 'Zoomer'}
            >
              {isZoomed ? (
                <ZoomOut className="w-5 h-5 text-white" />
              ) : (
                <ZoomIn className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Télécharger"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <div className="text-white/60 text-sm mt-4">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </motion.div>

        {/* Navigation - Next */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="lightbox-nav lightbox-nav-next"
            aria-label="Image suivante"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setIsZoomed(false);
                }}
                aria-label={`Voir image ${index + 1}`}
                className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-75'
                }`}
              >
                <Image
                  src={getImageUrl(image.src)}
                  alt={`Miniature ${index + 1}`}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
