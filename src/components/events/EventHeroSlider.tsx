'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImageUrl } from '@/lib/image-url';

interface HeroEvent {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  city: string;
  category: string;
  coverImage?: string | null;
  eventType?: string;
  badge?: string | null;
  ctaLabel?: string | null;
  ctaLink?: string | null;
}

interface EventHeroSliderProps {
  events: HeroEvent[];
}

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  NOUVEAU: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  PROMO: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
  EXCLUSIF: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
  OFFICIEL: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
};

const TYPE_LABELS: Record<string, string> = {
  EVENT: 'Événement',
  PROMOTION: 'Promotion',
  ADVERTISEMENT: 'Partenaire',
};

export default function EventHeroSlider({ events }: EventHeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % events.length);
  }, [events.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + events.length) % events.length);
  }, [events.length]);

  // Auto-play every 6 seconds
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, events.length]);

  if (events.length === 0) return null;

  const event = events[current];
  const badgeStyle = event.badge ? BADGE_STYLES[event.badge] : null;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden mb-8 group">
      {/* Slide */}
      <div className="relative h-[280px] sm:h-[340px] md:h-[400px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={event.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            {/* Background image */}
            {event.coverImage ? (
              <Image
                src={getImageUrl(event.coverImage)}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-600 via-pink-600 to-purple-700" />
            )}

            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-10 md:px-14 max-w-2xl">
                {/* Type + Badge tags */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20">
                    {TYPE_LABELS[event.eventType || 'EVENT'] || 'Événement'}
                  </span>
                  {badgeStyle && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} flex items-center gap-1`}>
                      <Sparkles className="w-3 h-3" />
                      {event.badge}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 leading-tight line-clamp-2">
                  {event.title}
                </h2>

                {/* Description */}
                {event.description && (
                  <p className="text-gray-300 text-sm sm:text-base mb-4 line-clamp-2 max-w-lg">
                    {event.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-400" />
                    {event.city}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-400" />
                    {format(new Date(event.startDate), 'd MMM yyyy', { locale: fr })}
                    {event.endDate && ` - ${format(new Date(event.endDate), 'd MMM yyyy', { locale: fr })}`}
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/evenements/${event.slug}`}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Voir les détails
                  </Link>
                  {event.ctaLabel && event.ctaLink && (
                    <a
                      href={event.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl text-sm border border-white/20 transition-colors flex items-center gap-2"
                    >
                      {event.ctaLabel}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {events.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {events.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all rounded-full ${
                i === current
                  ? 'w-8 h-2 bg-orange-500'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {events.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
          <motion.div
            key={current}
            className="h-full bg-orange-500"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 6, ease: 'linear' }}
          />
        </div>
      )}
    </div>
  );
}
