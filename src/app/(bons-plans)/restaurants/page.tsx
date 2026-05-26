'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, X, UtensilsCrossed, Coffee, Wine, Truck, ShoppingBag, Wifi, Menu as _MenuIcon, Image as ImageIcon, Eye, SlidersHorizontal } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';
import { getEstablishmentImage } from '@/lib/establishment-image';
import PhotoSlider from '@/components/ui/PhotoSlider';
import { MADAGASCAR_CITIES_BY_PROVINCE } from '@/lib/data/madagascar-locations';
import { useTrans } from '@/i18n';

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

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <RestaurantsPageContent />
    </Suspense>
  );
}

function RestaurantsPageContent() {
  const t = useTrans('bonsPlans');
  const categories = [
    { value: '', label: t.allCategories, icon: UtensilsCrossed },
    { value: 'GARGOTE', label: t.categoryGargote, icon: Coffee },
    { value: 'RESTAURANT', label: t.categoryRestaurant, icon: UtensilsCrossed },
    { value: 'LOUNGE', label: t.categoryLounge, icon: Wine },
    { value: 'CAFE', label: t.categoryCafe, icon: Coffee },
    { value: 'FAST_FOOD', label: t.categoryFastFood, icon: ShoppingBag },
    { value: 'STREET_FOOD', label: t.categoryStreetFood, icon: ShoppingBag },
  ];
  const priceRanges = [
    { value: '', label: t.allPrices },
    { value: 'BUDGET', label: t.priceBudget, description: t.priceBudgetDesc },
    { value: 'MODERATE', label: t.priceModerate, description: t.priceModerateDesc },
    { value: 'UPSCALE', label: t.priceUpscale, description: t.priceUpscaleDesc },
    { value: 'LUXURY', label: t.priceLuxury, description: t.priceLuxuryDesc },
  ];
  const sortOptions = [
    { value: 'rating', label: t.bestRating },
    { value: 'price', label: t.sortPriceAsc },
    { value: 'newest', label: t.sortNewest },
  ];
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
    router.replace(`/restaurants${qs ? `?${qs}` : ''}`, { scroll: false });
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
      {/* Header dark premium */}
      <section className="bg-[#0A0A0F] border-b border-[#27272A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left: Title */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-shrink-0">
              <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#FAFAFA] flex items-center gap-2.5" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}>
                <UtensilsCrossed className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF6B35] flex-shrink-0" />
                {t.restaurantsTitle}
              </h1>
              <p className="text-[#A1A1AA] text-[13px] sm:text-[14px] mt-1.5">{t.restaurantsSubtitle}</p>
            </motion.div>

            {/* Center: sliding photo */}
            <PhotoSlider
              photos={[
                { src: '/images/highlights/restaurant-plage.png', alt: 'Restaurant plage Madagascar' },
                { src: '/images/highlights/restaurant-interne.png', alt: 'Intérieur restaurant Madagascar' },
              ]}
              className="hidden lg:block w-44 h-28 rounded-xl border border-[#27272A] flex-shrink-0 overflow-hidden"
            />

            {/* Right: Search bar */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 lg:max-w-lg w-full lg:w-auto">
              <div className="flex-1 flex items-center gap-2 px-3 bg-[#111114] rounded-lg border border-[#27272A] focus-within:border-[#3F3F46] transition-colors">
                <Search className="w-4 h-4 text-[#71717A]" />
                <input type="text" placeholder={t.searchRestaurantCuisinePlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-[#FAFAFA] text-[13px] placeholder:text-[#71717A]" />
              </div>
              <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="px-3 py-2.5 bg-[#111114] rounded-lg text-[13px] text-[#FAFAFA] outline-none cursor-pointer border border-[#27272A] hover:border-[#3F3F46] transition-colors">
                <option value="">{t.allCities}</option>
                {MADAGASCAR_CITIES_BY_PROVINCE.map((p) => (
                  <optgroup key={p.province} label={p.province}>
                    {p.cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] transition-colors ${hasActiveFilters ? 'bg-[#FF6B35] text-white shadow-[0_8px_30px_rgba(255,107,53,0.25)]' : 'bg-[#111114] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46]'}`}>
                <SlidersHorizontal className="w-4 h-4" />
                {t.filters}
                {hasActiveFilters && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Filters (below hero) */}
      <section className="relative z-10 bg-[#0A0A0F] border-b border-[#27272A]">
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
                        {t.categoryLabel}
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
                        {t.priceRangeLabel}
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
                        {t.sortBy}
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
                      <span className="text-sm text-slate-400">{t.activeFilters}</span>
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
                        {t.clearAll}
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
            <span className="font-semibold text-white">{total}</span> {t.restaurantsFound}
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
            <h2 className="text-xl font-semibold text-white mb-2">{t.noRestaurantFound}</h2>
            <p className="text-slate-400 mb-6">{t.modifyCriteria}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedCategory('');
                setSelectedPriceRange('');
              }}
              className="px-6 py-3 bg-[#ff6b35] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              {t.resetFilters}
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
                  className="group bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36] hover:border-orange-500/50 transition-all flex lg:block"
                >
                  {/* Image */}
                  <div className="relative w-32 sm:w-40 lg:w-full aspect-square lg:aspect-[4/3] flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 lg:from-[#1a1a24] lg:to-[#2a2a36]">
                    <NextImage
                      src={getEstablishmentImage('RESTAURANT', restaurant.city, restaurant.name, restaurant.coverImage)}
                      alt={restaurant.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getCategoryColor(restaurant.category)}`}>
                        {getCategoryLabel(restaurant.category)}
                      </span>
                      {restaurant.isFeatured && (
                        <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-medium">
                          {t.recommended}
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
                        {t.viewMenu}
                      </button>
                    )}

                    {/* Price range */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-sm font-bold text-[#ff6b35]">
                      {getPriceRangeSymbol(restaurant.priceRange)}
                    </div>
                  </div>

                  {/* Content */}
                  <Link href={`/restaurants/${restaurant.slug}`}>
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
                            <Truck className="w-3 h-3" /> {t.delivery}
                          </span>
                        )}
                        {restaurant.hasTakeaway && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <ShoppingBag className="w-3 h-3" /> {t.takeaway}
                          </span>
                        )}
                        {restaurant.hasWifi && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Wifi className="w-3 h-3" /> {t.wifiShort}
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
                          <Star className="w-4 h-4 text-[#ff6b35] fill-[#ff6b35]" />
                          <span className="font-medium text-[#ff6b35]">{restaurant.rating?.toFixed(1)}</span>
                          <span className="text-sm text-slate-400">({restaurant.reviewCount} {t.reviewsCount})</span>
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
                  className="px-8 py-3 bg-[#ff6b35] text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? t.loading : t.loadMoreRestaurants}
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
                  <h3 className="font-bold text-white">{t.menuOf} - {menuPreview.restaurant.name}</h3>
                  <p className="text-sm text-slate-400">
                    {t.menuPhotoOf.replace('{current}', String(menuPreview.imageIndex + 1)).replace('{total}', String(menuPreview.restaurant.menuImages.length))}
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
                  {t.realPricesMenu}
                </div>
                <Link
                  href={`/restaurants/${menuPreview.restaurant.slug}`}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                >
                  {t.viewRestaurant}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
