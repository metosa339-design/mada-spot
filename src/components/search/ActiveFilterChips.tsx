'use client';

import { X } from 'lucide-react';
import { SEARCH_TYPES, PRICE_RANGE_OPTIONS, RATING_OPTIONS, AMENITY_OPTIONS } from '@/lib/data/search-constants';
import type { SearchFilters } from '@/hooks/useSearchFilters';

interface ActiveFilterChipsProps {
  filters: SearchFilters;
  clearFilter: (key: keyof SearchFilters) => void;
}

interface Chip {
  key: keyof SearchFilters;
  label: string;
  color: string;
}

const TYPE_COLORS: Record<string, string> = {
  HOTEL: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  RESTAURANT: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  ATTRACTION: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  PROVIDER: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

export default function ActiveFilterChips({ filters, clearFilter }: ActiveFilterChipsProps) {
  const chips: Chip[] = [];

  // Type chip
  if (filters.type) {
    const typeObj = SEARCH_TYPES.find((t) => t.value === filters.type);
    chips.push({
      key: 'type',
      label: typeObj?.label || filters.type,
      color: TYPE_COLORS[filters.type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    });
  }

  // City chip
  if (filters.city) {
    chips.push({
      key: 'city',
      label: `Ville: ${filters.city}`,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    });
  }

  // Region chip
  if (filters.region) {
    chips.push({
      key: 'region',
      label: `Région: ${filters.region}`,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    });
  }

  // Min rating chip
  if (filters.minRating) {
    const ratingObj = RATING_OPTIONS.find((r) => String(r.value) === filters.minRating);
    chips.push({
      key: 'minRating',
      label: ratingObj?.label || `${filters.minRating}+ étoiles`,
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    });
  }

  // Price range chip
  if (filters.priceRange) {
    const priceObj = PRICE_RANGE_OPTIONS.find((p) => p.value === filters.priceRange);
    chips.push({
      key: 'priceRange',
      label: priceObj?.label || filters.priceRange,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    });
  }

  // Amenities chip(s)
  if (filters.amenities) {
    const amenityValues = filters.amenities.split(',').filter(Boolean);
    if (amenityValues.length > 0) {
      const amenityLabels = amenityValues.map((v) => {
        const amenityObj = AMENITY_OPTIONS.find((a) => a.value === v);
        return amenityObj?.label || v;
      });
      chips.push({
        key: 'amenities',
        label: `Équipements: ${amenityLabels.join(', ')}`,
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${chip.color}`}
        >
          {chip.label}
          <button
            onClick={() => clearFilter(chip.key)}
            className="hover:opacity-70 transition-opacity"
            aria-label={`Supprimer le filtre ${chip.label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}
