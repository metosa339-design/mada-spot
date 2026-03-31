'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const AttractionsMap = dynamic(() => import('@/components/maps/AttractionsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-[#1a1a24] rounded-2xl flex items-center justify-center border border-orange-500/20">
      <div className="text-slate-400">Chargement de la carte...</div>
    </div>
  ),
});
import {
  Search,
  MapPin,
  Star,
  Filter,
  X,
  Mountain,
  Trees,
  Waves,
  Building,
  Landmark,
  Camera,
  Clock,
  ChevronDown,
  Accessibility,
  ParkingCircle,
  Users,
  Sparkles,
} from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface Attraction {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  coverImage: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  attractionType: string;
  isFree: boolean;
  entryFeeForeign: number;
  entryFeeLocal: number;
  visitDuration: string;
  bestTimeToVisit: string;
  isAccessible: boolean;
  hasGuide: boolean;
  hasParking: boolean;
  highlights: string[];
}

const attractionTypes = [
  { value: '', label: 'Tous les types', icon: Camera },
  { value: 'parc_national', label: 'Parc National', icon: Trees },
  { value: 'plage', label: 'Plage', icon: Waves },
  { value: 'cascade', label: 'Cascade', icon: Waves },
  { value: 'montagne', label: 'Montagne', icon: Mountain },
  { value: 'reserve', label: 'Réserve naturelle', icon: Trees },
  { value: 'site_historique', label: 'Site historique', icon: Landmark },
  { value: 'musee', label: 'Musée', icon: Building },
];

const sortOptions = [
  { value: 'rating', label: 'Meilleures notes' },
  { value: 'price', label: 'Prix croissant' },
  { value: 'newest', label: 'Plus récents' },
];

const POPULAR_DESTINATIONS = [
  { label: 'Nosy Be', value: 'Nosy Be' },
  { label: 'Andasibe', value: 'Andasibe' },
  { label: 'Isalo', value: 'Isalo' },
  { label: 'Morondava', value: 'Morondava' },
  { label: 'Diego Suarez', value: 'Diego Suarez' },
  { label: 'Fort-Dauphin', value: 'Fort-Dauphin' },
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
  'Andasibe',
  'Isalo',
  'Ranomafana',
  'Maroantsetra',
  'Sambava',
];

// Images par catégorie pour les attractions
const ATTRACTION_IMAGES: Record<string, string[]> = {
  tsingy: [
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
  ],
  baobab: [
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    'https://images.unsplash.com/photo-1625576553878-6a28f9733cd8?w=800&q=80',
  ],
  ile: [
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
    'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
  ],
  plage: [
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80',
    'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?w=800&q=80',
  ],
  montagne: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80',
  ],
  parc: [
    'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80',
    'https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=800&q=80',
  ],
  reserve: [
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80',
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800&q=80',
  ],
  cascade: [
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
    'https://images.unsplash.com/photo-1467890947394-8171244e5410?w=800&q=80',
  ],
  train: [
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&q=80',
    'https://images.unsplash.com/photo-1527684651001-731c474bbb5a?w=800&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80',
    'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80',
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80',
    'https://images.unsplash.com/photo-1590418606746-018840f9cd0f?w=800&q=80',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80',
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80',
  ],
};

const ATTRACTION_KEYWORDS: Record<string, string[]> = {
  tsingy: ['tsingy', 'bemaraha'],
  baobab: ['baobab', 'morondava', 'allée'],
  ile: ['nosy', 'île', 'ile', 'iranja', 'tanikely', 'komba', 'nattes'],
  plage: ['plage', 'beach', 'anakao', 'ifaty'],
  montagne: ['montagne', 'makay', 'ambre', 'andringitra', 'massif', 'isalo'],
  parc: ['parc', 'ranomafana', 'andasibe', 'masoala', 'mantadia'],
  reserve: ['réserve', 'reserve', 'anja', 'berenty', 'ankarana', 'reniala'],
  cascade: ['cascade', 'chute', 'waterfall'],
  train: ['train', 'fce', 'fianarantsoa'],
};

// Fonction pour obtenir une image basée sur le nom de l'attraction
function getAttractionImage(name: string, coverImage?: string): string {
  // Si une image valide existe (URL externe ou chemin local), l'utiliser
  if (coverImage && (coverImage.startsWith('http') || coverImage.startsWith('/'))) {
    return getImageUrl(coverImage) || encodeURI(coverImage);
  }

  const lowerName = name.toLowerCase();

  // Chercher la catégorie correspondante
  for (const [category, keywords] of Object.entries(ATTRACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        const images = ATTRACTION_IMAGES[category];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash) + name.charCodeAt(i);
        }
        return getImageUrl(images[Math.abs(hash) % images.length]);
      }
    }
  }

  // Image par défaut basée sur le hash du nom
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
  }
  return getImageUrl(ATTRACTION_IMAGES.default[Math.abs(hash) % ATTRACTION_IMAGES.default.length]);
}

