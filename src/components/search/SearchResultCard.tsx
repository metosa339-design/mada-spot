'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Building2, UtensilsCrossed, Mountain, Users, Crown, MapPin } from 'lucide-react';
import { getEstablishmentImage } from '@/lib/establishment-image';

interface Establishment {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  region: string | null;
  coverImage: string | null;
  rating: number;
  reviewCount: number;
  shortDescription: string | null;
  isFeatured: boolean;
  isPremium: boolean;
  hotel?: { starRating: number | null } | null;
  restaurant?: { priceRange: string; category: string } | null;
  attraction?: { attractionType: string; isFree: boolean } | null;
  provider?: { serviceType: string } | null;
}

interface SearchResultCardProps {
  establishment: Establishment;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; plural: string }> = {
  HOTEL: { label: 'Hôtel', icon: <Building2 className="w-3 h-3" />, plural: 'hotels' },
  RESTAURANT: { label: 'Restaurant', icon: <UtensilsCrossed className="w-3 h-3" />, plural: 'restaurants' },
  ATTRACTION: { label: 'Attraction', icon: <Mountain className="w-3 h-3" />, plural: 'attractions' },
  PROVIDER: { label: 'Prestataire', icon: <Users className="w-3 h-3" />, plural: 'prestataires' },
};

const PRICE_RANGE_LABELS: Record<string, string> = {
  BUDGET: 'Budget',
  MODERATE: 'Modéré',
  UPSCALE: 'Haut de gamme',
  LUXURY: 'Luxe',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GUIDE: 'Guide',
  DRIVER: 'Chauffeur',
  TOUR_OPERATOR: 'Tour opérateur',
  CAR_RENTAL: 'Location de voiture',
  PHOTOGRAPHER: 'Photographe',
  TRANSLATOR: 'Traducteur',
  TRAVEL_AGENCY: 'Agence de voyage',
  TRANSFER: 'Transfert',
  BOAT_EXCURSION: 'Excursion bateau',
  OTHER: 'Autre',
};

export default function SearchResultCard({ establishment }: SearchResultCardProps) {
  const typeConfig = TYPE_CONFIG[establishment.type] || TYPE_CONFIG.HOTEL;
  const detailUrl = `/bons-plans/${typeConfig.plural}/${establishment.slug}`;

  const renderTypeSpecificInfo = () => {
    switch (establishment.type) {
      case 'HOTEL':
        if (establishment.hotel?.starRating) {
          return (
            <span className="flex items-center gap-0.5">
              {Array.from({ length: establishment.hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-[#FF6B35] text-[#FF6B35]" />
              ))}
            </span>
          );
        }
        return null;
      case 'RESTAURANT':
        if (establishment.restaurant?.priceRange) {
          return (
            <span className="text-[11px] text-[#D4D4D8] bg-[#1A1A1F] border border-[#27272A] px-2 py-0.5 rounded-md">
              {PRICE_RANGE_LABELS[establishment.restaurant.priceRange] || establishment.restaurant.priceRange}
            </span>
          );
        }
        return null;
      case 'ATTRACTION':
        if (establishment.attraction) {
          return (
            <span className="text-[11px] text-[#D4D4D8] bg-[#1A1A1F] border border-[#27272A] px-2 py-0.5 rounded-md">
              {establishment.attraction.isFree ? 'Gratuit' : establishment.attraction.attractionType}
            </span>
          );
        }
        return null;
      case 'PROVIDER':
        if (establishment.provider?.serviceType) {
          return (
            <span className="text-[11px] text-[#D4D4D8] bg-[#1A1A1F] border border-[#27272A] px-2 py-0.5 rounded-md">
              {SERVICE_TYPE_LABELS[establishment.provider.serviceType] || establishment.provider.serviceType}
            </span>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Link
        href={detailUrl}
        className="group block bg-[#111114] border border-[#27272A] hover:border-[#3F3F46] rounded-xl overflow-hidden transition-colors"
      >
        {/* Cover image */}
        <div className="relative aspect-video bg-[#1A1A1F]">
          <Image
            src={getEstablishmentImage(establishment.type, establishment.city, establishment.name, establishment.coverImage)}
            alt={establishment.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Type badge - top left */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] backdrop-blur-md">
            {typeConfig.icon}
            {typeConfig.label}
          </div>

          {/* Featured badge - top right */}
          {establishment.isFeatured && (
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] backdrop-blur-md">
              <Crown className="w-3 h-3" />
              Vedette
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-[15px] font-semibold text-[#FAFAFA] group-hover:text-[#FF6B35] transition-colors line-clamp-1">
            {establishment.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-1.5 text-[12px] text-[#A1A1AA]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {establishment.city}
              {establishment.region && `, ${establishment.region}`}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-3">
            {establishment.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
                <span className="text-[13px] font-mono text-[#FAFAFA]">{establishment.rating.toFixed(1)}</span>
                <span className="text-[11px] text-[#71717A]">({establishment.reviewCount})</span>
              </div>
            )}
            {renderTypeSpecificInfo()}
          </div>

          {establishment.shortDescription && (
            <p className="mt-2.5 text-[12px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
              {establishment.shortDescription}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
