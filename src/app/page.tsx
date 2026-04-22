'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Loader2,
  Building2,
  Mountain,
  Compass,
  UtensilsCrossed,
  Map,
  Users,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TrendingSection from '@/components/TrendingSection';
import { useTrans } from '@/i18n';
import { getImageUrl } from '@/lib/image-url';

interface Attraction {
  id: string;
  name: string;
  slug: string;
  city: string;
  coverImage?: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
}

const cities = [
  'Antananarivo',
  'Toamasina',
  'Antsirabe',
  'Fianarantsoa',
  'Mahajanga',
  'Nosy Be',
  'Diego Suarez',
  'Fort Dauphin',
];

// Images locales pour les cartes d'attractions
const ATTRACTION_IMAGES: Record<string, string[]> = {
  tsingy: ['/images/Attractions/bemaraha/tsingy-bemaraha.jpg', '/images/highlights/tsingy.jpg'],
  baobab: ['/images/Attractions/baobabs/allee-des-baobabs.jpg', '/images/Attractions/baobabs/allee-des-baobabs-1.jpg', '/images/Attractions/baobabs/allee-des-baobabs-2.jpg', '/images/Attractions/baobabs/allee-des-baobabs-3.jpg', '/images/highlights/baobabs.jpg'],
  ile: ['/images/Attractions/nosy-be/nosy-be.jpg', '/images/Attractions/nosy-be/nosy-be-1.jpg', '/images/Attractions/nosy-be/nosy-be-2.jpg', '/images/Attractions/nosy-be/nosy-be-3.jpg', '/images/Attractions/nosy-be/nosy-be-4.jpg', '/images/Attractions/sainte-marie/ile-sainte-marie.jpg', '/images/Attractions/sainte-marie/ile-sainte-marie-1.jpg'],
  plage: ['/images/Attractions/ifaty/ifaty-tulear.jpg', '/images/Attractions/ifaty/ifatytulear.png', '/images/highlights/plage.jpg', '/images/highlights/pirogue.jpg'],
  montagne: ['/images/Attractions/divers/massif-andringitra.jpg', '/images/highlights/montagne.jpg', '/images/highlights/randonnee.jpg'],
  parc: ['/images/Attractions/isalo/parc-isalo.jpg', '/images/Attractions/ranomafana/parc-ranomafana.jpg', '/images/Attractions/masoala/parc-masoala.jpg', '/images/Attractions/masoala/parc-masoala-1.jpg', '/images/Attractions/masoala/parc-masoala-2.jpg', '/images/Attractions/masoala/parc-masoala-3.jpg', '/images/Attractions/andasibe/andasibe-mantadia.jpg', '/images/Attractions/andasibe/andasibe-mantadia-1.jpg', '/images/Attractions/andasibe/andasibe-mantadia-2.jpg', '/images/Attractions/andasibe/andasibe-mantadia-3.jpg', '/images/highlights/foret.jpg'],
  reserve: ['/images/Attractions/divers/reserve-anja.jpg', '/images/Attractions/divers/reserve-anja3.png', '/images/Attractions/ankarana/ankarana.jpg', '/images/Attractions/ankarana/ankarana-1.jpg', '/images/Attractions/ankarana/ankarana-2.jpg', '/images/highlights/lemur.jpg'],
  cascade: ['/images/highlights/foret.jpg'],
  train: ['/images/highlights/train.jpg', '/images/Attractions/fianarantsoa/fianarantsoa.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-1.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-2.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-3.jpg', '/images/Attractions/fianarantsoa/fianarantsoa-4.jpg'],
  lac: ['/images/Attractions/antsirabe/lac-tritriva.jpg', '/images/Attractions/antsirabe/andraikiba.jpg', '/images/highlights/lac.jpg'],
  thermes: ['/images/Attractions/antsirabe/source-thermal.png', '/images/highlights/thermes.jpg'],
  culture: ['/images/Attractions/ambositra/artisanat.jpg', '/images/highlights/artisanat.jpg', '/images/highlights/village.jpg', '/images/highlights/marche.jpg'],
};

