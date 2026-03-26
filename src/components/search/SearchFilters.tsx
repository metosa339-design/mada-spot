'use client';

import { Building2, UtensilsCrossed, Mountain, Users, RotateCcw, Wifi, Car, Waves, UtensilsCrossed as RestaurantIcon, Sparkles, Wind, Zap } from 'lucide-react';
import { SEARCH_TYPES, PRICE_RANGE_OPTIONS, RATING_OPTIONS, AMENITY_OPTIONS } from '@/lib/data/search-constants';
import type { SearchFilters as SearchFiltersType } from '@/hooks/useSearchFilters';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  setFilter: (key: keyof SearchFiltersType, value: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-4 h-4" />,
  UtensilsCrossed: <UtensilsCrossed className="w-4 h-4" />,
  Mountain: <Mountain className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
};

const COLOR_CLASSES: Record<string, { active: string; border: string; text: string }> = {
  purple: { active: 'bg-purple-500/20 border-purple-500 text-purple-300', border: 'border-purple-500/30', text: 'text-purple-400' },
  amber: { active: 'bg-amber-500/20 border-amber-500 text-amber-300', border: 'border-amber-500/30', text: 'text-amber-400' },
  orange: { active: 'bg-orange-500/20 border-orange-500 text-orange-300', border: 'border-orange-500/30', text: 'text-orange-400' },
  cyan: { active: 'bg-cyan-500/20 border-cyan-500 text-cyan-300', border: 'border-cyan-500/30', text: 'text-cyan-400' },
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-3.5 h-3.5" />,
  parking: <Car className="w-3.5 h-3.5" />,
  pool: <Waves className="w-3.5 h-3.5" />,
  restaurant: <RestaurantIcon className="w-3.5 h-3.5" />,
  spa: <Sparkles className="w-3.5 h-3.5" />,
  ac: <Wind className="w-3.5 h-3.5" />,
  generator: <Zap className="w-3.5 h-3.5" />,
};

export default function SearchFilters({ filters, setFilter, clearFilters, activeFilterCount }: SearchFiltersProps) {
  const currentAmenities = filters.amenities ? filters.amenities.split(',').filter(Boolean) : [];

  const toggleAmenity = (amenity: string) => {
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    setFilter('amenities', newAmenities.join(','));
  };

  return (
    <div className="space-y-6">
      {/* Type filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {SEARCH_TYPES.map((t) => {
            const isActive = filters.type === t.value;
            const colors = COLOR_CLASSES[t.color];
            return (
              <button
                key={t.value}
                onClick={() => setFilter('type', isActive ? '' : t.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? colors.active
                    : 'border-[#1e1e2e] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {TYPE_ICONS[t.icon]}
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* City filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Ville</h3>
        <input
          type="text"
          value={filters.city}
          onChange={(e) => setFilter('city', e.target.value)}
          placeholder="Ex: Antananarivo..."
          className="w-full px-3 py-2.5 rounded-lg bg-[#0c0c16] border border-[#1e1e2e] text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-colors"
        />
      </div>

      {/* Region filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Région</h3>
        <input
          type="text"
          value={filters.region}
          onChange={(e) => setFilter('region', e.target.value)}
          placeholder="Ex: Analamanga..."
          className="w-full px-3 py-2.5 rounded-lg bg-[#0c0c16] border border-[#1e1e2e] text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-colors"
        />
      </div>

      {/* Minimum rating */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Note minimum</h3>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((r) => {
            const isActive = filters.minRating === String(r.value);
            return (
              <button
                key={r.value}
                onClick={() => setFilter('minRating', isActive ? '' : String(r.value))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                    : 'border-[#1e1e2e] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                <svg className={`w-3.5 h-3.5 ${isActive ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Gamme de prix</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_RANGE_OPTIONS.map((p) => {
            const isActive = filters.priceRange === p.value;
            return (
              <button
                key={p.value}
                onClick={() => setFilter('priceRange', isActive ? '' : p.value)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'border-[#1e1e2e] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Équipements</h3>
        <div className="space-y-1.5">
          {AMENITY_OPTIONS.map((a) => {
            const isChecked = currentAmenities.includes(a.value);
            return (
              <label
                key={a.value}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isChecked ? 'bg-orange-500/10 text-orange-300' : 'text-gray-400 hover:bg-[#0c0c16] hover:text-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleAmenity(a.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isChecked ? 'bg-orange-500 border-orange-500' : 'border-gray-600'
                }`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="flex items-center gap-2 text-sm">
                  {AMENITY_ICONS[a.value]}
                  {a.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Reset button */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser ({activeFilterCount})
        </button>
      )}
    </div>
  );
}