export default function AttractionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <AttractionsPageContent />
    </Suspense>
  );
}

function AttractionsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [showFreeOnly, setShowFreeOnly] = useState(searchParams.get('free') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchAttractions = useCallback(async (reset = false) => {
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
      if (selectedType) params.append('type', selectedType);
      if (showFreeOnly) params.append('free', 'true');

      const response = await fetch(`/api/bons-plans/attractions?${params}`);
      const data = await response.json();

      if (reset) {
        setAttractions(data.attractions || []);
        setOffset(12);
      } else {
        setAttractions((prev) => [...prev, ...(data.attractions || [])]);
        setOffset((prev) => prev + 12);
      }

      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Error fetching attractions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [offset, searchQuery, selectedCity, selectedType, showFreeOnly, sortBy]);

  useEffect(() => {
    fetchAttractions(true);
  }, [searchQuery, selectedCity, selectedType, showFreeOnly, sortBy]);

  // Sync filters to URL for shareable/bookmarkable links
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedType) params.set('type', selectedType);
    if (showFreeOnly) params.set('free', 'true');
    if (sortBy && sortBy !== 'rating') params.set('sortBy', sortBy);
    const qs = params.toString();
    router.replace(`/bons-plans/attractions${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchQuery, selectedCity, selectedType, showFreeOnly, sortBy, router]);

  const getTypeLabel = (type: string) => {
    return attractionTypes.find((t) => t.value === type)?.label || type;
  };

  const getTypeIcon = (type: string) => {
    const TypeIcon = attractionTypes.find((t) => t.value === type)?.icon || Camera;
    return TypeIcon;
  };

  // Dark theme type colors
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'parc_national':
      case 'reserve':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'plage':
      case 'cascade':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'montagne':
        return 'bg-amber-500/20 text-amber-400';
      case 'site_historique':
      case 'musee':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-orange-500/20 text-orange-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#D97706] to-[#B45309] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 py-10 sm:py-14">
            <h1 className="text-2xl sm:text-4xl font-bold text-white flex items-center gap-3">
              <Mountain className="w-7 h-7 sm:w-9 sm:h-9 text-white flex-shrink-0" />
              Attractions Touristiques
            </h1>
            <p className="text-white/85 text-sm sm:text-base mt-2 max-w-xl">
              Parcs nationaux, plages paradisiaques, sites historiques et merveilles naturelles
            </p>
          </motion.div>
          <div className="hidden md:flex gap-3 w-1/3 flex-shrink-0">
            <div className="relative w-1/2 h-40 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/images/Attractions/A la compagne.png" alt="Rizières en terrasses et village malgache dans les hauts plateaux de Madagascar" fill className="object-cover" sizes="15vw" />
            </div>
            <div className="relative w-1/2 h-40 rounded-2xl overflow-hidden shadow-lg">
              <Image src="/images/Attractions/Famille heureuse.png" alt="Famille malgache heureuse découvrant les paysages de Madagascar" fill className="object-cover" sizes="15vw" />
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="relative z-10 bg-[#0a0a0f]/95 border-b border-[#2a2a36]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher une attraction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#0d1520] border border-[#2a2a36] rounded-xl text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full md:w-48 px-4 py-3 bg-[#0d1520] border border-[#2a2a36] rounded-xl text-white appearance-none cursor-pointer outline-none"
              >
                <option value="">Toutes les régions</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-label={showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
              aria-expanded={showFilters}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                showFilters
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filtres
            </button>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <div className="border-b border-[#2a2a36]">
        <div className="max-w-7xl mx-auto px-4 py-3">
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
      </div>

      {/* Filters - Dark */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#1a1a24] border-b border-[#2a2a36] overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Type d'attraction
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {attractionTypes.slice(0, 5).map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedType === type.value
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                            : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
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
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Tarif
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowFreeOnly(false)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        !showFreeOnly
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                          : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setShowFreeOnly(true)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        showFreeOnly
                          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                          : 'bg-[#0d1520] border border-[#2a2a36] text-slate-400 hover:border-orange-500/50'
                      }`}
                    >
                      Gratuit uniquement
                    </button>
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
                    className="w-full px-4 py-2 bg-[#0d1520] border border-[#2a2a36] rounded-lg text-white appearance-none cursor-pointer focus:border-orange-500/50 focus:outline-none"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active filters */}
              {(selectedType || selectedCity || showFreeOnly) && (
                <div className="mt-4 pt-4 border-t border-[#2a2a36] flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-400">Filtres actifs:</span>
                  {selectedCity && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-sm">
                      {selectedCity}
                      <button onClick={() => setSelectedCity('')} aria-label="Retirer le filtre ville">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedType && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-sm">
                      {getTypeLabel(selectedType)}
                      <button onClick={() => setSelectedType('')} aria-label="Retirer le filtre type">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {showFreeOnly && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm">
                      Gratuit
                      <button onClick={() => setShowFreeOnly(false)} aria-label="Retirer le filtre gratuit">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedCity('');
                      setSelectedType('');
                      setShowFreeOnly(false);
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

      {/* Interactive Map - Dark */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Carte des attractions</h2>
              <p className="text-slate-500 text-sm mt-1">Toutes les destinations Madagascar en un coup d'œil</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <MapPin className="w-4 h-4" />
              {total} {total > 1 ? 'destinations' : 'destination'}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#2a2a36]">
            <AttractionsMap attractions={attractions} className="h-[400px] w-full" />
          </div>
        </div>
      </div>

      {/* Results - Dark */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-400">
            <span className="text-white font-semibold">{total}</span> attraction{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
          </p>
        </div>

        {isLoading && attractions.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        ) : attractions.length === 0 ? (
          <div className="text-center py-16">
            <Mountain className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Aucune attraction trouvée</h2>
            <p className="text-slate-400 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCity('');
                setSelectedType('');
                setShowFreeOnly(false);
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {attractions.map((attraction, index) => {
                const TypeIcon = getTypeIcon(attraction.attractionType);
                return (
                  <motion.div
                    key={attraction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={`/bons-plans/attractions/${attraction.slug}`}
                      className="group block bg-[#1a1a24] rounded-2xl overflow-hidden border border-[#2a2a36] hover:border-orange-500/50 transition-all h-full"
                    >
                      {/* Image avec background-image */}
                      <div
                        className="relative h-48 overflow-hidden bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{
                          backgroundImage: `url(${getAttractionImage(attraction.name, attraction.coverImage)})`
                        }}
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] via-transparent to-transparent opacity-60" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${getTypeColor(attraction.attractionType)}`}>
                            <TypeIcon className="w-3 h-3" />
                            {getTypeLabel(attraction.attractionType)}
                          </span>
                          {attraction.isFeatured && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-medium">
                              Incontournable
                            </span>
                          )}
                        </div>

                        {/* Prix */}
                        <div className="absolute top-3 right-3">
                          {attraction.isFree ? (
                            <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 backdrop-blur-sm rounded-lg text-xs font-medium">
                              Gratuit
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-[#1a1a24]/80 text-orange-400 backdrop-blur-sm rounded-lg text-xs font-medium">
                              {attraction.entryFeeLocal?.toLocaleString()} Ar
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors mb-1">
                          {attraction.name}
                        </h3>

                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                          <MapPin className="w-3 h-3" />
                          {attraction.district}, {attraction.city}
                        </div>

                        {/* Highlights */}
                        {attraction.highlights?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {attraction.highlights.slice(0, 2).map((highlight) => (
                              <span
                                key={highlight}
                                className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] rounded font-medium"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                          {attraction.visitDuration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {attraction.visitDuration}
                            </span>
                          )}
                          {attraction.hasGuide && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Guide
                            </span>
                          )}
                        </div>

                        {/* Accessibilité */}
                        <div className="flex items-center gap-2 mb-3">
                          {attraction.isAccessible && (
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Accessibility className="w-3 h-3" />
                              Accessible
                            </span>
                          )}
                          {attraction.hasParking && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <ParkingCircle className="w-3 h-3" />
                              Parking
                            </span>
                          )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#2a2a36]">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-medium text-white">{attraction.rating?.toFixed(1)}</span>
                            <span className="text-sm text-slate-400">({attraction.reviewCount})</span>
                          </div>
                          {!attraction.isFree && attraction.entryFeeForeign && (
                            <span className="text-xs text-slate-400">
                              Touristes: {attraction.entryFeeForeign.toLocaleString()} Ar
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchAttractions(false)}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Chargement...' : 'Voir plus d\'attractions'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