const ATTRACTION_KEYWORDS: Record<string, string[]> = {
  tsingy: ['tsingy', 'bemaraha'],
  baobab: ['baobab', 'morondava', 'allée'],
  ile: ['nosy', 'île', 'ile', 'iranja', 'tanikely', 'sainte-marie', 'komba', 'nattes'],
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

const DEFAULT_IMAGES = [
  '/images/Attractions/antananarivo/antananarivo.jpg',
  '/images/Attractions/antananarivo/antananarivo4.png',
  '/images/Attractions/antananarivo/antananarivo-2.jpg',
  '/images/Attractions/diego-suarez/diego-suarez.jpg',
  '/images/Attractions/diego-suarez/diego-suarez-1.jpg',
  '/images/Attractions/fort-dauphin/fort-dauphin.jpg',
  '/images/Attractions/fort-dauphin/fort-dauphin-1.jpg',
  '/images/Attractions/antsirabe/antsirabe.jpg',
  '/images/Attractions/antsirabe/antsirabe-1.jpg',
  '/images/Attractions/antsirabe/antsirabe-2.jpg',
  '/images/Attractions/pangalanes/canal-pangalanes.jpg',
  '/images/Attractions/pangalanes/canal-pangalanes-1.jpg',
  '/images/Attractions/pangalanes/canal-pangalanes-2.jpg',
  '/images/Attractions/pangalanes/canal-pangalanes-3.jpg',
  '/images/highlights/sunset.jpg',
];

function getAttractionImage(name: string, coverImage?: string): string {
  if (coverImage && (coverImage.startsWith('/') || coverImage.startsWith('http'))) {
    return getImageUrl(coverImage) || encodeURI(coverImage);
  }
  const lowerName = name.toLowerCase();
  for (const [category, keywords] of Object.entries(ATTRACTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        const images = ATTRACTION_IMAGES[category];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
        return getImageUrl(images[Math.abs(hash) % images.length]);
      }
    }
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash) + name.charCodeAt(i);
  return getImageUrl(DEFAULT_IMAGES[Math.abs(hash) % DEFAULT_IMAGES.length]);
}

