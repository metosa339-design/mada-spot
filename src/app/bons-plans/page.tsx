'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTrans } from '@/i18n';

// Dynamically import map to avoid SSR issues
const AttractionsMap = dynamic(() => import('@/components/maps/AttractionsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full bg-[#1a1a24] rounded-2xl flex items-center justify-center border border-orange-500/20">
      <div className="text-slate-400">Chargement de la carte interactive...</div>
    </div>
  ),
});
import {
  Search,
  MapPin,
  Star,
  Building2,
  UtensilsCrossed,
  Mountain,
  Users,
  Map,
  ChevronRight,
  Compass,
  Sparkles,
  ArrowRight,
  Loader2,
  Trees,
  Palmtree,
  Waves,
  Castle,
  Camera,
  Footprints,
} from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';
import { MADAGASCAR_CITIES_BY_PROVINCE } from '@/lib/data/madagascar-locations';

interface Attraction {
  id: string;
  name: string;
  slug: string;
  city: string;
  district?: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  description?: string;
  // Flattened attraction fields from API
  attractionType?: string;
  isFree?: boolean;
  entryFeeLocal?: number;
  entryFeeForeign?: number;
  highlights?: string[];
}

// Categories avec style warm/lifestyle
const CATEGORIES_RAW = [
  {
    nameKey: 'catHotels',
    slug: 'hotels',
    icon: Building2,
    gradient: 'from-orange-500 to-amber-500',
    descKey: 'catHotelsDesc',
  },
  {
    nameKey: 'catRestaurants',
    slug: 'restaurants',
    icon: UtensilsCrossed,
    gradient: 'from-pink-500 to-rose-500',
    descKey: 'catRestaurantsDesc',
  },
  {
    nameKey: 'catAttractions',
    slug: 'attractions',
    icon: Mountain,
    gradient: 'from-purple-500 to-violet-500',
    descKey: 'catAttractionsDesc',
  },
  {
    nameKey: 'catProviders',
    slug: 'prestataires',
    icon: Users,
    gradient: 'from-cyan-500 to-teal-500',
    descKey: 'catProvidersDesc',
  },
];

