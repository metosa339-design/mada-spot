'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface ReviewImageGalleryProps {
  images: string[];
}

export default function ReviewImageGallery({ images }: ReviewImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, 3);

  return (
    <>
      {/* Thumbnails */}
      <div className="flex flex-row gap-2 mt-2">
        {displayImages.map((src, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setSelectedImage(src)}
            className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg border border-[#2a2a36] hover:border-orange-500/50 transition-colors"
          >
            <img
              src={src}
              alt={`Photo avis ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Photo avis en plein écran"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
