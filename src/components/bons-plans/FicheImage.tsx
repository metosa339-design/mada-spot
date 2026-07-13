'use client';

import NextImage from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import { UtensilsCrossed, BedDouble, Mountain, Briefcase, MapPin } from 'lucide-react';

/**
 * Image d'une fiche pour les cartes/listings.
 * - Si la fiche a une VRAIE photo (upload /uploads/ ou Cloudinary) -> on l'affiche.
 * - Sinon -> placeholder de marque « Photo à venir » (jamais d'image IA/générique
 *   trompeuse, et ça incite le prestataire à uploader une vraie photo).
 */

const ICONS: Record<string, typeof MapPin> = {
  HOTEL: BedDouble,
  RESTAURANT: UtensilsCrossed,
  ATTRACTION: Mountain,
  PROVIDER: Briefcase,
};

function isRealPhotoUrl(u?: string | null): boolean {
  if (!u) return false;
  const s = ('' + u).trim();
  if (!s) return false;
  if (s.startsWith('/uploads/')) return true;
  if (s.includes('res.cloudinary.com')) return true;
  if (s.startsWith('/images/')) return false; // packs génériques / IA bundlés
  if (s.includes('unsplash')) return false;
  if (/^https?:\/\//.test(s)) return true;
  return false;
}

function firstRealPhoto(coverImage?: string | null, images?: unknown): string | null {
  if (isRealPhotoUrl(coverImage)) return coverImage as string;
  let arr: unknown[] = [];
  if (Array.isArray(images)) arr = images;
  else if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images || '[]');
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      /* ignore */
    }
  }
  for (const it of arr) {
    const url = it && typeof it === 'object' ? (it as { url?: string }).url : (it as string);
    if (typeof url === 'string' && isRealPhotoUrl(url)) return url;
  }
  return null;
}

interface FicheImageProps {
  type: string;
  name: string;
  coverImage?: string | null;
  images?: unknown;
  sizes?: string;
  className?: string;
}

export default function FicheImage({ type, name, coverImage, images, sizes, className = 'object-cover' }: FicheImageProps) {
  const real = firstRealPhoto(coverImage, images);

  if (real) {
    return (
      <NextImage
        src={getImageUrl(real)}
        alt={name}
        fill
        sizes={sizes}
        className={className}
      />
    );
  }

  const Icon = ICONS[(type || '').toUpperCase()] || MapPin;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#ff6b35] via-orange-400 to-amber-500 text-white select-none px-3">
      <Icon className="w-9 h-9 opacity-95" strokeWidth={1.5} />
      <span className="font-semibold text-sm text-center leading-tight line-clamp-2">{name}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] bg-white/20 rounded-full px-2.5 py-0.5">
        Photo à venir
      </span>
      <span className="absolute bottom-2 right-3 text-[10px] font-bold tracking-tight opacity-80">
        Mada<span className="text-white">Spot</span>
      </span>
    </div>
  );
}