// Attraction type icons and colors - style dark
// Images par catégorie pour les attractions
const ATTRACTION_IMAGES: Record<string, string[]> = {
  tsingy: ['/images/Attractions/bemaraha/tsingy-bemaraha.jpg', '/images/highlights/tsingy.jpg'],
  baobab: ['/images/Attractions/baobabs/allee-des-baobabs.jpg', '/images/Attractions/baobabs/allee-des-baobabs-1.jpg', '/images/Attractions/baobabs/allee-des-baobabs-2.jpg', '/images/Attractions/baobabs/allee-des-baobabs-3.jpg', '/images/highlights/baobabs.jpg'],
  ile: ['/images/Attractions/nosy-be/nosy-be.jpg', '/images/Attractions/nosy-be/nosy-be-1.jpg', '/images/Attractions/nosy-be/nosy-be-2.jpg', '/images/Attractions/nosy-be/nosy-be-3.jpg', '/images/Attractions/nosy-be/nosy-be-4.jpg', '/images/Attractions/sainte-marie/ile-sainte-marie.jpg', '/images/Attractions/sainte-marie/ile-sainte-marie-1.jpg'],
  plage: ['/images/Attractions/ifaty/ifaty-tulear.jpg', '/images/Attractions/ifaty/ifatytulear.png', '/images/highlights/plage.jpg', '/images/highlights/pirogue.jpg'],
  montagne: ['/images/Attractions/divers/massif-andringitra.jpg', '/images/highlights/montagne.jpg', '/images/highlights/randonnee.jpg'],
  parc: ['/images/Attractions/isalo/parc-isalo.jpg', '/images/Attractions/ranomafana/parc-ranomafana.jpg', '/images/Attractions/masoala/parc-masoala.jpg', '/images/Attractions/masoala/parc-masoala-1.jpg', '/images/Attractions/masoala/parc-masoala-2.jpg', '/images/Attractions/masoala/parc-masoala-3.jpg', '/images/Attractions/andasibe/andasibe-mantadia.jpg', '/images/Attractions/andasibe/andasibe-mantadia-1.jpg', '/images/Attractions/andasibe/andasibe-mantadia-2.jpg', '/images/Attractions/andasibe/andasibe-mantadia-3.jpg', '/images/highlights/foret.jpg'],
  reserve: ['/images/Attractions/divers/reserve-anja.jpg', '/images/Attractions/divers/reserve-anja3.png', '/images/Attractions/ankarana/ankarana.jpg', '/images/Attractions/ankarana/ankarana-1.jpg', '/images/Attractions/ankarana/ankarana-2.jpg', '/images/highlights/lemur.jpg'],
  cascade: ['/images/highlights/foret.jpg', '/images/Attractions/ranomafana/parc-ranomafana.jpg'],
  train: ['/images/highlights/train.jpg', '/images/Attractions/fianarantsoa/fianarantsoa.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-1.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-2.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-3.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-4.jpg'],
  lac: ['/images/Attractions/antsirabe/lac-tritriva.jpg', '/images/Attractions/antsirabe/andraikiba.jpg', '/images/highlights/lac.jpg'],
  thermes: ['/images/Attractions/antsirabe/source-thermal.png', '/images/highlights/thermes.jpg'],
  culture: ['/images/Attractions/ambositra/artisanat.jpg', '/images/highlights/artisanat.jpg', '/images/highlights/village.jpg', '/images/highlights/marche.jpg'],
  default: ['/images/Attractions/antananarivo/antananarivo.jpg', '/images/Attractions/antananarivo/antananarivo4.png', '/images/Attractions/antananarivo/antananarivo-2.jpg', '/images/Attractions/diego-suarez/diego-suarez.jpg', '/images/Attractions/diego-suarez/diego-suarez-1.jpg', '/images/Attractions/fort-dauphin/fort-dauphin.jpg', '/images/Attractions/fort-dauphin/fort-dauphin-1.jpg', '/images/Attractions/fort-dauphin/fort-dauphin13.png', '/images/Attractions/antsirabe/antsirabe.jpg', '/images/Attractions/antsirabe/antsirabe-1.jpg', '/images/Attractions/antsirabe/antsirabe-2.jpg', '/images/Attractions/antsirabe/antsirabe-3.jpg', '/images/Attractions/antsirabe/antsirabe-4.jpg', '/images/Attractions/pangalanes/canal-pangalanes.jpg', '/images/Attractions/pangalanes/canal-pangalanes-1.jpg', '/images/Attractions/pangalanes/canal-pangalanes-2.jpg', '/images/Attractions/pangalanes/canal-pangalanes-3.jpg', '/images/highlights/sunset.jpg'],
};

const ATTRACTION_KEYWORDS: Record<string, string[]> = {
  tsingy: ['tsingy', 'bemaraha'],
  baobab: ['baobab', 'morondava', 'allée'],
  ile: ['nosy', 'île', 'ile', 'iranja', 'tanikely', 'komba', 'nattes'],
  plage: ['plage', 'beach', 'anakao', 'ifaty', 'tuléar', 'toliara'],
  montagne: ['montagne', 'makay', 'ambre', 'andringitra', 'massif', 'isalo'],
  parc: ['parc', 'ranomafana', 'andasibe', 'masoala', 'mantadia'],
  reserve: ['réserve', 'reserve', 'anja', 'berenty', 'ankarana', 'reniala'],
  cascade: ['cascade', 'chute', 'waterfall'],
  train: ['train', 'fce', 'fianarantsoa'],
  lac: ['lac', 'tritriva', 'andraikiba'],
  thermes: ['thermal', 'thermes', 'source chaude', 'antsirabe'],
  culture: ['artisan', 'marché', 'village', 'culture', 'tradition'],
};

