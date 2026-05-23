'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Flame, ArrowRight, Filter, Search, Clock, Tag } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';
import { useTrans } from '@/i18n';

interface Offre {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
  price: number | null;
  href: string;
  // Promotion fields
  promoTitle: string;
  discountPercent: number;
  endDate: string;
  establishmentName: string;
  discountedPrice: number | null;
}

const CATEGORIES_RAW: { id: string; labelKey: 'categoryAll' | 'categoryHotels' | 'categoryRestaurants' | 'categoryAttractions' | 'categoryActivities' }[] = [
  { id: 'all', labelKey: 'categoryAll' },
  { id: 'hotel', labelKey: 'categoryHotels' },
  { id: 'restaurant', labelKey: 'categoryRestaurants' },
  { id: 'attraction', labelKey: 'categoryAttractions' },
  { id: 'activite', labelKey: 'categoryActivities' },
];

const formatPrice = (price: number) => price.toLocaleString('fr-FR') + ' Ar';

function Countdown({ endDate }: { endDate: string }) {
  const t = useTrans('offres');
  const computeRemaining = useCallback(() => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h ${t.timeRemainingDay}`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}min ${t.timeRemainingHour}`;
  }, [endDate, t]);

  const [remaining, setRemaining] = useState<string | null>(() => computeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(computeRemaining());
    }, 60_000);
    return () => clearInterval(timer);
  }, [computeRemaining]);

  if (!remaining) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-orange-300/80">
      <Clock className="w-3 h-3" />
      {remaining}
    </span>
  );
}

export function OffresHero() {
  const t = useTrans('offres');
  return (
    <div className="relative py-32 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-purple-500/20" />
      <div className="max-w-7xl mx-auto relative text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full text-orange-400 text-sm mb-6">
          <Flame className="w-4 h-4" />
          {t.heroBadge}
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          {t.heroTitlePart1} <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{t.heroTitleHighlight}</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          {t.heroDesc}
        </p>
      </div>
    </div>
  );
}

export default function OffresContent({ offres }: { offres: Offre[] }) {
  const t = useTrans('offres');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredOffres = activeCategory === 'all'
    ? offres
    : offres.filter(o => o.category === activeCategory);

  if (offres.length === 0) {
    return (
      <div className="text-center py-20">
        <Search className="w-16 h-16 text-gray-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-300 mb-3">{t.emptyTitle}</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          {t.emptyDesc}
        </p>
        <Link
          href="/bons-plans"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
        >
          {t.emptyCta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Filtres */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-2">
        <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
        {CATEGORIES_RAW.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-label={`${t.filterAria} ${t[cat.labelKey]}`}
            aria-pressed={activeCategory === cat.id}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                : 'bg-[#1a1a24] border border-[#2a2a36] text-gray-400 hover:text-white hover:border-orange-500/50'
            }`}
          >
            {t[cat.labelKey]}
          </button>
        ))}
      </div>

      {/* Empty filtered state */}
      {filteredOffres.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">{t.emptyFilter}</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-4 text-orange-400 hover:text-orange-300 transition-colors"
          >
            {t.showAll}
          </button>
        </div>
      )}

      {/* Offres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffres.map((offre) => (
          <Link
            key={offre.id}
            href={offre.href}
            className="bg-[#1a1a24] border border-[#2a2a36] rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all group block"
          >
            {/* Image */}
            <div className="relative h-48 overflow-hidden">
              {offre.image ? (
                <Image
                  src={getImageUrl(offre.image)}
                  alt={offre.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-pink-500/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Discount Badge */}
              {offre.discountPercent > 0 && (
                <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 rounded-lg text-white font-bold text-sm shadow-lg shadow-red-500/30">
                  -{offre.discountPercent}%
                </div>
              )}

              {/* Promo label */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-white text-xs font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> {t.promoLabel}
              </div>

              {/* Location */}
              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs">
                <MapPin className="w-3 h-3 text-orange-400" />
                {offre.location}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 capitalize">{offre.category}</span>
                {offre.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                    <span className="text-sm font-medium">{offre.rating.toFixed(1)}</span>
                    {offre.reviewCount > 0 && (
                      <span className="text-xs text-gray-500">({offre.reviewCount})</span>
                    )}
                  </div>
                )}
              </div>

              <h2 className="text-lg font-bold mb-1 line-clamp-1">{offre.title}</h2>

              {/* Promo title */}
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="w-3 h-3 text-orange-400" />
                <span className="text-sm text-orange-300 font-medium line-clamp-1">{offre.promoTitle}</span>
              </div>

              {offre.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{offre.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div>
                  {offre.discountedPrice && offre.price ? (
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-orange-400">
                        {formatPrice(offre.discountedPrice)}
                      </p>
                      <p className="text-sm text-gray-500 line-through">
                        {formatPrice(offre.price)}
                      </p>
                    </div>
                  ) : offre.price ? (
                    <p className="text-xl font-bold text-orange-400">
                      {formatPrice(offre.price)}
                    </p>
                  ) : (
                    <span className="text-sm text-gray-500">{t.priceOnRequest}</span>
                  )}
                  <Countdown endDate={offre.endDate} />
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-semibold group-hover:shadow-lg group-hover:shadow-orange-500/30 transition-all flex items-center gap-1">
                  {t.seeBtn}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
