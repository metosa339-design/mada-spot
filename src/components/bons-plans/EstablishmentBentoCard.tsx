'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Hotel, Utensils, Compass } from 'lucide-react';
import OpenCloseBadge from './OpenCloseBadge';
import { getEstablishmentImage } from '@/lib/establishment-image';

interface BentoCardProps {
  establishment: {
    id: string;
    type: 'HOTEL' | 'RESTAURANT' | 'ATTRACTION';
    name: string;
    slug: string;
    coverImage?: string | null;
    city: string;
    district?: string | null;
    rating: number;
    reviewCount: number;
    isFeatured?: boolean;
    priceIndicator?: string | null;
    category?: string | null;
    subtype?: string | null;
    openingHours?: Record<string, { open: string; close: string; closed?: boolean }> | null;
  };
  size?: 'small' | 'medium' | 'large';
}

const typeConfig: Record<
  string,
  { icon: typeof Hotel; label: string; href: string }
> = {
  HOTEL: { icon: Hotel, label: 'Hôtel', href: '/hotels' },
  RESTAURANT: { icon: Utensils, label: 'Restaurant', href: '/restaurants' },
  ATTRACTION: { icon: Compass, label: 'Attraction', href: '/attractions' },
};

const categoryLabels: Record<string, string> = {
  GARGOTE: 'Gargote',
  RESTAURANT: 'Restaurant',
  LOUNGE: 'Lounge',
  CAFE: 'Café',
  FAST_FOOD: 'Fast Food',
  STREET_FOOD: 'Street Food',
};

export default memo(function EstablishmentBentoCard({
  establishment,
  size = 'medium',
}: BentoCardProps) {
  const config = typeConfig[establishment.type];
  const TypeIcon = config.icon;
  const detailUrl = `${config.href}/${establishment.slug}`;

  const categoryLabel = establishment.category
    ? categoryLabels[establishment.category] || establishment.category
    : establishment.subtype || null;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={size === 'large' ? 'col-span-2 row-span-2' : ''}
    >
      <Link
        href={detailUrl}
        className="group relative block overflow-hidden rounded-xl bg-[#111114] border border-[#27272A] hover:border-[#FF6B35]/30 hover:shadow-[0_8px_30px_rgba(255,107,53,0.08)] transition-all duration-300"
      >
        {/* Cover Image */}
        <div className={`relative overflow-hidden ${size === 'large' ? 'h-64' : 'aspect-[4/3]'}`}>
          <Image
            src={getEstablishmentImage(
              establishment.type,
              establishment.city,
              establishment.name,
              establishment.coverImage,
            )}
            alt={establishment.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />

          {/* Gradient overlay subtle */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/60 via-transparent to-transparent" />

          {/* Type badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0F]/70 backdrop-blur-md rounded-md border border-[#27272A]">
            <TypeIcon className="w-3 h-3 text-[#A1A1AA]" />
            <span className="text-[10px] font-medium text-[#FAFAFA] tracking-wide">
              {config.label}
            </span>
          </div>

          {/* Featured badge */}
          {establishment.isFeatured && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-[#FF6B35] rounded-md">
              <span className="text-[10px] font-bold text-white tracking-wider">TOP</span>
            </div>
          )}

          {/* Open/Close badge for restaurants */}
          {establishment.type === 'RESTAURANT' && establishment.openingHours && (
            <div className="absolute bottom-2.5 left-2.5">
              <OpenCloseBadge
                openingHours={establishment.openingHours}
                variant="badge"
                showNextOpen={false}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 border-t border-[#27272A]">
          <h3 className="text-[14px] font-semibold text-[#FAFAFA] leading-tight group-hover:text-[#FF6B35] transition-colors line-clamp-1 tracking-[-0.01em]">
            {establishment.name}
          </h3>

          {/* Category + City */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#A1A1AA]">
            {categoryLabel && (
              <>
                <span className="text-[#FDBA74]">{categoryLabel}</span>
                <span className="text-[#52525B]">·</span>
              </>
            )}
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 text-[#71717A] shrink-0" />
              <span className="truncate">
                {establishment.city}
                {establishment.district ? `, ${establishment.district}` : ''}
              </span>
            </div>
          </div>

          {/* Rating + Price */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#27272A]">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
              <span className="text-[13px] font-semibold text-[#FAFAFA] font-mono tabular-nums">
                {establishment.rating.toFixed(1)}
              </span>
              <span className="text-[11px] text-[#71717A]">({establishment.reviewCount})</span>
            </div>

            {establishment.priceIndicator && (
              <span className="text-[12px] font-medium font-mono text-[#FAFAFA]">
                {establishment.priceIndicator}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