function getAttractionImage(name: string, coverImage?: string): string {
  if (coverImage && (coverImage.startsWith('http') || coverImage.startsWith('/'))) {
    return getImageUrl(coverImage) || encodeURI(coverImage);
  }

  const lowerName = name.toLowerCase();

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

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
  }
  return getImageUrl(ATTRACTION_IMAGES.default[Math.abs(hash) % ATTRACTION_IMAGES.default.length]);
}

const ATTRACTION_TYPE_CONFIG: Record<string, { icon: typeof Mountain; color: string; bgColor: string; labelKey: string }> = {
  NATIONAL_PARK: { icon: Trees, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', labelKey: 'typeNationalPark' },
  NATURE_RESERVE: { icon: Palmtree, color: 'text-green-400', bgColor: 'bg-green-500/20', labelKey: 'typeNatureReserve' },
  BEACH: { icon: Waves, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', labelKey: 'typeBeach' },
  ISLAND: { icon: Palmtree, color: 'text-blue-400', bgColor: 'bg-blue-500/20', labelKey: 'typeIsland' },
  HISTORICAL_SITE: { icon: Castle, color: 'text-amber-400', bgColor: 'bg-amber-500/20', labelKey: 'typeHistoricalSite' },
  CULTURAL_SITE: { icon: Castle, color: 'text-purple-400', bgColor: 'bg-purple-500/20', labelKey: 'typeCulturalSite' },
  VIEWPOINT: { icon: Camera, color: 'text-pink-400', bgColor: 'bg-pink-500/20', labelKey: 'typeViewpoint' },
  HIKING_TRAIL: { icon: Footprints, color: 'text-orange-400', bgColor: 'bg-orange-500/20', labelKey: 'typeHikingTrail' },
  WATERFALL: { icon: Waves, color: 'text-sky-400', bgColor: 'bg-sky-500/20', labelKey: 'typeWaterfall' },
  WILDLIFE: { icon: Palmtree, color: 'text-lime-400', bgColor: 'bg-lime-500/20', labelKey: 'typeWildlife' },
};
const getAttractionTypeConfig = (type: string) => {
  return ATTRACTION_TYPE_CONFIG[type] || { icon: Mountain, color: 'text-orange-400', bgColor: 'bg-orange-500/20', labelKey: 'typeDefault' };
};

export default function BonsPlansPage() {
  const t = useTrans('bonsPlansLanding');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        // Fetch all attractions
        const res = await fetch('/api/bons-plans/attractions?limit=50');
        if (res.ok) {
          const data = await res.json();
          setAttractions(data.attractions || []);
        }
      } catch (error) {
        console.error('Error fetching attractions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttractions();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity) params.set('city', selectedCity);
    window.location.href = `/attractions?${params.toString()}`;
  };

  const getPriceDisplay = (attraction: Attraction) => {
    if (attraction.isFree) return t.free;
    if (attraction.entryFeeLocal) {
      return `${attraction.entryFeeLocal.toLocaleString()} Ar`;
    }
    return '';
  };

  const getHighlights = (attraction: Attraction): string[] => {
    if (!attraction.highlights) return [];
    return Array.isArray(attraction.highlights) ? attraction.highlights.slice(0, 3) : [];
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Hero Section - Warm Lifestyle Theme */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        {/* Background gradient warm */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.3) 0%, rgba(255,20,147,0.2) 50%, rgba(148,0,211,0.3) 100%)'
            }}
          />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 backdrop-blur-sm rounded-full border border-orange-500/30 text-orange-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t.heroBadge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4">
              {t.heroTitle} <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">{t.heroTitleHighlight}</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              {t.heroDesc}
            </p>
          </motion.div>

          {/* Search bar - Dark style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3 bg-[#1a1a24] p-2 rounded-2xl border border-[#2a2a36]">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 py-3 outline-none bg-transparent text-white placeholder:text-slate-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              <div className="hidden sm:block w-px bg-[#2a2a36]" />

              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="appearance-none flex items-center gap-2 px-4 py-3 text-white rounded-xl transition-colors w-full sm:w-48 bg-[#0d1520] cursor-pointer outline-none border border-[#2a2a36]"
                >
                  <option value="">{t.allCities}</option>
                  {MADAGASCAR_CITIES_BY_PROVINCE.map((p) => (
                    <optgroup key={p.province} label={p.province}>
                      {p.cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
              </div>

              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                {t.searchBtn}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories - Dark cards */}
      <section className="py-8 -mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES_RAW.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/${category.slug}`}
                    className="block bg-[#1a1a24] rounded-2xl p-5 border border-[#2a2a36] hover:border-orange-500/50 transition-all group"
                  >
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${category.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{t[category.nameKey]}</h3>
                    <p className="text-sm text-slate-400">{t[category.descKey]}</p>
                    <div className="mt-4 flex items-center text-sm font-medium text-orange-400">
                      {t.explore}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Destinations - Dark theme */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
              <Compass className="w-4 h-4" />
              {attractions.length} {t.destinationsToDiscover}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.allDestinationsTitle} <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">{t.allDestinationsTitleHighlight}</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t.allDestinationsDesc}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : attractions.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {attractions.map((attraction, index) => {
                const typeConfig = getAttractionTypeConfig(attraction.attractionType || '');
                const TypeIcon = typeConfig.icon;
                const highlights = getHighlights(attraction);
                const price = getPriceDisplay(attraction);

                return (
                  <motion.div
                    key={attraction.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Link
                      href={`/attractions/${attraction.slug}`}
                      className="block bg-[#1a1a24] rounded-2xl border border-[#2a2a36] overflow-hidden hover:border-orange-500/50 transition-all group h-full"
                    >
                      {/* Image avec background-image */}
                      <div
                        className="relative aspect-[4/3] bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{
                          backgroundImage: `url(${getAttractionImage(attraction.name, attraction.coverImage)})`
                        }}
                      >
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] via-transparent to-transparent opacity-60" />

                        {/* Type badge */}
                        <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color} backdrop-blur-sm`}>
                          <TypeIcon className="w-3 h-3 inline mr-1" />
                          {t[typeConfig.labelKey]}
                        </div>

                        {/* Featured badge */}
                        {attraction.isFeatured && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-medium">
                            <Star className="w-3 h-3 inline mr-1 fill-current" />
                            {t.featuredBadge}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                          {attraction.name}
                        </h3>
                        <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          {attraction.city}
                          {attraction.district && `, ${attraction.district}`}
                        </div>

                        {/* Rating & Price */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a36]">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-semibold text-white">{attraction.rating.toFixed(1)}</span>
                            <span className="text-sm text-slate-400">({attraction.reviewCount})</span>
                          </div>
                          {price && (
                            <span className={`text-sm font-semibold ${attraction.isFree ? 'text-green-400' : 'text-orange-400'}`}>
                              {price}
                            </span>
                          )}
                        </div>

                        {/* Highlights tags */}
                        {highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#2a2a36]">
                            {highlights.map((highlight, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[10px] font-medium"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Compass className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{t.noDestinations}</h3>
              <p className="text-slate-500">{t.noDestinationsDesc}</p>
            </div>
          )}

          {/* CTA vers toutes les attractions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link
              href="/attractions"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              <Mountain className="w-5 h-5" />
              {t.seeAllAttractions}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Interactive Map Section - Dark */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              {t.mapBadge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.mapTitle} <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">{t.mapTitleHighlight}</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t.mapDesc}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden border border-[#2a2a36]"
          >
            <AttractionsMap className="h-[500px] w-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <Link
              href="/carte"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <Map className="w-5 h-5" />
              {t.openFullMap}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Dark gradient */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl p-8 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,53,0.2) 0%, rgba(255,20,147,0.15) 50%, rgba(148,0,211,0.2) 100%)',
              border: '1px solid rgba(255,107,53,0.3)'
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500" />

            <h2 className="text-2xl font-bold text-white mb-4">
              {t.ctaTitle}
            </h2>
            <p className="text-slate-400 mb-6">
              {t.ctaDesc}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              {t.ctaBtn}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
