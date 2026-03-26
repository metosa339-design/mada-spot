'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Building2, UtensilsCrossed, Mountain, Users, Crown, MapPin } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

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

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode; plural: string }> = {
  HOTEL: {
    label: 'Hôtel',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/80',
    borderColor: 'border-purple-500/30',
    icon: <Building2 className="w-3 h-3" />,
    plural: 'hotels',
  },
  RESTAURANT: {
    label: 'Restaurant',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/80',
    borderColor: 'border-amber-500/30',
    icon: <UtensilsCrossed className="w-3 h-3" />,
    plural: 'restaurants',
  },
  ATTRACTION: {
    label: 'Attraction',
    color: 'text-orange-300',
    bgColor: 'bg-orange-500/80',
    borderColor: 'border-orange-500/30',
    icon: <Mountain className="w-3 h-3" />,
    plural: 'attractions',
  },
  PROVIDER: {
    label: 'Prestataire',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-500/80',
    borderColor: 'border-cyan-500/30',
    icon: <Users className="w-3 h-3" />,
    plural: 'prestataires',
  },
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
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              {Array.from({ length: establishment.hotel.starRating }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              ))}
            </span>
          );
        }
        return null;
      case 'RESTAURANT':
        if (establishment.restaurant?.priceRange) {
          return (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {PRICE_RANGE_LABELS[establishment.restaurant.priceRange] || establishment.restaurant.priceRange}
            </span>
          );
        }
        return null;
      case 'ATTRACTION':
        if (establishment.attraction) {
          return (
            <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
              {establishment.attraction.isFree ? 'Gratuit' : establishment.attraction.attractionType}
            </span>
          );
        }
        return null;
      case 'PROVIDER':
        if (establishment.provider?.serviceType) {
          return (
            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
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
    <Link
      href={detailUrl}
      className="group block bg-[#0c0c16] border border-[#1e1e2e] rounded-xl overflow-hidden hover:scale-[1.02] hover:border-[#2e2e3e] transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative aspect-video bg-[#1a1a24]">
        {establishment.coverImage ? (
          <Image
            src={getImageUrl(establishment.coverImage)}
            alt={establishment.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            {typeConfig.icon && <div className="scale-[3] opacity-30">{typeConfig.icon}</div>}
          </div>
        )}

        {/* Type badge - top left */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${typeConfig.bgColor} backdrop-blur-sm`}>
          {typeConfig.icon}
          {typeConfig.label}
        </div>

        {/* Featured badge - top right */}
        {establishment.isFeatured && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-yellow-900 bg-gradient-to-r from-yellow-400 to-amber-400">
            <Crown className="w-3 h-3" />
            En vedette
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
          {establishment.name}
        </h3>

        {/* City and region */}
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {establishment.city}
            {establishment.region && `, ${establishment.region}`}
          </span>
        </div>

        {/* Rating + review count + type-specific info */}
        <div className="flex items-center gap-3 mt-3">
          {establishment.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-white">{establishment.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({establishment.reviewCount})</span>
            </div>
          )}
          {renderTypeSpecificInfo()}
        </div>

        {/* Short description */}
        {establishment.shortDescription && (
          <p className="mt-2.5 text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {establishment.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );
}
