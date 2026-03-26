'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import { MapPin, Hotel, Utensils, Compass, Search, X, Star, ChevronRight, Loader2, List, Map, Users } from 'lucide-react';

// Dynamic import for map (Leaflet needs client-side only)
const InteractiveMapComponent = dynamic(
  () => import('@/components/maps/InteractiveFullMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-slate-400">Chargement de la carte...</span>
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

const typeConfig = {
  HOTEL: {
    icon: Hotel,
    label: 'Hôtels',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100 text-blue-700',
    href: '/bons-plans/hotels',
  },
  RESTAURANT: {
    icon: Utensils,
    label: 'Restaurants',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100 text-orange-700',
    href: '/bons-plans/restaurants',
  },
  ATTRACTION: {
    icon: Compass,
    label: 'Attractions',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-100 text-emerald-700',
    href: '/bons-plans/attractions',
  },
  PROVIDER: {
    icon: Users,
    label: 'Prestataires',
    color: 'bg-cyan-500',
    lightColor: 'bg-cyan-100 text-cyan-700',
    href: '/bons-plans/prestataires',
  },
};

export default function CarteInteractivePage() {
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

    // Filter by types
    if (filters.types.length > 0 && filters.types.length < 3) {
      result = result.filter((m) => filters.types.includes(m.type));
    }

    // Filter by city
    if (filters.city) {
      result = result.filter(
        (m) => m.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    // Filter by search
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
        return `/bons-plans/hotels/${marker.slug}`;
      case 'RESTAURANT':
        return `/bons-plans/restaurants/${marker.slug}`;
      case 'ATTRACTION':
        return `/bons-plans/attractions/${marker.slug}`;
      default:
        return '#';
    }
  };

  // Get unique cities
  const cities = [...new Set(markers.map((m) => m.city))].sort();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Carte Interactive
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Explorez Madagascar et découvrez les meilleurs hôtels, restaurants et attractions sur notre carte interactive.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-6 mt-6"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <Hotel className="w-5 h-5" />
              <span className="font-semibold">{counts.hotels}</span>
              <span className="text-white/70">Hôtels</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <Utensils className="w-5 h-5" />
              <span className="font-semibold">{counts.restaurants}</span>
              <span className="text-white/70">Restaurants</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
              <Compass className="w-5 h-5" />
              <span className="font-semibold">{counts.attractions}</span>
              <span className="text-white/70">Attractions</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filters Bar */}
      <div className="sticky top-0 z-40 bg-[#1a1a24] border-b border-[#2a2a36] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un lieu..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 rounded-xl border-0 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white/10 transition-all"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      isActive
                        ? `${config.color} text-white shadow-lg`
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
              className="px-4 py-2.5 bg-white/5 text-white rounded-xl border-0 focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            >
              <option value="">Toutes les villes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* View Toggle */}
            <div className="flex items-center bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'map'
                    ? 'bg-white/10 shadow text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Map className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-white/10 shadow text-emerald-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-300">{filteredMarkers.length}</span> résultats
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-250px)] min-h-[500px]">
        {/* Sidebar - List View */}
        <AnimatePresence>
          {(showSidebar && viewMode === 'map') && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              className="w-80 bg-[#1a1a24] border-r border-[#2a2a36] overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-[#2a2a36] flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  Lieux ({filteredMarkers.length})
                </h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                    <p className="text-slate-400">Chargement...</p>
                  </div>
                ) : filteredMarkers.length === 0 ? (
                  <div className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Aucun résultat trouvé</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredMarkers.slice(0, 50).map((marker) => {
                      const config = typeConfig[marker.type];
                      const Icon = config.icon;

                      return (
                        <Link
                          key={marker.id}
                          href={getDetailUrl(marker)}
                          className={`block p-4 hover:bg-slate-50 transition-colors ${
                            selectedMarker?.id === marker.id ? 'bg-emerald-50' : ''
                          }`}
                          onMouseEnter={() => setSelectedMarker(marker)}
                          onMouseLeave={() => setSelectedMarker(null)}
                        >
                          <div className="flex gap-3">
                            {marker.coverImage ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={getImageUrl(marker.coverImage)}
                                  alt={marker.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`w-16 h-16 rounded-lg ${config.lightColor} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-6 h-6" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-slate-900 truncate">
                                  {marker.name}
                                </h3>
                                {marker.isFeatured && (
                                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                                    Top
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-slate-400 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {marker.city}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span className="text-sm font-medium">{marker.rating.toFixed(1)}</span>
                                </div>
                                {marker.priceIndicator && (
                                  <span className="text-sm text-emerald-600 font-medium">
                                    {marker.priceIndicator}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
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
            className="absolute left-4 top-1/2 z-30 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <List className="w-5 h-5 text-slate-600" />
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
            <div className="h-full overflow-y-auto bg-slate-50 p-6">
              <div className="max-w-4xl mx-auto">
                {isLoading ? (
                  <div className="text-center py-20">
                    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Chargement des lieux...</p>
                  </div>
                ) : filteredMarkers.length === 0 ? (
                  <div className="text-center py-20">
                    <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">
                      Aucun résultat
                    </h3>
                    <p className="text-slate-500">
                      Essayez de modifier vos filtres de recherche
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredMarkers.map((marker) => {
                      const config = typeConfig[marker.type];
                      const Icon = config.icon;

                      return (
                        <motion.div
                          key={marker.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Link
                            href={getDetailUrl(marker)}
                            className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                          >
                            {marker.coverImage ? (
                              <div className="relative w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                                <Image
                                  src={getImageUrl(marker.coverImage)}
                                  alt={marker.name}
                                  fill
                                  sizes="128px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className={`w-32 h-24 rounded-xl ${config.lightColor} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-10 h-10" />
                              </div>
                            )}

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className={`inline-block px-2 py-0.5 ${config.lightColor} text-xs font-medium rounded-full mb-1`}>
                                    {config.label}
                                  </span>
                                  <h3 className="text-lg font-semibold text-slate-900">
                                    {marker.name}
                                  </h3>
                                </div>
                                {marker.isFeatured && (
                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-lg">
                                    Recommandé
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-slate-500 mt-1">
                                <MapPin className="w-4 h-4" />
                                {marker.city}, {marker.district}
                              </div>

                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                  <span className="font-semibold">{marker.rating.toFixed(1)}</span>
                                  <span className="text-slate-400">({marker.reviewCount})</span>
                                </div>
                                {marker.priceIndicator && (
                                  <span className="font-semibold text-emerald-600">
                                    {marker.priceIndicator}
                                  </span>
                                )}
                                {marker.subtype && (
                                  <span className="text-sm text-slate-400">
                                    {marker.subtype}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="w-6 h-6 text-slate-300 self-center" />
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