export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const router = useRouter();
  const th = useTrans('home');
  const tc = useTrans('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('attractions');
  const [featuredAttractions, setFeaturedAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [totalAttractions, setTotalAttractions] = useState(0);

  useEffect(() => {
    setIsCheckingAuth(false);
  }, []);

  // Charger les attractions en vedette
  useEffect(() => {
    const fetchAttractions = async () => {
      try {
        const res = await fetch('/api/bons-plans/attractions?limit=6&featured=true');
        if (res.ok) {
          const data = await res.json();
          setFeaturedAttractions(data.attractions || []);
          setTotalAttractions(data.total || 0);
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

    const categoryRoutes: Record<string, string> = {
      attractions: '/bons-plans/attractions',
      hotels: '/bons-plans/hotels',
      restaurants: '/bons-plans/restaurants',
      prestataires: '/bons-plans/prestataires',
    };
    const basePath = categoryRoutes[selectedCategory] || '/bons-plans/attractions';
    router.push(`${basePath}?${params.toString()}`);
  };

  // Loader pendant la vérification auth
  if (isCheckingAuth) {
    return (
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">{tc.loading}</p>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] text-white">
      <Header />

      {/* ===== HERO SECTION ===== */}

      {/* === MOBILE HERO === */}
      <section className="lg:hidden">
        {/* Photo hero — 4x4 is the focal point, must stay sharp */}
        <div className="relative h-[65vh] overflow-hidden">
          <Image
            src="/images/highlights/hero-mobile-collage.jpg"
            alt="4x4 aventure plage Madagascar"
            fill
            priority
            className="object-cover object-bottom contrast-[1.15] saturate-[1.2] brightness-[1.08]"
            sizes="100vw"
          />
          {/* Minimal gradient — only the very bottom 15% for text, 4x4 stays fully visible */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 12%, rgba(0,0,0,0.1) 22%, transparent 30%)' }} />

          {/* Title at very bottom — small footprint to not cover 4x4 */}
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-black text-3xl leading-[0.95] mb-1">
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">{th.heroTitle1}</span>
              {' '}
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">{th.heroTitle2}</span>
            </h1>
            <p className="text-xs text-orange-400 drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)] max-w-[260px] font-semibold">
              {th.heroDesc}
            </p>
          </div>
        </div>

        {/* Search card */}
        <div className="px-4 mt-3 relative z-10">
          <form
            role="search"
            aria-label={th.searchLabel}
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="bg-white rounded-2xl p-4 shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-3 px-2 mb-3">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder={th.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 py-2 outline-none bg-transparent text-gray-900 placeholder:text-gray-400 text-sm"
              />
            </div>

            {/* Category chips - fit all 4 in screen */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { key: 'attractions', icon: Mountain, label: 'Attractions' },
                { key: 'hotels', icon: Building2, label: 'Hôtels' },
                { key: 'restaurants', icon: UtensilsCrossed, label: 'Restos' },
                { key: 'prestataires', icon: Compass, label: 'Services' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center justify-center gap-1 px-2 py-2 rounded-full text-[11px] font-semibold transition-all ${
                    selectedCategory === cat.key
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-transform text-sm"
            >
              {th.searchBtn}
            </button>
          </form>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 px-4 mt-5 mb-6">
          <div className="text-center py-3 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
            <div className="text-lg font-bold text-orange-400">+{totalAttractions}</div>
            <div className="text-[10px] text-slate-400">{th.destinations}</div>
          </div>
          <div className="text-center py-3 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
            <div className="text-lg font-bold text-pink-400">4.8</div>
            <div className="text-[10px] text-slate-400">{th.averageRating}</div>
          </div>
          <div className="text-center py-3 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
            <div className="text-lg font-bold text-purple-400">100%</div>
            <div className="text-[10px] text-slate-400">{th.authentic}</div>
          </div>
        </div>
      </section>

      {/* === DESKTOP HERO === */}
      <section className="hidden lg:flex relative min-h-[80vh] items-center overflow-hidden">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 mb-6"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-400 font-medium">{th.discoverMadagascar}</span>
              </motion.div>

              <h1 className="font-black text-6xl lg:text-7xl leading-[0.95] mb-6">
                <span className="text-white">{th.heroTitle1}</span>
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {th.heroTitle2}
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-8 max-w-lg">
                {th.heroDesc}
                <span className="block mt-2 text-orange-400 font-semibold">{totalAttractions}+ {th.placesToExplore}</span>
              </p>

              <form
                role="search"
                aria-label={th.searchLabel}
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                className="bg-[#1a1a24] p-2 rounded-2xl border border-[#2a2a36] max-w-xl"
              >
                <div className="flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder={th.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 py-3 outline-none bg-transparent text-white placeholder:text-slate-500 min-w-0"
                  />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label={th.category}
                    className="appearance-none px-4 py-3 text-white rounded-xl bg-[#0d1520] cursor-pointer outline-none border border-[#2a2a36] w-36 shrink-0"
                  >
                    <option value="attractions">{th.attractions}</option>
                    <option value="hotels">{th.hotelsLabel}</option>
                    <option value="restaurants">{th.restaurantsLabel}</option>
                    <option value="prestataires">{th.providersLabel}</option>
                  </select>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    aria-label={th.city}
                    className="appearance-none px-4 py-3 text-white rounded-xl bg-[#0d1520] cursor-pointer outline-none border border-[#2a2a36] w-40 shrink-0"
                  >
                    <option value="">{th.allCities}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-5 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all shrink-0 whitespace-nowrap"
                  >
                    {th.searchBtn}
                  </button>
                </div>

              </form>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg">
                <div className="text-center p-4 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
                  <div className="text-2xl font-bold text-orange-400 mb-1">{totalAttractions}+</div>
                  <div className="text-xs text-slate-400">{th.destinations}</div>
                </div>
                <div className="text-center p-4 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
                  <div className="text-2xl font-bold text-pink-400 mb-1">4.8</div>
                  <div className="text-xs text-slate-400">{th.averageRating}</div>
                </div>
                <div className="text-center p-4 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
                  <div className="text-2xl font-bold text-purple-400 mb-1">100%</div>
                  <div className="text-xs text-slate-400">{th.authentic}</div>
                </div>
              </div>
            </motion.div>

            {/* Right: Featured Image Grid */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:grid grid-cols-2 gap-4"
            >
              <div className="space-y-4">
                <div className="relative h-48 rounded-2xl border border-orange-500/30 overflow-hidden">
                  <Image
                    src={getImageUrl('/images/Attractions/baobabs/allee-des-baobabs.jpg')}
                    alt="Allee des Baobabs"
                    fill
                    sizes="(max-width: 1024px) 0vw, 25vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="relative h-64 rounded-2xl border border-pink-500/30 overflow-hidden">
                  <Image
                    src={getImageUrl('/images/Attractions/nosy-be/nosy-be.jpg')}
                    alt="Nosy Be"
                    fill
                    sizes="(max-width: 1024px) 0vw, 25vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="relative h-64 rounded-2xl border border-purple-500/30 overflow-hidden">
                  <Image
                    src={getImageUrl('/images/Attractions/bemaraha/tsingy-bemaraha.jpg')}
                    alt="Tsingy de Bemaraha"
                    fill
                    sizes="(max-width: 1024px) 0vw, 25vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="relative h-48 rounded-2xl border border-blue-500/30 overflow-hidden">
                  <Image
                    src={getImageUrl('/images/Attractions/isalo/parc-isalo.jpg')}
                    alt="Parc National Isalo"
                    fill
                    sizes="(max-width: 1024px) 0vw, 25vw"
                    priority
                    className="object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      <section className="py-16 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Attractions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
            >
              <Link
                href="/bons-plans/attractions"
                className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-orange-500/50 transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Mountain className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{th.attractions}</h2>
                <p className="text-sm text-slate-300 mb-4">
                  {th.attractionsDesc}
                </p>
                <div className="flex items-center text-sm font-medium text-orange-400">
                  {th.explore}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Hôtels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <Link
                href="/bons-plans/hotels"
                className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-pink-500/50 transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{th.hotelsLabel}</h2>
                <p className="text-sm text-slate-300 mb-4">
                  {th.hotelsDesc}
                </p>
                <div className="flex items-center text-sm font-medium text-pink-400">
                  {th.discover}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Restaurants */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
            >
              <Link
                href="/bons-plans/restaurants"
                className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-purple-500/50 transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <UtensilsCrossed className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{th.restaurantsLabel}</h2>
                <p className="text-sm text-slate-300 mb-4">
                  {th.restaurantsDesc}
                </p>
                <div className="flex items-center text-sm font-medium text-purple-400">
                  {th.taste}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>

            {/* Prestataires */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.03 }}
            >
              <Link
                href="/bons-plans/prestataires"
                className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-cyan-500/50 transition-all group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{th.providersLabel}</h2>
                <p className="text-sm text-slate-300 mb-4">
                  {th.providersDesc}
                </p>
                <div className="flex items-center text-sm font-medium text-cyan-400">
                  {th.discover}
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ===== FEATURED ATTRACTIONS ===== */}
      {!isLoading && featuredAttractions.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
                <Compass className="w-4 h-4" />
                {th.mustSeeDestinations}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {th.heroTitle1} <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">{th.heroTitle2}</span>
              </h2>
              <p className="text-slate-300 max-w-2xl mx-auto">
                {th.iconicPlaces}
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAttractions.map((attraction, index) => (
                <motion.div
                  key={attraction.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={`/bons-plans/attractions/${attraction.slug}`}
                    className="block bg-[#1a1a24] rounded-2xl border border-[#2a2a36] overflow-hidden hover:border-orange-500/50 transition-all group h-full"
                  >
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <Image
                        src={getAttractionImage(attraction.name, attraction.coverImage)}
                        alt={attraction.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] via-transparent to-transparent opacity-60" />
                      {attraction.isFeatured && (
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {th.featured}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-2">
                        {attraction.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-slate-400 mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        {attraction.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-white">{attraction.rating.toFixed(1)}</span>
                        <span className="text-sm text-slate-400">({attraction.reviewCount})</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Link
                href="/bons-plans/attractions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all"
              >
                <Mountain className="w-5 h-5" />
                {th.seeAllAttractions}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ===== GALERIE MADAGASCAR ===== */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {th.beautyOfMadagascar.split(th.beautyOf)[0]}<span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">{th.beautyOf}</span>{th.beautyOfMadagascar.split(th.beautyOf)[1]}
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              {th.beautyDesc}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {[
              { src: getImageUrl('/images/Attractions/faune-flore/makimadagascar.png'), label: 'Lémuriens', tall: true },
              { src: getImageUrl('/images/Attractions/faune-flore/cameleon1.png'), label: 'Caméléons' },
              { src: getImageUrl('/images/Attractions/faune-flore/tortue.png'), label: 'Tortues' },
              { src: getImageUrl('/images/Attractions/baobabs/allee-des-baobabs-2.jpg'), label: 'Allée des Baobabs' },
              { src: getImageUrl('/images/Attractions/nosy-be/nosy-be-2.jpg'), label: 'Nosy Be' },
              { src: getImageUrl('/images/Attractions/culture/cultur-riz1.png'), label: 'Rizières' },
              { src: getImageUrl('/images/Attractions/bemaraha/tsingy-bemaraha.jpg'), label: 'Tsingy', tall: true },
              { src: getImageUrl('/images/Attractions/culture/Pousse-pousse_Madagascar.jpg'), label: 'Pousse-pousse' },
              { src: getImageUrl('/images/Attractions/culture/malgache1.png'), label: 'Peuple malgache' },
              { src: getImageUrl('/images/Attractions/isalo/parc-isalo.jpg'), label: 'Parc Isalo' },
              { src: getImageUrl('/images/Attractions/faune-flore/serpent.png'), label: 'Faune endémique' },
              { src: getImageUrl('/images/Attractions/antsirabe/source-thermal.png'), label: 'Sources thermales' },
            ].map((img, idx) => (
              <motion.div
                key={img.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className={`relative overflow-hidden rounded-2xl group ${img.tall ? 'row-span-2 aspect-[3/4]' : 'aspect-square'}`}
              >
                <Image
                  src={img.src}
                  alt={img.label}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute bottom-3 left-3 text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
                  {img.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MAP CTA SECTION ===== */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(219,39,119,0.15) 50%, rgba(249,115,22,0.2) 100%)',
              border: '1px solid rgba(124,58,237,0.3)'
            }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

            <Map className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {th.exploreOnMap}
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              {th.mapDesc}
            </p>
            <Link
              href="/bons-plans/carte"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <Map className="w-5 h-5" />
              {th.openMap}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <TrendingSection />

      {/* CTA Final — Inscription */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Documentary photos strip */}
          <div className="grid grid-cols-3 gap-3 mb-8 rounded-2xl overflow-hidden">
            <div className="relative h-48 sm:h-56">
              <Image src="/images/highlights/Guide.png" alt="Guide malgache montrant la faune locale aux voyageurs" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="relative h-48 sm:h-56">
              <Image src="/images/highlights/artisanat.jpg" alt="Artisane malgache tissant sur un marché local" fill className="object-cover" sizes="33vw" />
            </div>
            <div className="relative h-48 sm:h-56">
              <Image src="/images/highlights/pirogue.jpg" alt="Pirogue de pêcheurs malgaches sur une côte sauvage de Madagascar" fill className="object-cover" sizes="33vw" />
            </div>
          </div>

          {/* CTA Card */}
          <div className="bg-[#FDFBF7] border border-[#E5E1D8] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-sm">
            <div className="relative">
              <Sparkles className="w-10 h-10 text-[#ff6b35] mx-auto mb-4" />

              <h2 className="text-2xl sm:text-4xl font-bold text-[#1a1a2e] mb-3">
                Débloquez les secrets de Madagascar
              </h2>
              <p className="text-[#6B7280] max-w-xl mx-auto mb-8 text-base sm:text-lg">
                Des rencontres authentiques, des paysages à couper le souffle et des guides locaux passionnés vous attendent.
              </p>

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="flex -space-x-3">
                  {['R', 'N', 'H', 'M', 'F'].map((letter, i) => (
                    <div
                      key={letter}
                      className="w-9 h-9 rounded-full border-2 border-[#FDFBF7] flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        background: ['linear-gradient(135deg, #ff6b35, #e55a2b)', 'linear-gradient(135deg, #3b82f6, #2563eb)', 'linear-gradient(135deg, #22c55e, #16a34a)', 'linear-gradient(135deg, #f59e0b, #d97706)', 'linear-gradient(135deg, #ec4899, #db2777)'][i],
                        zIndex: 5 - i,
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-[#FDFBF7] bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] text-[10px] font-bold" style={{ zIndex: 0 }}>
                    +500
                  </div>
                </div>
                <p className="text-sm text-[#6B7280]">
                  Déjà <span className="text-[#1a1a2e] font-semibold">+500 voyageurs et guides locaux</span> nous font confiance
                </p>
              </div>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/register"
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-[#ff6b35] to-pink-500 text-white font-semibold rounded-xl text-lg overflow-hidden transition-shadow hover:shadow-xl hover:shadow-orange-500/30"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-[#ff6b35] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="relative flex items-center gap-2">
                      S&apos;inscrire gratuitement
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </motion.div>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#D1D5DB] text-[#374151] font-medium rounded-xl hover:bg-[#F3F4F6] transition-all"
                >
                  J&apos;ai déjà un compte
                </Link>
              </div>

              {/* Réassurance */}
              <p className="text-[#9CA3AF] text-xs mt-6 flex items-center justify-center gap-2 flex-wrap">
                <span>Pas de carte bancaire requise</span>
                <span className="text-[#D1D5DB]">•</span>
                <span>Inscription en 30 secondes</span>
                <span className="text-[#D1D5DB]">•</span>
                <span>100% gratuit</span>
              </p>
              <p className="text-[#9CA3AF] text-[10px] mt-2">
                +175 établissements référencés — Hôtels, restaurants, attractions et prestataires à Madagascar
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Prestataires */}
      <section className="bg-gradient-to-r from-[#1a1a24] to-[#0a0a0f] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Vous êtes un professionnel du tourisme ?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Inscrivez gratuitement votre hôtel, restaurant ou activité sur Mada Spot et touchez des milliers de voyageurs.
            </p>
          </div>
          <Link
            href="/inscrire-etablissement"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            Inscrire mon établissement
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
