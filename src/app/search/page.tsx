'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Search, SlidersHorizontal, X, Loader2, ChevronDown } from 'lucide-react';
import { useSearchFilters } from '@/hooks/useSearchFilters';
import { SORT_OPTIONS } from '@/lib/data/search-constants';
import SearchFilters from '@/components/search/SearchFilters';
import SearchResultCard from '@/components/search/SearchResultCard';
import ActiveFilterChips from '@/components/search/ActiveFilterChips';
import SearchPagination from '@/components/search/SearchPagination';
import { useTrans } from '@/i18n';

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
  const t = useTrans('searchPage');
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

  const sortLabelMap: Record<string, string> = {
    relevance: t.sortRelevance,
    rating: t.sortRating,
    reviewCount: t.sortReviews,
    newest: t.sortRecent,
  };
  const currentSortLabel = sortLabelMap[filters.sortBy || 'relevance'] || t.sortRelevance;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Search bar header */}
      <div className="border-b border-[#E2E8F0] bg-[#0F0F14] pt-24">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="sr-only">{t.srTitle}</h1>
          <form onSubmit={handleSearchSubmit}>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  className="w-full pl-11 pr-4 py-3.5 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] placeholder-[#94A3B8] text-[14px] focus:outline-none focus:border-[#CBD5E1] transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] transition-all shrink-0 shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                <Search className="w-5 h-5 md:hidden" />
                <span className="hidden md:inline">{t.searchBtn}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="border-b border-[#E2E8F0] bg-[#0F0F14]/50">
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
            <div className="sticky top-6 bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h2 className="text-[11px] font-semibold text-[#FF6B35] uppercase tracking-[0.18em] mb-5">{t.filtersTitle}</h2>
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
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[13px] shadow-[0_8px_30px_rgba(255,107,53,0.35)] transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t.filtersBtn}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-[#FF6B35] text-[11px] font-mono font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile filters panel */}
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFiltersOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                  <h2 className="text-[16px] font-semibold text-[#0F172A]">{t.filtersTitle}</h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    <X className="w-4 h-4" />
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
              <div className="text-[#64748B] text-[13px]">
                {searched && !loading && (
                  <span>
                    <span className="text-[#0F172A] font-mono font-semibold">{totalCount}</span>{' '}
                    {totalCount !== 1 ? t.resultsSuffixPlural : t.resultsSuffixSingular}
                    {filters.q && (
                      <span> {t.resultsFor2} &quot;<span className="text-[#FF6B35]">{filters.q}</span>&quot;</span>
                    )}
                  </span>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] text-[12px] text-[#334155] hover:border-[#CBD5E1] bg-white transition-colors"
                >
                  <span className="hidden sm:inline text-[#94A3B8]">{t.sortBy}</span>
                  <span className="font-medium">{currentSortLabel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                </button>

                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E2E8F0] rounded-lg shadow-2xl z-20 overflow-hidden">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilter('sortBy', option.value === 'relevance' ? '' : option.value);
                            setSortOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[12px] transition-colors ${
                            (filters.sortBy || 'relevance') === option.value
                              ? 'bg-[#FFF7ED] text-[#FF6B35]'
                              : 'text-[#334155] hover:bg-white hover:text-[#0F172A]'
                          }`}
                        >
                          {sortLabelMap[option.value] || option.label}
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
                  <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden animate-pulse">
                    <div className="aspect-video bg-white" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-white rounded w-3/4" />
                      <div className="h-3 bg-white rounded w-1/2" />
                      <div className="h-3 bg-white rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && searched && establishments.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-14 h-14 mx-auto mb-4 text-[#CBD5E1]" />
                <p className="text-[18px] font-semibold text-[#0F172A]">{t.noResultsTitle}</p>
                <p className="text-[13px] text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
                  {t.noResultsHint}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-5 px-5 py-2.5 rounded-lg bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] text-[13px] font-medium hover:bg-[#FF6B35]/15 transition-colors"
                  >
                    {t.resetFilters}
                  </button>
                )}
              </div>
            )}

            {/* Initial state (not yet searched) */}
            {!loading && !searched && (
              <div className="text-center py-20">
                <Search className="w-14 h-14 mx-auto mb-4 text-[#CBD5E1]" />
                <p className="text-[18px] font-semibold text-[#0F172A]">{t.initialTitle}</p>
                <p className="text-[13px] text-[#64748B] mt-2">
                  {t.initialHint}
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
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
