'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
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
    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FF6B35] mt-1">
      <Clock className="w-3 h-3" />
      {remaining}
    </span>
  );
}

export function OffresHero() {
  const t = useTrans('offres');
  return (
    <div className="relative py-24 md:py-32 px-4 overflow-hidden bg-[#F8FAFC]">
      {/* Ambient blobs */}

      <div className="max-w-7xl mx-auto relative text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] border border-[#FF6B35]/30 rounded-md text-[#FF6B35] text-[11px] font-semibold uppercase tracking-[0.15em] mb-6">
          <Flame className="w-3.5 h-3.5" />
          {t.heroBadge}
        </div>
        <h1
          className="text-[32px] sm:text-[44px] lg:text-[56px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {t.heroTitlePart1} <span className="text-[#FF6B35]">{t.heroTitleHighlight}</span>
        </h1>
        <p className="text-[15px] text-[#64748B] max-w-2xl mx-auto leading-relaxed">
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
        <Search className="w-14 h-14 text-[#CBD5E1] mx-auto mb-6" />
        <h2 className="text-[22px] font-semibold text-[#0F172A] mb-3">{t.emptyTitle}</h2>
        <p className="text-[#64748B] max-w-md mx-auto mb-8 leading-relaxed">
          {t.emptyDesc}
        </p>
        <Link
          href="/bons-plans"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
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
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
        <Filter className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
        {CATEGORIES_RAW.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            aria-label={`${t.filterAria} ${t[cat.labelKey]}`}
            aria-pressed={activeCategory === cat.id}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors border ${
              activeCategory === cat.id
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
            }`}
          >
            {t[cat.labelKey]}
          </button>
        ))}
      </div>

      {/* Empty filtered state */}
      {filteredOffres.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#64748B] text-[14px]">{t.emptyFilter}</p>
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-4 text-[#FF6B35] hover:underline text-[13px]"
          >
            {t.showAll}
          </button>
        </div>
      )}

      {/* Offres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOffres.map((offre) => (
          <motion.div
            key={offre.id}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={offre.href}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl overflow-hidden transition-colors group block"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-white">
                {offre.image ? (
                  <Image
                    src={getImageUrl(offre.image)}
                    alt={offre.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-white" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Discount Badge */}
                {offre.discountPercent > 0 && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#FF6B35] rounded-md text-white font-semibold text-[12px] font-mono shadow-[0_4px_20px_rgba(255,107,53,0.4)]">
                    -{offre.discountPercent}%
                  </div>
                )}

                {/* Promo label */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FFF7ED] backdrop-blur-md border border-[#FF6B35]/30 rounded-md text-[#FF6B35] text-[11px] font-semibold uppercase tracking-[0.1em] flex items-center gap-1">
                  <Flame className="w-3 h-3" /> {t.promoLabel}
                </div>

                {/* Location */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-md text-[#0F172A] text-[11px]">
                  <MapPin className="w-3 h-3 text-[#64748B]" />
                  {offre.location}
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-[0.15em] text-[#94A3B8] capitalize">{offre.category}</span>
                  {offre.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                      <span className="text-[13px] font-mono text-[#0F172A]">{offre.rating.toFixed(1)}</span>
                      {offre.reviewCount > 0 && (
                        <span className="text-[11px] text-[#94A3B8]">({offre.reviewCount})</span>
                      )}
                    </div>
                  )}
                </div>

                <h2 className="text-[16px] font-semibold text-[#0F172A] mb-1 line-clamp-1 group-hover:text-[#FF6B35] transition-colors">{offre.title}</h2>

                {/* Promo title */}
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3 h-3 text-[#FF6B35]" />
                  <span className="text-[12px] text-[#FF6B35] font-medium line-clamp-1">{offre.promoTitle}</span>
                </div>

                {offre.description && (
                  <p className="text-[12px] text-[#64748B] mb-3 line-clamp-2 leading-relaxed">{offre.description}</p>
                )}

                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    {offre.discountedPrice && offre.price ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[18px] font-semibold font-mono text-[#0F172A]">
                          {formatPrice(offre.discountedPrice)}
                        </p>
                        <p className="text-[12px] font-mono text-[#94A3B8] line-through">
                          {formatPrice(offre.price)}
                        </p>
                      </div>
                    ) : offre.price ? (
                      <p className="text-[18px] font-semibold font-mono text-[#0F172A]">
                        {formatPrice(offre.price)}
                      </p>
                    ) : (
                      <span className="text-[12px] text-[#64748B]">{t.priceOnRequest}</span>
                    )}
                    <Countdown endDate={offre.endDate} />
                  </div>
                  <span className="px-3.5 py-2 bg-white border border-[#E2E8F0] group-hover:bg-[#FF6B35] group-hover:border-[#FF6B35] text-[#0F172A] group-hover:text-white rounded-lg text-[12px] font-medium transition-colors flex items-center gap-1 shrink-0">
                    {t.seeBtn}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
}
