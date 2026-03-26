'use client';

import { X } from 'lucide-react';
import { EVENT_CATEGORIES } from '@/lib/data/event-categories';

interface EventFiltersState {
  category: string;
  city: string;
}

interface EventFiltersProps {
  filters: EventFiltersState;
  setFilter: (key: keyof EventFiltersState, value: string) => void;
}

const BUTTON_COLORS: Record<string, { active: string; inactive: string }> = {
  pink: {
    active: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    inactive: 'text-gray-400 border-[#1e1e2e] hover:border-pink-500/30 hover:text-pink-400',
  },
  purple: {
    active: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    inactive: 'text-gray-400 border-[#1e1e2e] hover:border-purple-500/30 hover:text-purple-400',
  },
  green: {
    active: 'bg-green-500/20 text-green-400 border-green-500/50',
    inactive: 'text-gray-400 border-[#1e1e2e] hover:border-green-500/30 hover:text-green-400',
  },
  emerald: {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    inactive: 'text-gray-400 border-[#1e1e2e] hover:border-emerald-500/30 hover:text-emerald-400',
  },
  amber: {
    active: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    inactive: 'text-gray-400 border-[#1e1e2e] hover:border-amber-500/30 hover:text-amber-400',
  },
  gray: {
    active: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    inactive: 'text-gray-400 border-[#1e1e2e] hover:border-gray-500/30 hover:text-gray-300',
  },
};

export default function EventFilters({ filters, setFilter }: EventFiltersProps) {
  const hasActiveFilters = filters.category !== '' || filters.city !== '';

  const clearAll = () => {
    setFilter('category', '');
    setFilter('city', '');
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Category buttons */}
      {EVENT_CATEGORIES.map((cat) => {
        const isActive = filters.category === cat.value;
        const colors = BUTTON_COLORS[cat.color] || BUTTON_COLORS.gray;

        return (
          <button
            key={cat.value}
            onClick={() => setFilter('category', isActive ? '' : cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              isActive ? colors.active : colors.inactive
            }`}
          >
            {cat.label}
          </button>
        );
      })}

      {/* City filter */}
      <input
        type="text"
        placeholder="Ville..."
        value={filters.city}
        onChange={(e) => setFilter('city', e.target.value)}
        className="px-3 py-1.5 rounded-full text-sm bg-transparent border border-[#1e1e2e] text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors w-36"
      />

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-300 border border-transparent hover:border-[#1e1e2e] transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Effacer
        </button>
      )}
    </div>
  );
}
