'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getEstablishmentImage } from '@/lib/establishment-image';
import { MapPin, Hotel, Utensils, Compass, Search, X, Star, ChevronRight, Loader2, List, Map, Users } from 'lucide-react';
import { useTrans } from '@/i18n';

// Dynamic import for map (Leaflet needs client-side only)
const InteractiveMapComponent = dynamic(
  () => import('@/components/maps/InteractiveFullMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
          <span className="text-[#64748B] text-[13px]">Chargement de la carte...</span>
        </div>
      </div>
    )
  }
);

type MarkerType = 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER';

interface Marker {
  id: string;
  type: MarkerType;
  name: string;
  slug?: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  coverImage?: string | null;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  priceIndicator?: string | null;
  subtype?: string | null;
}

interface FilterState {
  types: MarkerType[];
  city: string;
  search: string;
}

const typeConfigBase = {
  HOTEL: {
    icon: Hotel,
    activeBg: 'bg-[#FF6B35] border-[#FF6B35] text-white',
    pillBg: 'bg-[#FFF7ED] border-[#FF6B35]/30 text-[#FF6B35]',
    href: '/hotels',
  },
  RESTAURANT: {
    icon: Utensils,
    activeBg: 'bg-[#FF6B35] border-[#FF6B35] text-white',
    pillBg: 'bg-[#FFF7ED] border-[#FF6B35]/30 text-[#FF6B35]',
    href: '/restaurants',
  },
  ATTRACTION: {
    icon: Compass,
    activeBg: 'bg-[#FF6B35] border-[#FF6B35] text-white',
    pillBg: 'bg-[#FFF7ED] border-[#FF6B35]/30 text-[#FF6B35]',
    href: '/attractions',
  },
  PROVIDER: {
    icon: Users,
    activeBg: 'bg-[#FF6B35] border-[#FF6B35] text-white',
    pillBg: 'bg-[#FFF7ED] border-[#FF6B35]/30 text-[#FF6B35]',
    href: '/prestataires',
  },
};

