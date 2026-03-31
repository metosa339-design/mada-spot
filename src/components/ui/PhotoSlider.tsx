'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoSliderProps {
  photos: { src: string; alt: string }[];
  interval?: number;
  className?: string;
}

export default function PhotoSlider({ photos, interval = 4000, className = '' }: PhotoSliderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % photos.length);
    }, interval);
    return () => clearInterval(timer);
  }, [photos.length, interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <Image
            src={photos[index].src}
            alt={photos[index].alt}
            fill
            className="object-cover"
            sizes="176px"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
