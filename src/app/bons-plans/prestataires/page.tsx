'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, X, Users, ChevronDown, SlidersHorizontal, Car, Camera, Globe, Map as MapIcon, Compass, Briefcase, Ship, ArrowRight, Plus } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface Provider {
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
  serviceType: string;
  languages: string[];
  experience: string;
  priceRange: string;
  priceFrom: number;
  priceTo: number;
  priceUnit: string;
  isAvailable: boolean;
  operatingZone: string[];
  vehicleType: string;
  vehicleCapacity: number;
}

const serviceTypes = [
  { value: '', label: 'Tous les types', icon: Users },
  { value: 'GUIDE', label: 'Guide touristique', icon: Compass },
  { value: 'DRIVER', label: 'Chauffeur', icon: Car },
  { value: 'TOUR_OPERATOR', label: 'Tour opérateur', icon: MapIcon },
  { value: 'CAR_RENTAL', label: 'Location de voiture', icon: Car },
  { value: 'PHOTOGRAPHER', label: 'Photographe', icon: Camera },
  { value: 'TRANSLATOR', label: 'Traducteur', icon: Globe },
  { value: 'TRAVEL_AGENCY', label: 'Agence de voyage', icon: Briefcase },
  { value: 'TRANSFER', label: 'Transfert', icon: Car },
  { value: 'BOAT_EXCURSION', label: 'Excursion bateau', icon: Ship },
  { value: 'OTHER', label: 'Autre', icon: Users },
];

const priceRanges = [
  { value: '', label: 'Tous les prix' },
  { value: 'BUDGET', label: '€ Budget' },
  { value: 'MODERATE', label: '€€ Modéré' },
  { value: 'UPSCALE', label: '€€€ Premium' },
  { value: 'LUXURY', label: '€€€€ Luxe' },
];

const sortOptions = [
  { value: 'rating', label: 'Meilleures notes' },
  { value: 'newest', label: 'Plus récents' },
];

const cities = [
  'Antananarivo', 'Toamasina', 'Antsirabe', 'Mahajanga',
  'Toliara', 'Antsiranana', 'Fianarantsoa', 'Nosy Be',
];

export default function PrestatairesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PrestatairesPageContent />
    </Suspense>
  );
}

function PrestatairesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedServiceType, setSelectedServiceType] = useState(searchParams.get('serviceType') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('priceRange') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchProviders = useCallback(async (reset = false) => {
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
      if (selectedServiceType) params.append('serviceType', selectedServiceType);
      if (selectedPriceRange) params.append('priceRange', selectedPriceRange);

      const response = await fetch(`/api/bons-plans/prestataires?${params}`);
      const data = await response.json();

      if (reset) {
        setProviders(data.providers || []);
        setOffset(12);
      } else {
        setProviders((prev) => [...prev, ...(data.providers || [])]);
        setOffset((prev) => prev + 12);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, searchQuery, selectedCity, selectedServiceType, selectedPriceRange, sortBy]);

  useEffect(() => {
    fetchProviders(true);
  }, [searchQuery, selectedCity, selectedServiceType, selectedPriceRange, sortBy]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedServiceType) params.set('serviceType', selectedServiceType);
    if (selectedPriceRange) params.set('priceRange', selectedPriceRange);
    if (sortBy && sortBy !== 'rating') params.set('sortBy', sortBy);
    const qs = params.toString();
    router.replace(`/bons-plans/prestataires${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, selectedCity, selectedServiceType, selectedPriceRange, sortBy, router]);

  const getServiceTypeLabel = (type: string) => {
    return serviceTypes.find((s) => s.value === type)?.label || type;
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'GUIDE': return 'bg-cyan-500/20 text-cyan-400';
      case 'DRIVER': return 'bg-blue-500/20 text-blue-400';
      case 'TOUR_OPERATOR': return 'bg-purple-500/20 text-purple-400';
      case 'CAR_RENTAL': return 'bg-indigo-500/20 text-indigo-400';
      case 'PHOTOGRAPHER': return 'bg-pink-500/20 text-pink-400';
      case 'TRANSLATOR': return 'bg-emerald-500/20 text-emerald-400';
      case 'TRAVEL_AGENCY': return 'bg-amber-500/20 text-amber-400';
      case 'TRANSFER': return 'bg-sky-500/20 text-sky-400';
      case 'BOAT_EXCURSION': return 'bg-teal-500/20 text-teal-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const hasActiveFilters = selectedServiceType || selectedPriceRange || selectedCity;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header épuré */}
      <section className="bg-[#FDFBF7] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Left: Title */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold text-[#2D241E] flex items-center gap-2">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-[#D97706] flex-shrink-0" />
                Prestataires touristiques
              </h1>
              <p className="text-[#8B7E6E] text-xs sm:text-sm mt-1">Guides, chauffeurs et agences pour votre séjour à Madagascar</p>
            </motion.div>

            {/* Center: 2 mini photos */}
            <div className="hidden lg:flex gap-3 flex-shrink-0">
              <div className="relative w-24 h-16 rounded-lg overflow-hidden shadow-md border border-gray-200">
                <Image src="/images/highlights/Chauffeur.png" alt="Chauffeur Madagascar" fill className="object-cover" sizes="96px" />
              </div>
              <div className="relative w-24 h-16 rounded-lg overflow-hidden shadow-md border border-gray-200">
                <Image src="/images/highlights/Guide.png" alt="Guide Madagascar" fill className="object-cover" sizes="96px" />
              </div>
            </div>

            {/* Right: Search bar */}
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0 lg:max-w-lg w-full lg:w-auto">
              <div className="flex-1 flex items-center gap-2 px-3 bg-white rounded-xl shadow-md border border-gray-100">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Rechercher un prestataire..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 py-2.5 bg-transparent outline-none text-[#2D241E] text-sm placeholder:text-gray-400" />
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
                    {/* Type de service */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Type de service</label>
                      <div className="flex flex-wrap gap-2">
                        {serviceTypes.slice(0, 6).map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setSelectedServiceType(type.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedServiceType === type.value
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                                : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-cyan-500/50'
                            }`}
                          >
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {serviceTypes.slice(6).map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setSelectedServiceType(type.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedServiceType === type.value
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                                : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-cyan-500/50'
                            }`}
                          >
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Prix */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Gamme de prix</label>
                      <div className="flex flex-wrap gap-2">
                        {priceRanges.map((range) => (
                          <button
                            key={range.value}
                            onClick={() => setSelectedPriceRange(range.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              selectedPriceRange === range.value
                                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                                : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-cyan-500/50'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tri */}
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Trier par</label>
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

                  {hasActiveFilters && (
                    <div className="mt-4 pt-4 border-t border-[#2a2a36] flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-400">Filtres actifs:</span>
                      {selectedCity && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                          {selectedCity}
                          <button onClick={() => setSelectedCity('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {selectedServiceType && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                          {getServiceTypeLabel(selectedServiceType)}
                          <button onClick={() => setSelectedServiceType('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      {selectedPriceRange && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm">
                          {priceRanges.find(r => r.value === selectedPriceRange)?.label}
                          <button onClick={() => setSelectedPriceRange('')}><X className="w-3 h-3" /></button>
                        </span>
                      )}
                      <button
                        onClick={() => { setSelectedCity(''); setSelectedServiceType(''); setSelectedPriceRange(''); }}
                        className="text-sm text-cyan-400 hover:underline"
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
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-400">
            <span className="font-semibold text-white">{total}</span> prestataire{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
          </p>
        </div>

        {isLoading && providers.length === 0 ? (
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
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Aucun prestataire trouvé</h2>
            <p className="text-slate-400 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCity(''); setSelectedServiceType(''); setSelectedPriceRange(''); }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36] hover:border-cyan-500/50 transition-all"
                >
                  <div className="relative h-48 bg-gradient-to-br from-[#1a1a24] to-[#2a2a36]">
                    {provider.coverImage ? (
                      <Image
                        src={getImageUrl(provider.coverImage)}
                        alt={provider.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-16 h-16 text-slate-600" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getServiceTypeColor(provider.serviceType)}`}>
                        {getServiceTypeLabel(provider.serviceType)}
                      </span>
                      {provider.isFeatured && (
                        <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-medium">
                          Recommandé
                        </span>
                      )}
                    </div>

                    {provider.isAvailable !== false && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 backdrop-blur-sm text-emerald-400 rounded-full text-xs font-medium">
                        Disponible
                      </div>
                    )}
                  </div>

                  <Link href={`/bons-plans/prestataires/${provider.slug}`}>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors mb-1">
                        {provider.name}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        {provider.district ? `${provider.district}, ` : ''}{provider.city}
                      </div>

                      {provider.languages?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {provider.languages.slice(0, 3).map((lang) => (
                            <span key={lang} className="px-2 py-0.5 bg-[#0d1520] text-slate-400 text-xs rounded">
                              {lang}
                            </span>
                          ))}
                        </div>
                      )}

                      {(provider.priceFrom || provider.experience) && (
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-3 p-2 bg-[#0d1520] rounded-lg">
                          {provider.priceFrom && (
                            <span className="text-cyan-400 font-medium">
                              À partir de {provider.priceFrom.toLocaleString()} Ar
                              {provider.priceUnit && ` ${provider.priceUnit}`}
                            </span>
                          )}
                          {provider.experience && (
                            <span>{provider.experience}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-[#2a2a36]">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-white">{provider.rating?.toFixed(1)}</span>
                          <span className="text-sm text-slate-400">({provider.reviewCount} avis)</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchProviders(false)}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Chargement...' : 'Voir plus de prestataires'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA Bannière - Devenir prestataire */}
      <section className="relative overflow-hidden border-t border-[#2a2a36]">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-blue-500/10" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Vous proposez des services touristiques ?
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto mb-8">
            Rejoignez Mada Spot et rendez vos services visibles aupr&egrave;s de milliers de voyageurs.
            Inscription gratuite, validation rapide.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/publier-lieu?type=PROVIDER"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Publier mon profil prestataire
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/comment-ca-marche"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#1a1a24] border border-[#2a2a36] text-slate-300 font-medium rounded-xl hover:border-cyan-500/50 hover:text-white transition-all"
            >
              Comment &ccedil;a marche ?
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