export default function CarteInteractivePage() {
  const t = useTrans('bonsPlans');
  const typeConfig = {
    HOTEL: { ...typeConfigBase.HOTEL, label: t.typeHotels },
    RESTAURANT: { ...typeConfigBase.RESTAURANT, label: t.typeRestaurants },
    ATTRACTION: { ...typeConfigBase.ATTRACTION, label: t.typeAttractions },
    PROVIDER: { ...typeConfigBase.PROVIDER, label: t.typeProviders },
  };
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [_showFilters, _setShowFilters] = useState(false);
  const [counts, setCounts] = useState({ hotels: 0, restaurants: 0, attractions: 0 });

  const [filters, setFilters] = useState<FilterState>({
    types: ['HOTEL', 'RESTAURANT', 'ATTRACTION'],
    city: '',
    search: '',
  });

  // Fetch markers
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const res = await fetch('/api/bons-plans/map');
        if (res.ok) {
          const data = await res.json();
          setMarkers(data.markers || []);
          setFilteredMarkers(data.markers || []);
          setCounts(data.counts || { hotels: 0, restaurants: 0, attractions: 0 });
        }
      } catch (error) {
        console.error('Error fetching markers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkers();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = markers;

    if (filters.types.length > 0 && filters.types.length < 3) {
      result = result.filter((m) => filters.types.includes(m.type));
    }

    if (filters.city) {
      result = result.filter(
        (m) => m.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.city.toLowerCase().includes(search) ||
          m.district?.toLowerCase().includes(search)
      );
    }

    setFilteredMarkers(result);
  }, [filters, markers]);

  const toggleType = (type: MarkerType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const getDetailUrl = (marker: Marker) => {
    switch (marker.type) {
      case 'HOTEL':
        return `/hotels/${marker.slug}`;
      case 'RESTAURANT':
        return `/restaurants/${marker.slug}`;
      case 'ATTRACTION':
        return `/attractions/${marker.slug}`;
      default:
        return '#';
    }
  };

  const cities = [...new Set(markers.map((m) => m.city))].sort();

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero Section */}
      <section className="relative pt-24 pb-10 overflow-hidden bg-[#F8FAFC]">

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Exploration</p>
            <h1
              className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {t.interactiveMapTitle}
            </h1>
            <p className="text-[15px] text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              {t.interactiveMapSubtitle}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-lg">
              <Hotel className="w-4 h-4 text-[#FF6B35]" />
              <span className="font-mono font-semibold text-[#0F172A] text-[14px]">{counts.hotels}</span>
              <span className="text-[#64748B] text-[13px]">{t.statHotels}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-lg">
              <Utensils className="w-4 h-4 text-[#FF6B35]" />
              <span className="font-mono font-semibold text-[#0F172A] text-[14px]">{counts.restaurants}</span>
              <span className="text-[#64748B] text-[13px]">{t.statRestaurants}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-lg">
              <Compass className="w-4 h-4 text-[#FF6B35]" />
              <span className="font-mono font-semibold text-[#0F172A] text-[14px]">{counts.attractions}</span>
              <span className="text-[#64748B] text-[13px]">{t.statAttractions}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="sticky top-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                placeholder={t.searchPlace}
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#94A3B8] text-[13px] focus:outline-none focus:border-[#CBD5E1] transition-colors"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white rounded-md"
                >
                  <X className="w-3.5 h-3.5 text-[#64748B]" />
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map((type) => {
                const config = typeConfig[type];
                const Icon = config.icon;
                const isActive = filters.types.includes(type);

                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border font-medium text-[12px] transition-colors ${
                      isActive
                        ? config.activeBg
                        : 'bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>

            {/* City Filter */}
            <select
              value={filters.city}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, city: e.target.value }))
              }
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#0F172A] rounded-lg focus:outline-none focus:border-[#CBD5E1] text-[12px] font-medium"
            >
              <option value="">{t.allCities}</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-lg p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-[#FF6B35]'
                    : 'text-[#94A3B8] hover:text-[#64748B]'
                }`}
              >
                <Map className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-[#FF6B35]'
                    : 'text-[#94A3B8] hover:text-[#64748B]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Results Count */}
            <div className="text-[12px] text-[#94A3B8]">
              <span className="font-mono font-semibold text-[#0F172A]">{filteredMarkers.length}</span> {t.resultsLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-260px)] min-h-[500px]">
        {/* Sidebar - List View */}
        <AnimatePresence>
          {(showSidebar && viewMode === 'map') && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              className="w-80 bg-white border-r border-[#E2E8F0] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="font-semibold text-[#0F172A] text-[14px]">
                  {t.placesLabel} <span className="text-[#94A3B8] font-mono">({filteredMarkers.length})</span>
                </h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1.5 hover:bg-white rounded-md"
                >
                  <X className="w-4 h-4 text-[#64748B]" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-7 h-7 text-[#FF6B35] animate-spin mx-auto mb-3" />
                    <p className="text-[#64748B] text-[13px]">{t.loadingShort}</p>
                  </div>
                ) : filteredMarkers.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
                    <p className="text-[#64748B] text-[13px]">{t.noResultFound}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E2E8F0]">
                    {filteredMarkers.slice(0, 50).map((marker) => {
                      return (
                        <Link
                          key={marker.id}
                          href={getDetailUrl(marker)}
                          className={`block p-3 hover:bg-white transition-colors ${
                            selectedMarker?.id === marker.id ? 'bg-white' : ''
                          }`}
                          onMouseEnter={() => setSelectedMarker(marker)}
                          onMouseLeave={() => setSelectedMarker(null)}
                        >
                          <div className="flex gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-[#E2E8F0]">
                              <Image
                                src={getEstablishmentImage(marker.type, marker.city, marker.name, marker.coverImage)}
                                alt={marker.name}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-[#0F172A] text-[13px] truncate">
                                  {marker.name}
                                </h3>
                                {marker.isFeatured && (
                                  <span className="px-1.5 py-0.5 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] text-[10px] font-semibold uppercase tracking-[0.1em] rounded">
                                    {t.topBadge}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[12px] text-[#64748B] mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {marker.city}
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                {marker.reviewCount > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
                                    <span className="text-[12px] font-mono text-[#0F172A]">{marker.rating?.toFixed(1)}</span>
                                  </div>
                                ) : (
                                  <span className="text-[12px] text-[#94A3B8]">Nouveau</span>
                                )}
                                {marker.priceIndicator && (
                                  <span className="text-[12px] font-mono text-[#FF6B35]">
                                    {marker.priceIndicator}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#CBD5E1] flex-shrink-0 self-center" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Toggle Sidebar Button */}
        {!showSidebar && viewMode === 'map' && (
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={() => setShowSidebar(true)}
            className="absolute left-4 top-1/2 z-30 p-3 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg transition-colors"
          >
            <List className="w-4 h-4 text-[#0F172A]" />
          </motion.button>
        )}

        {/* Map or List View */}
        <div className="flex-1 relative">
          {viewMode === 'map' ? (
            <InteractiveMapComponent
              markers={filteredMarkers}
              selectedMarker={selectedMarker}
              onMarkerClick={setSelectedMarker}
            />
          ) : (
            <div className="h-full overflow-y-auto bg-[#F8FAFC] p-6">
              <div className="max-w-4xl mx-auto">
                {isLoading ? (
                  <div className="text-center py-20">
                    <Loader2 className="w-9 h-9 text-[#FF6B35] animate-spin mx-auto mb-4" />
                    <p className="text-[#64748B] text-[13px]">{t.loadingPlaces}</p>
                  </div>
                ) : filteredMarkers.length === 0 ? (
                  <div className="text-center py-20">
                    <MapPin className="w-16 h-16 text-[#CBD5E1] mx-auto mb-4" />
                    <h3 className="text-[20px] font-semibold text-[#0F172A] mb-2">
                      {t.noResult}
                    </h3>
                    <p className="text-[#64748B] text-[13px]">
                      {t.modifyFilters}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredMarkers.map((marker) => {
                      const config = typeConfig[marker.type];

                      return (
                        <motion.div
                          key={marker.id}
                          whileHover={{ y: -2 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Link
                            href={getDetailUrl(marker)}
                            className="flex gap-4 p-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl transition-colors"
                          >
                            <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-[#E2E8F0]">
                              <Image
                                src={getEstablishmentImage(marker.type, marker.city, marker.name, marker.coverImage)}
                                alt={marker.name}
                                fill
                                sizes="128px"
                                className="object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className={`inline-block px-2 py-0.5 ${config.pillBg} border text-[10px] font-semibold uppercase tracking-[0.1em] rounded mb-1.5`}>
                                    {config.label}
                                  </span>
                                  <h3 className="text-[16px] font-semibold text-[#0F172A]">
                                    {marker.name}
                                  </h3>
                                </div>
                                {marker.isFeatured && (
                                  <span className="px-2 py-1 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] text-[10px] font-semibold uppercase tracking-[0.1em] rounded-md">
                                    {t.recommended}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-[#64748B] text-[13px] mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {marker.city}, {marker.district}
                              </div>

                              <div className="flex items-center gap-4 mt-2.5">
                                {marker.reviewCount > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                                    <span className="font-mono text-[#0F172A] text-[13px]">{marker.rating?.toFixed(1)}</span>
                                    <span className="text-[#94A3B8] text-[12px]">({marker.reviewCount})</span>
                                  </div>
                                ) : (
                                  <span className="text-[#94A3B8] text-[12px]">Nouveau</span>
                                )}
                                {marker.priceIndicator && (
                                  <span className="font-mono font-semibold text-[#FF6B35] text-[13px]">
                                    {marker.priceIndicator}
                                  </span>
                                )}
                                {marker.subtype && (
                                  <span className="text-[12px] text-[#94A3B8]">
                                    {marker.subtype}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-[#CBD5E1] self-center" />
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
