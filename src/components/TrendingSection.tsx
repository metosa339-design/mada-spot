'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, TrendingUp, Hotel, UtensilsCrossed, Compass } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getEstablishmentImage } from '@/lib/establishment-image';

interface TrendingItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  coverImage: string | null;
  rating: number | null;
  reviewCount: number;
  priceRange: string | null;
  isFeatured: boolean;
  shortDescription: string | null;
  url: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any }> = {
  HOTEL: { label: 'Hôtel', icon: Hotel },
  RESTAURANT: { label: 'Restaurant', icon: UtensilsCrossed },
  ATTRACTION: { label: 'Attraction', icon: Compass },
};

export default function TrendingSection() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trending?limit=6')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.trending);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-12 bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] font-semibold">Tendances</p>
        </div>
        <h2 className="text-[24px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
          Les plus populaires
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const typeConf = TYPE_CONFIG[item.type] || TYPE_CONFIG.ATTRACTION;

            return (
              <motion.div key={item.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link
                  href={item.url}
                  className="group block bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] overflow-hidden transition-colors"
                >
                  <div className="relative h-44 bg-white">
                    <Image
                      src={getEstablishmentImage(item.type, item.city, item.name, item.coverImage)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    {item.isFeatured && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-[#FFF7ED] backdrop-blur-md border border-[#FF6B35]/30 text-[#FF6B35] text-[10px] font-semibold uppercase tracking-[0.1em] rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#FF6B35]" /> Featured
                      </span>
                    )}
                    <span className="absolute top-2 right-2 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[#0F172A]">
                      {typeConf.label}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-[#0F172A] text-[14px] truncate group-hover:text-[#FF6B35] transition-colors">{item.name}</h3>
                    <div className="flex items-center gap-1 text-[12px] text-[#64748B] mt-1">
                      <MapPin className="w-3 h-3" /> {item.city}
                    </div>
                    {item.shortDescription && (
                      <p className="text-[11px] text-[#94A3B8] mt-2 line-clamp-2 leading-relaxed">{item.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      {item.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
                          <span className="font-mono text-[#0F172A] text-[13px]">{item.rating.toFixed(1)}</span>
                          <span className="text-[#94A3B8] text-[11px]">({item.reviewCount})</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8]">Pas encore noté</span>
                      )}
                      {item.priceRange && (
                        <span className="text-[11px] font-mono text-[#64748B]">{item.priceRange}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
