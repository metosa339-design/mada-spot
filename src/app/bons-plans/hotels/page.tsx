'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, MapPin, Star, Building2, Filter, Wifi, Car, Utensils, Waves, Zap, Snowflake, Loader2, SlidersHorizontal } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  city: string;
  district?: string;
  coverImage?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isPremium: boolean;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  hotelType?: string;
  amenities: string[];
  checkInTime?: string;
  checkOutTime?: string;
  lowestPrice?: number;
  roomCount: number;
}

const POPULAR_DESTINATIONS = [
  { label: 'Nosy Be', value: 'Nosy Be' },
  { label: 'Sainte-Marie', value: 'Sainte-Marie' },
  { label: 'Diego Suarez', value: 'Diego Suarez' },
  { label: 'Morondava', value: 'Morondava' },
  { label: 'Fort-Dauphin', value: 'Fort-Dauphin' },
];

const cities = [
  'Toutes les villes',
  'Antananarivo',
  'Antsirabe',
  'Fianarantsoa',
  'Toamasina',
  'Mahajanga',
  'Toliara',
  'Nosy Be',
  'Sainte-Marie',
  'Diego Suarez',
  'Morondava',
  'Fort-Dauphin',
  'Ambositra',
  'Sambava',
  'Mananjary',
  'Maroantsetra',
];

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  restaurant: Utensils,
  pool: Waves,
  generator: Zap,
  ac: Snowflake,
};

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi',
  parking: 'Parking',
  restaurant: 'Restaurant',
  pool: 'Piscine',
  generator: 'Groupe électrogène',
  ac: 'Climatisation',
  spa: 'Spa',
  gym: 'Gym',
  tv: 'TV',
};

export default function HotelsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <HotelsPage />
    </Suspense>
  );
}

function HotelsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCity = searchParams.get('city') || '';
  const initialSearch = searchParams.get('search') || '';

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 12;
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [showFilters, setShowFilters] = useState(false);
  const [minStars, setMinStars] = useState<string>(searchParams.get('minStars') || '');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('maxPrice') || '');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(searchParams.get('amenities')?.split(',').filter(Boolean) || []);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');

  const fetchHotels = async (reset = true) => {
    setIsLoading(true);
    try {
      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams();
      if (selectedCity && selectedCity !== 'Toutes les villes') {
        params.set('city', selectedCity);
      }
      if (searchQuery) params.set('search', searchQuery);
      if (minStars) params.set('minStars', minStars);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (selectedAmenities.length > 0) {
        params.set('amenities', selectedAmenities.join(','));
      }
      params.set('sortBy', sortBy);
      params.set('limit', LIMIT.toString());
      params.set('offset', currentOffset.toString());

      const res = await fetch(`/api/bons-plans/hotels?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setHotels(data.hotels || []);
        } else {
          setHotels((prev) => [...prev, ...(data.hotels || [])]);
        }
        setTotal(data.total || 0);
        setHasMore(data.hasMore ?? false);
        setOffset(currentOffset + (data.hotels?.length || 0));
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchHotels(true), searchQuery ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [selectedCity, searchQuery, minStars, minPrice, maxPrice, selectedAmenities, sortBy]);

  // Sync filters to URL for shareable/bookmarkable links
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity && selectedCity !== 'Toutes les villes') params.set('city', selectedCity);
    if (minStars) params.set('minStars', minStars);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (selectedAmenities.length > 0) params.set('amenities', selectedAmenities.join(','));
    if (sortBy && sortBy !== 'rating') params.set('sortBy', sortBy);
    const qs = params.toString();
    router.replace(`/bons-plans/hotels${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, selectedCity, minStars, minPrice, maxPrice, selectedAmenities, sortBy, router]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setMinStars('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedAmenities([]);
    setSortBy('rating');
  };

  const hasActiveFilters = minStars || minPrice || maxPrice || selectedAmenities.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0f]">

      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#D97706] to-[#B45309] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 py-10 sm:py-14">
            <h1 className="text-2xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-7 h-7 sm:w-9 sm:h-9 text-white flex-shrink-0" />
              Hôtels à Madagascar
            </h1>
            <p className="text-white/85 text-sm sm:text-base mt-2 max-w-xl">
              Trouvez l&apos;hébergement parfait parmi notre sélection avec les vrais prix en Ariary
            </p>
          </motion.div>
          <div className="hidden md:flex gap-3 w-1/3 flex-shrink-0">
            <div className="relative w-1/2 h-40 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/images/highlights/restaurant-plage.png" alt="Restaurant hôtelier en bord de plage à Madagascar" fill className="object-cover" sizes="15vw" />
            </div>
            <div className="relative w-1/2 h-40 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/images/highlights/restaurant-interne.png" alt="Intérieur chaleureux d'un hôtel à Madagascar" fill className="object-cover" sizes="15vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="relative z-10 bg-[#0a0a0f]/95 border-b border-[#2a2a36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex items-center gap-3 px-4 bg-[#0d1520] border border-[#2a2a36] rounded-xl">
              <Search className="w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher un hôtel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 py-3 bg-transparent outline-none text-white placeholder:text-slate-500"
              />
            </div>

            {/* City */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 bg-[#0d1520] border border-[#2a2a36] rounded-xl outline-none text-white cursor-pointer"
            >
              {cities.map((city) => (
                <option key={city} value={city === 'Toutes les villes' ? '' : city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors ${
                hasActiveFilters
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filtres
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-white rounded-full" />
              )}
            </button>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-[#2a2a36]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">Filtres avancés</h2>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} className="text-sm text-orange-400 hover:underline">
                        Réinitialiser
                      </button>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stars */}
                    <div>
                      <label className="text-sm font-medium text-slate-400 mb-2 block">
                        Étoiles minimum
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setMinStars(minStars === star.toString() ? '' : star.toString())}
                            className={`p-2 rounded-lg transition-colors ${
                              parseInt(minStars) >= star ? 'bg-amber-500/20' : 'bg-[#1a1a24] hover:bg-[#2a2a36]'
                            }`}
                          >
                            <Star
                              className={`w-5 h-5 ${
                                parseInt(minStars) >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-500'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-slate-400 mb-2 block">
                        Prix par nuit (Ar)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0d1520] border border-[#2a2a36] rounded-lg text-sm text-white outline-none placeholder:text-slate-500"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-[#0d1520] border border-[#2a2a36] rounded-lg text-sm text-white outline-none placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="text-sm font-medium text-slate-400 mb-2 block">
                        Trier par
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0d1520] border border-[#2a2a36] rounded-lg text-sm text-white outline-none cursor-pointer"
                      >
                        <option value="rating">Meilleure note</option>
                        <option value="price">Prix croissant</option>
                        <option value="stars">Étoiles</option>
                      </select>
                    </div>

                    {/* Amenities */}
                    <div>
                      <label className="text-sm font-medium text-slate-400 mb-2 block">
                        Équipements
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(amenityLabels).slice(0, 6).map(([key, label]) => {
                          const Icon = amenityIcons[key] || Filter;
                          return (
                            <button
                              key={key}
                              onClick={() => toggleAmenity(key)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                                selectedAmenities.includes(key)
                                  ? 'bg-orange-500/20 text-orange-400'
                                  : 'bg-[#1a1a24] text-slate-400 hover:bg-[#2a2a36]'
                              }`}
                            >
                              <Icon className="w-3 h-3" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-4 border-b border-[#2a2a36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-slate-500 shrink-0">Destinations :</span>
            {POPULAR_DESTINATIONS.map((dest) => (
              <button
                key={dest.value}
                onClick={() => setSelectedCity(selectedCity === dest.value ? '' : dest.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCity === dest.value
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                    : 'bg-[#1a1a24] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50 hover:text-white'
                }`}
              >
                <MapPin className="w-3 h-3 inline mr-1" />
                {dest.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400">
              <span className="font-semibold text-white">{isLoading ? '...' : total}</span> hôtels trouvés
              {selectedCity && selectedCity !== 'Toutes les villes' && (
                <span className="text-slate-500"> à {selectedCity}</span>
              )}
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36] animate-pulse">
                  <div className="aspect-[4/3] bg-[#2a2a36]" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-[#2a2a36] rounded w-3/4" />
                    <div className="h-4 bg-[#2a2a36] rounded w-1/2" />
                    <div className="h-4 bg-[#2a2a36] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hotels grid */}
          {!isLoading && hotels.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map((hotel, index) => (
                <motion.div
                  key={hotel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/bons-plans/hotels/${hotel.slug}`}
                    className="block bg-[#1a1a24] rounded-2xl border border-[#2a2a36] overflow-hidden hover:border-orange-500/50 transition-all group"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-[#1a1a24] to-[#2a2a36]">
                      {hotel.coverImage ? (
                        <Image
                          src={getImageUrl(hotel.coverImage)}
                          alt={hotel.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-slate-600" />
                        </div>
                      )}
                      {/* Star rating */}
                      {hotel.starRating && (
                        <div className="absolute top-3 left-3 flex items-center gap-0.5 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                          {[...Array(hotel.starRating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      )}
                      {/* Featured badge */}
                      {hotel.isFeatured && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-medium">
                          Recommandé
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-white text-lg group-hover:text-orange-400 transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                        {hotel.city}
                        {hotel.district && `, ${hotel.district}`}
                      </div>

                      {/* Amenities preview */}
                      {hotel.amenities.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {hotel.amenities.slice(0, 4).map((amenity) => {
                            const Icon = amenityIcons[amenity];
                            return Icon ? (
                              <div
                                key={amenity}
                                className="w-8 h-8 bg-[#0d1520] rounded-lg flex items-center justify-center"
                                title={amenityLabels[amenity]}
                              >
                                <Icon className="w-4 h-4 text-slate-400" />
                              </div>
                            ) : null;
                          })}
                          {hotel.amenities.length > 4 && (
                            <span className="text-xs text-slate-400">
                              +{hotel.amenities.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rating & Price */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2a36]">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-white">{hotel.rating.toFixed(1)}</span>
                          <span className="text-sm text-slate-400">({hotel.reviewCount})</span>
                        </div>
                        {hotel.lowestPrice && (
                          <div className="text-right">
                            <span className="text-xs text-slate-400">À partir de</span>
                            <p className="font-bold text-orange-400">
                              {hotel.lowestPrice.toLocaleString()} Ar
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchHotels(false)}
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
              >
                {isLoading ? 'Chargement...' : 'Voir plus d\'hôtels'}
              </button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && hotels.length === 0 && (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Aucun hôtel trouvé</h2>
              <p className="text-slate-400 mb-6">Essayez de modifier vos critères de recherche</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCity('');
                  clearFilters();
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
