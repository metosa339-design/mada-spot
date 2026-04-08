'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, X, UtensilsCrossed, Coffee, Wine, Truck, ShoppingBag, Wifi, Menu as _MenuIcon, Image as ImageIcon, Eye, SlidersHorizontal } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';
import PhotoSlider from '@/components/ui/PhotoSlider';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  district: string;
  coverImage: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  category: string;
  cuisineTypes: string[];
  priceRange: string;
  hasMenuPhotos: boolean;
  menuImages: string[];
  hasDelivery: boolean;
  hasTakeaway: boolean;
  hasWifi: boolean;
  openingHours: any;
  avgMainCourse: number;
  avgBeer: number;
}

const categories = [
  { value: '', label: 'Toutes catégories', icon: UtensilsCrossed },
  { value: 'GARGOTE', label: 'Gargote', icon: Coffee },
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'LOUNGE', label: 'Lounge & Bar', icon: Wine },
  { value: 'CAFE', label: 'Café', icon: Coffee },
  { value: 'FAST_FOOD', label: 'Fast Food', icon: ShoppingBag },
  { value: 'STREET_FOOD', label: 'Street Food', icon: ShoppingBag },
];

const priceRanges = [
  { value: '', label: 'Tous les prix' },
  { value: 'BUDGET', label: '€ Budget', description: 'Moins de 15 000 Ar' },
  { value: 'MODERATE', label: '€€ Modéré', description: '15 000 - 40 000 Ar' },
  { value: 'UPSCALE', label: '€€€ Upscale', description: '40 000 - 80 000 Ar' },
  { value: 'LUXURY', label: '€€€€ Luxe', description: 'Plus de 80 000 Ar' },
];

const sortOptions = [
  { value: 'rating', label: 'Meilleures notes' },
  { value: 'price', label: 'Prix croissant' },
  { value: 'newest', label: 'Plus récents' },
];

const cities = [
  'Antananarivo',
  'Antsirabe',
  'Fianarantsoa',
  'Toamasina',
  'Mahajanga',
  'Toliara',
  'Antsiranana',
  'Nosy Be',
  'Sainte-Marie',
  'Diego Suarez',
  'Morondava',
  'Fort-Dauphin',
  'Ambositra',
  'Sambava',
];

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <RestaurantsPageContent />
    </Suspense>
  );
}

function RestaurantsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('priceRange') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [menuPreview, setMenuPreview] = useState<{ restaurant: Restaurant; imageIndex: number } | null>(null);

  const fetchRestaurants = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;

      const params = new URLSearchParams({
        limit: '12',
        offset: currentOffset.toString(),
        sortBy,
      });

      if (searchQuery) params.append('search', searchQuery);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedPriceRange) params.append('priceRange', selectedPriceRange);

      const response = await fetch(`/api/bons-plans/restaurants?${params}`);
      const data = await response.json();

      if (reset) {
        setRestaurants(data.restaurants || []);
        setOffset(12);
      } else {
        setRestaurants((prev) => [...prev, ...(data.restaurants || [])]);
        setOffset((prev) => prev + 12);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, searchQuery, selectedCity, selectedCategory, selectedPriceRange, sortBy]);

  useEffect(() => {
    fetchRestaurants(true);
  }, [searchQuery, selectedCity, selectedCategory, selectedPriceRange, sortBy]);

  // Sync filters to URL for shareable/bookmarkable links
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedPriceRange) params.set('priceRange', selectedPriceRange);
    if (sortBy && sortBy !== 'rating') params.set('sortBy', sortBy);
    const qs = params.toString();
    router.replace(`/bons-plans/restaurants${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, selectedCity, selectedCategory, selectedPriceRange, sortBy, router]);

  const getPriceRangeSymbol = (range: string) => {
    switch (range) {
      case 'BUDGET': return '€';
      case 'MODERATE': return '€€';
      case 'UPSCALE': return '€€€';
      case 'LUXURY': return '€€€€';
      default: return '';
    }
  };

  const getCategoryLabel = (cat: string) => {
    return categories.find((c) => c.value === cat)?.label || cat;
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'GARGOTE': return 'bg-amber-500/20 text-amber-400';
      case 'RESTAURANT': return 'bg-orange-500/20 text-orange-400';
      case 'LOUNGE': return 'bg-purple-500/20 text-purple-400';
      case 'CAFE': return 'bg-blue-500/20 text-blue-400';
      case 'FAST_FOOD': return 'bg-red-500/20 text-red-400';
      case 'STREET_FOOD': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const hasActiveFilters = selectedCategory || selectedPriceRange || selectedCity;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header épuré */}
      <section className="bg-[#FDFBF7] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left: Title */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[#2D241E] flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-[#D97706] flex-shrink-0" />
                Restaurants à Madagascar
              </h1>
              <p className="text-[#8B7E6E] text-xs sm:text-sm mt-1">Découvrez les meilleurs restaurants avec photos de menus et prix réels</p>
            </motion.div>

            {/* Center: sliding photo */}
            <PhotoSlider
              photos={[
                { src: '/images/highlights/restaurant-plage.png', alt: 'Restaurant plage Madagascar' },
                { src: '/images/highlights/restaurant-interne.png', alt: 'Intérieur restaurant Madagascar' },
              ]}
              className="hidden lg:block w-44 h-28 rounded-xl shadow-md border border-gray-200 flex-shrink-0"
            />

            {/* Right: Search bar */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 lg:max-w-lg w-full lg:w-auto">
              <div className="flex-1 flex items-center gap-2 px-3 bg-white rounded-xl shadow-md border border-gray-100">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Rechercher un restaurant, cuisine..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-[#2D241E] text-sm placeholder:text-gray-400" />
              </div>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2.5 bg-white rounded-xl text-sm text-[#2D241E] outline-none cursor-pointer shadow-md border border-gray-100">
                <option value="">Toutes les villes</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${hasActiveFilters ? 'bg-[#D97706] text-white shadow-md' : 'bg-white text-[#8B7E6E] hover:text-[#D97706] shadow-md border border-gray-100'}`}>
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {hasActiveFilters && <span className="w-2 h-2 bg-white rounded-full" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters (below hero) */}
      <section className="relative z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Catégorie */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Catégorie
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedCategory === cat.value
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                                : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
                            }`}
                          >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prix */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Gamme de prix
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {priceRanges.map((range) => (
                          <button
                            key={range.value}
                            onClick={() => setSelectedPriceRange(range.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedPriceRange === range.value
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                                : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tri */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">
                        Trier par
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-2 bg-[#0d1520] border border-[#2a2a36] rounded-lg text-white appearance-none cursor-pointer outline-none"
                      >
                        {sortOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active filters */}
                  {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a36] flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-400">Filtres actifs:</span>
                      {selectedCity && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                          {selectedCity}
                          <button onClick={() => setSelectedCity('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {selectedCategory && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                          {getCategoryLabel(selectedCategory)}
                          <button onClick={() => setSelectedCategory('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {selectedPriceRange && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                          {getPriceRangeSymbol(selectedPriceRange)}
                          <button onClick={() => setSelectedPriceRange('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedCity('');
                          setSelectedCategory('');
                          setSelectedPriceRange('');
                        }}
                        className="text-sm text-orange-400 hover:underline"
                      >
                        Tout effacer
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-400">
            <span className="font-semibold text-white">{total}</span> restaurant{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </p>
        </div>

        {/* Loading */}
        {isLoading && restaurants.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36] animate-pulse">
                <div className="h-48 bg-[#2a2a36]" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-[#2a2a36] rounded w-3/4" />
                  <div className="h-4 bg-[#2a2a36] rounded w-1/2" />
                  <div className="h-4 bg-[#2a2a36] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Aucun restaurant trouvé</h2>
            <p className="text-slate-400 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedCategory('');
                setSelectedPriceRange('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36] hover:border-orange-500/50 transition-all"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-[#1a1a24] to-[#2a2a36]">
                    {restaurant.coverImage ? (
                      <NextImage
                        src={getImageUrl(restaurant.coverImage)}
                        alt={restaurant.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="w-16 h-16 text-slate-600" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getCategoryColor(restaurant.category)}`}>
                        {getCategoryLabel(restaurant.category)}
                      </span>
                      {restaurant.isFeatured && (
                        <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-medium">
                          Recommandé
                        </span>
                      )}
                    </div>

                    {/* Menu-Scope badge */}
                    {restaurant.hasMenuPhotos && restaurant.menuImages?.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuPreview({ restaurant, imageIndex: 0 });
                        }}
                        className="absolute bottom-3 right-3 flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-sm font-medium text-orange-400 hover:bg-black/80 transition-colors"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Voir le menu
                      </button>
                    )}

                    {/* Price range */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-bold text-white">
                      {getPriceRangeSymbol(restaurant.priceRange)}
                    </div>
                  </div>

                  {/* Content */}
                  <Link href={`/bons-plans/restaurants/${restaurant.slug}`}>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors mb-1">
                        {restaurant.name}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        {restaurant.district}, {restaurant.city}
                      </div>

                      {/* Cuisines */}
                      {restaurant.cuisineTypes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {restaurant.cuisineTypes.slice(0, 3).map((cuisine) => (
                            <span
                              key={cuisine}
                              className="px-2 py-0.5 bg-[#0d1520] text-slate-400 text-xs rounded"
                            >
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Services */}
                      <div className="flex items-center gap-3 mb-3">
                        {restaurant.hasDelivery && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Truck className="w-3 h-3" /> Livraison
                          </span>
                        )}
                        {restaurant.hasTakeaway && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <ShoppingBag className="w-3 h-3" /> À emporter
                          </span>
                        )}
                        {restaurant.hasWifi && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Wifi className="w-3 h-3" /> WiFi
                          </span>
                        )}
                      </div>

                      {/* Prix moyens */}
                      {(restaurant.avgMainCourse || restaurant.avgBeer) && (
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-3 p-2 bg-[#0d1520] rounded-lg">
                          {restaurant.avgMainCourse && (
                            <span className="flex items-center gap-1">
                              <UtensilsCrossed className="w-3 h-3" />
                              ~{restaurant.avgMainCourse.toLocaleString()} Ar
                            </span>
                          )}
                          {restaurant.avgBeer && (
                            <span className="flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              ~{restaurant.avgBeer.toLocaleString()} Ar
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#2a2a36]">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-white">{restaurant.rating?.toFixed(1)}</span>
                          <span className="text-sm text-slate-400">({restaurant.reviewCount} avis)</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchRestaurants(false)}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Chargement...' : 'Voir plus de restaurants'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Menu Preview Modal */}
      <AnimatePresence>
        {menuPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setMenuPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a36]">
                <div>
                  <h3 className="font-bold text-white">Menu - {menuPreview.restaurant.name}</h3>
                  <p className="text-sm text-slate-400">
                    Photo {menuPreview.imageIndex + 1} sur {menuPreview.restaurant.menuImages.length}
                  </p>
                </div>
                <button
                  onClick={() => setMenuPreview(null)}
                  className="p-2 hover:bg-[#2a2a36] rounded-lg transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image */}
              <div className="relative aspect-[3/4] max-h-[60vh] bg-[#0a0a0f]">
                <NextImage
                  src={getImageUrl(menuPreview.restaurant.menuImages[menuPreview.imageIndex])}
                  alt={`Menu page ${menuPreview.imageIndex + 1}`}
                  fill
                  sizes="80vw"
                  className="object-contain"
                />

                {/* Navigation */}
                {menuPreview.restaurant.menuImages.length > 1 && (
                  <>
                    {menuPreview.imageIndex > 0 && (
                      <button
                        onClick={() => setMenuPreview({
                          ...menuPreview,
                          imageIndex: menuPreview.imageIndex - 1
                        })}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-5 h-5 rotate-45" />
                      </button>
                    )}
                    {menuPreview.imageIndex < menuPreview.restaurant.menuImages.length - 1 && (
                      <button
                        onClick={() => setMenuPreview({
                          ...menuPreview,
                          imageIndex: menuPreview.imageIndex + 1
                        })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-5 h-5 -rotate-45" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {menuPreview.restaurant.menuImages.length > 1 && (
                <div className="flex items-center gap-2 p-4 overflow-x-auto">
                  {menuPreview.restaurant.menuImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setMenuPreview({ ...menuPreview, imageIndex: index })}
                      className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === menuPreview.imageIndex
                          ? 'border-orange-500'
                          : 'border-transparent hover:border-[#2a2a36]'
                      }`}
                    >
                      <NextImage
                        src={getImageUrl(img)}
                        alt={`Menu thumb ${index + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-[#2a2a36] flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  <Eye className="w-4 h-4 inline mr-1" />
                  Photos du menu avec prix réels
                </div>
                <Link
                  href={`/bons-plans/restaurants/${menuPreview.restaurant.slug}`}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                  Voir le restaurant
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
