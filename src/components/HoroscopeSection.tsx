'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Briefcase, Activity, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ZodiacSign, zodiacSigns, generateDailyHoroscope } from '@/data/horoscope';

const elementColors = {
  feu: 'from-red-500 to-orange-500',
  terre: 'from-green-600 to-emerald-500',
  air: 'from-blue-400 to-cyan-400',
  eau: 'from-blue-600 to-purple-500',
};

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

export default function HoroscopeSection() {
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>(zodiacSigns[0]);
  const [scrollIndex, setScrollIndex] = useState(0);

  const horoscope = useMemo(() => {
    return generateDailyHoroscope(selectedSign.id);
  }, [selectedSign.id]);

  const visibleSigns = 6;
  const canScrollLeft = scrollIndex > 0;
  const canScrollRight = scrollIndex < zodiacSigns.length - visibleSigns;

  const handleScrollLeft = () => {
    if (canScrollLeft) setScrollIndex(scrollIndex - 1);
  };

  const handleScrollRight = () => {
    if (canScrollRight) setScrollIndex(scrollIndex + 1);
  };

  return (
    <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 rounded-xl p-4 text-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-yellow-400" />
        <h2 className="text-base font-bold">Horoscope du Jour</h2>
      </div>

      {/* Zodiac Signs Carousel */}
      <div className="relative mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            className={`p-0.5 rounded-full ${canScrollLeft ? 'bg-white/20 hover:bg-white/30' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-hidden">
            <motion.div
              className="flex gap-1"
              animate={{ x: -scrollIndex * 52 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {zodiacSigns.map((sign) => (
                <button
                  key={sign.id}
                  onClick={() => setSelectedSign(sign)}
                  className={`flex-shrink-0 w-12 p-1.5 rounded-lg text-center transition-all ${
                    selectedSign.id === sign.id
                      ? `bg-gradient-to-br ${elementColors[sign.element]} shadow-lg scale-105`
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="text-lg">{sign.symbol}</div>
                  <div className="text-[8px] font-medium truncate">{sign.name}</div>
                </button>
              ))}
            </motion.div>
          </div>

          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            className={`p-0.5 rounded-full ${canScrollRight ? 'bg-white/20 hover:bg-white/30' : 'opacity-30 cursor-not-allowed'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Sign Info */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSign.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Sign Header */}
          <div className="flex items-center gap-3 mb-3 p-2 bg-white/10 rounded-lg">
            <div className={`text-2xl p-2 rounded-lg bg-gradient-to-br ${elementColors[selectedSign.element]}`}>
              {selectedSign.symbol}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold">{selectedSign.name}</h3>
              <p className="text-xs text-white/70 truncate">{selectedSign.dateRange}</p>
            </div>
          </div>

          {/* Horoscope Categories - 2x2 grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Heart className="w-3 h-3 text-pink-400" />
                <span className="font-medium text-xs">Amour</span>
                <div className="ml-auto"><StarRating score={horoscope.love.score} /></div>
              </div>
              <p className="text-[10px] text-white/70 line-clamp-2">{horoscope.love.message}</p>
            </div>

            <div className="p-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Briefcase className="w-3 h-3 text-blue-400" />
                <span className="font-medium text-xs">Travail</span>
                <div className="ml-auto"><StarRating score={horoscope.work.score} /></div>
              </div>
              <p className="text-[10px] text-white/70 line-clamp-2">{horoscope.work.message}</p>
            </div>

            <div className="p-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-green-400" />
                <span className="font-medium text-xs">Santé</span>
                <div className="ml-auto"><StarRating score={horoscope.health.score} /></div>
              </div>
              <p className="text-[10px] text-white/70 line-clamp-2">{horoscope.health.message}</p>
            </div>

            <div className="p-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="font-medium text-xs">Chance</span>
                <div className="ml-auto"><StarRating score={horoscope.luck.score} /></div>
              </div>
              <p className="text-[10px] text-white/70 line-clamp-2">{horoscope.luck.message}</p>
            </div>
          </div>

          {/* Lucky Info */}
          <div className="mt-2 p-2 bg-white/5 rounded-lg flex items-center justify-around text-xs">
            <div className="text-center">
              <span className="text-white/50 text-[10px]">Numéros</span>
              <div className="font-bold text-yellow-400 text-sm">{horoscope.luckyNumbers.join('-')}</div>
            </div>
            <div className="w-px h-6 bg-white/20" />
            <div className="text-center">
              <span className="text-white/50 text-[10px]">Couleur</span>
              <div className="font-bold capitalize text-sm">{horoscope.luckyColor}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
