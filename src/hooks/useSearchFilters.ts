'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface SearchFilters {
  q: string;
  type: string;
  city: string;
  region: string;
  minRating: string;
  priceRange: string;
  amenities: string;
  sortBy: string;
  page: string;
}

const FILTER_KEYS: (keyof SearchFilters)[] = [
  'q', 'type', 'city', 'region', 'minRating', 'priceRange', 'amenities', 'sortBy', 'page',
];

export function useSearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters: SearchFilters = useMemo(() => ({
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || '',
    city: searchParams.get('city') || '',
    region: searchParams.get('region') || '',
    minRating: searchParams.get('minRating') || '',
    priceRange: searchParams.get('priceRange') || '',
    amenities: searchParams.get('amenities') || '',
    sortBy: searchParams.get('sortBy') || '',
    page: searchParams.get('page') || '',
  }), [searchParams]);

  const setFilter = useCallback((key: keyof SearchFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim()) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    // Reset page when changing filters (except when changing page itself)
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`/search?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilter = useCallback((key: keyof SearchFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    // Reset page when clearing a filter
    if (key !== 'page') {
      params.delete('page');
    }
    router.push(`/search?${params.toString()}`);
  }, [searchParams, router]);

  const clearFilters = useCallback(() => {
    router.push('/search');
  }, [router]);

  const activeFilterCount = useMemo(() => {
    return FILTER_KEYS.filter((key) => {
      // Don't count page and sortBy as active filters in the badge count
      if (key === 'page' || key === 'sortBy') return false;
      return filters[key] !== '';
    }).length;
  }, [filters]);

  return { filters, setFilter, clearFilter, clearFilters, activeFilterCount };
}
