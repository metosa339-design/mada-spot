'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Hotel, Utensils, Compass } from 'lucide-react';
import OpenCloseBadge from './OpenCloseBadge';
import { getImageUrl } from '@/lib/image-url';

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

const typeConfig: Record<string, { color: string; bgColor: string; icon: any; label: string; href: string }> = {
  HOTEL: { color: '#3B82F6', bgColor: 'bg-blue-500/10', icon: Hotel, label: 'Hôtel', href: '/bons-plans/hotels' },
  RESTAURANT: { color: '#F97316', bgColor: 'bg-orange-500/10', icon: Utensils, label: 'Restaurant', href: '/bons-plans/restaurants' },
  ATTRACTION: { color: '#10B981', bgColor: 'bg-emerald-500/10', icon: Compass, label: 'Attraction', href: '/bons-plans/attractions' },
};

const categoryLabels: Record<string, string> = {
  GARGOTE: 'Gargote',
  RESTAURANT: 'Restaurant',
  LOUNGE: 'Lounge',
  CAFE: 'Café',
  FAST_FOOD: 'Fast Food',
  STREET_FOOD: 'Street Food',
};

export default memo(function EstablishmentBentoCard({ establishment, size = 'medium' }: BentoCardProps) {
  const config = typeConfig[establishment.type];
  const TypeIcon = config.icon;
  const detailUrl = `${config.href}/${establishment.slug}`;

  const categoryLabel = establishment.category
    ? categoryLabels[establishment.category] || establishment.category
    : establishment.subtype || null;

  return (
    <Link
      href={detailUrl}
      className={`group relative block overflow-hidden rounded-2xl bg-[#1a1a2e] border border-[#2a2a36] hover:border-[#3a3a46] transition-all duration-300 ${
        size === 'large' ? 'col-span-2 row-span-2' : size === 'small' ? '' : ''
      }`}
    >
      {/* Cover Image */}
      <div className={`relative overflow-hidden ${size === 'large' ? 'h-64' : 'h-44'}`}>
        {establishment.coverImage ? (
          <Image
            src={getImageUrl(establishment.coverImage)}
            alt={establishment.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2a2a36] to-[#0a0a0f] flex items-center justify-center">
            <TypeIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e] via-transparent to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
          <TypeIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
          <span className="text-[11px] font-medium text-white">{config.label}</span>
        </div>

        {/* Featured badge */}
        {establishment.isFeatured && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-[#ff6b35] to-[#ff1493] rounded-full">
            <span className="text-[10px] font-bold text-white">TOP</span>
          </div>
        )}

        {/* Open/Close badge for restaurants */}
        {establishment.type === 'RESTAURANT' && establishment.openingHours && (
          <div className="absolute bottom-3 left-3">
            <OpenCloseBadge openingHours={establishment.openingHours} variant="badge" showNextOpen={false} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-white font-semibold text-sm leading-tight group-hover:text-[#ff6b35] transition-colors line-clamp-2">
          {establishment.name}
        </h3>

        {/* Category + City */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {categoryLabel && (
            <>
              <span style={{ color: config.color }}>{categoryLabel}</span>
              <span className="text-gray-600">|</span>
            </>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{establishment.city}{establishment.district ? `, ${establishment.district}` : ''}</span>
          </div>
        </div>

        {/* Rating + Price */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-white">{establishment.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({establishment.reviewCount})</span>
          </div>

          {establishment.priceIndicator && (
            <span className="text-xs font-medium text-green-400">
              {establishment.priceIndicator}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
