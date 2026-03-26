'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Search, SlidersHorizontal, X, Loader2, ChevronDown } from 'lucide-react';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { SORT_OPTIONS } from '@/lib/data/search-constants';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResultCard from '@/components/search/SearchResultCard';
import ActiveFilterChips from '@/components/search/ActiveFilterChips';
import SearchPagination from '@/components/search/SearchPagination';

const ITEMS_PER_PAGE = 12;

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

function SearchPageContent() {
  const { filters, setFilter, clearFilter, clearFilters, activeFilterCount } = useSearchFilters();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Local state for search input (controlled)
  const [searchInput, setSearchInput] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentPage = parseInt(filters.page) || 1;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Fetch search results
  const fetchResults = useCallback(async () => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.type) params.set('type', filters.type);
      if (filters.city) params.set('city', filters.city);
      if (filters.region) params.set('region', filters.region);
      if (filters.minRating) params.set('minRating', filters.minRating);
      if (filters.priceRange) params.set('priceRange', filters.priceRange);
      if (filters.amenities) params.set('amenities', filters.amenities);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      params.set('limit', String(ITEMS_PER_PAGE));
      params.set('offset', String((currentPage - 1) * ITEMS_PER_PAGE));

      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = await res.json();

      if (data.success) {
        setEstablishments(data.establishments || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      // ignore other errors
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  // Debounced fetch on filter changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchResults]);

  // Sync searchInput with URL filter q
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('q', searchInput);
  };

  const handlePageChange = (page: number) => {
    setFilter('page', String(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentSortLabel = SORT_OPTIONS.find((s) => s.value === (filters.sortBy || 'relevance'))?.label || 'Pertinence';

  return (
    <div className="min-h-screen bg-[#070710]">
      {/* Search bar header */}
      <div className="border-b border-[#1e1e2e] bg-[#0c0c16]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Rechercher un hôtel, restaurant, attraction, ville..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#1a1a24] border border-[#1e1e2e] text-white placeholder-gray-500 text-base focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shrink-0"
              >
                <Search className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">Rechercher</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="border-b border-[#1e1e2e] bg-[#0c0c16]/50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <ActiveFilterChips filters={filters} clearFilter={clearFilter} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters - desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-6 bg-[#1a1a24] rounded-xl border border-[#1e1e2e] p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Filtres</h2>
              <SearchFilters
                filters={filters}
                setFilter={setFilter}
                clearFilters={clearFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>
          </aside>

          {/* Mobile filter toggle button */}
          <div className="lg:hidden fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-orange-600 text-xs font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filters panel */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-[#1a1a24] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
                  <h2 className="text-lg font-bold text-white">Filtres</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#1e1e2e] text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">
                  <SearchFilters
                    filters={filters}
                    setFilter={setFilter}
                    clearFilters={clearFilters}
                    activeFilterCount={activeFilterCount}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results area */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <div className="text-gray-400 text-sm">
                {searched && !loading && (
                  <span>
                    <span className="text-white font-semibold">{totalCount}</span>{' '}
                    résultat{totalCount !== 1 ? 's' : ''}
                    {filters.q && (
                      <span> pour &quot;<span className="text-orange-400">{filters.q}</span>&quot;</span>
                    )}
                  </span>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1e1e2e] text-sm text-gray-300 hover:border-gray-600 transition-colors"
                >
                  <span className="hidden sm:inline text-gray-500">Trier par:</span>
                  <span className="font-medium">{currentSortLabel}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>

                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a24] border border-[#1e1e2e] rounded-lg shadow-xl z-20 overflow-hidden">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilter('sortBy', option.value === 'relevance' ? '' : option.value);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            (filters.sortBy || 'relevance') === option.value
                              ? 'bg-orange-500/10 text-orange-400'
                              : 'text-gray-300 hover:bg-[#0c0c16] hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-[#1a1a24]" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-[#1a1a24] rounded w-3/4" />
                      <div className="h-4 bg-[#1a1a24] rounded w-1/2" />
                      <div className="h-4 bg-[#1a1a24] rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && searched && establishments.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <p className="text-lg font-semibold text-gray-300">Aucun résultat trouvé</p>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  Essayez de modifier vos filtres ou d&apos;utiliser d&apos;autres mots-clés pour votre recherche.
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-5 px-5 py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium hover:bg-orange-500/20 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* Initial state (not yet searched) */}
            {!loading && !searched && (
              <div className="text-center py-20">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                <p className="text-lg font-semibold text-gray-300">Recherchez sur Mada Spot</p>
                <p className="text-sm text-gray-500 mt-2">
                  Tapez votre recherche ou utilisez les filtres pour explorer
                </p>
              </div>
            )}

            {/* Results grid */}
            {!loading && establishments.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {establishments.map((establishment) => (
                    <SearchResultCard key={establishment.id} establishment={establishment} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <SearchPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070710] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
