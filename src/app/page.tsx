'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Building2,
  Mountain,
  Compass,
  UtensilsCrossed,
  Map,
  Users,
  Menu,
  User,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TrendingSection from '@/components/TrendingSection';
import { useTrans } from '@/i18n';
import { getImageUrl } from '@/lib/image-url';
import { ScrollReveal, TextReveal, CountUp, GlowCard } from '@/components/ui/animations';
import { StaggerParent, StaggerChild } from '@/components/ui/animations/StaggerChildren';

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
  'Ambanja',
  'Ambatondrazaka',
  'Ambilobe',
  'Ambositra',
  'Ambovombe',
  'Anakao',
  'Andasibe',
  'Andapa',
  'Antananarivo',
  'Antalaha',
  'Antsirabe',
  'Bekopaka',
  'Diego Suarez',
  'Farafangana',
  'Fianarantsoa',
  'Fort Dauphin',
  'Foulpointe',
  'Ifaty',
  'Isalo',
  'Joffreville',
  'Mahajanga',
  'Majunga',
  'Manakara',
  'Manambato',
  'Mananjary',
  'Maroantsetra',
  'Miandrivazo',
  'Moramanga',
  'Morondava',
  'Nosy Be',
  'Ramena',
  'Ranohira',
  'Ranomafana',
  'Sainte-Marie',
  'Sambava',
  'Toamasina',
  'Toliara',
  'Tulear',
  'Vatomandry',
  'Vohemar',
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('attractions');
  const [featuredAttractions, setFeaturedAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ establishments: 190, attractions: 45, views: 7700 });

  // Charger les attractions en vedette + stats reelles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, statsRes] = await Promise.all([
          fetch('/api/bons-plans/attractions?limit=6&featured=true'),
          fetch('/api/health'),
        ]);
        if (attRes.ok) {
          const data = await attRes.json();
          setFeaturedAttractions(data.attractions || []);
          if (data.total > 0) setStats(s => ({ ...s, attractions: data.total }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCity) params.set('city', selectedCity);

    const categoryRoutes: Record<string, string> = {
      attractions: '/attractions',
      hotels: '/hotels',
      restaurants: '/restaurants',
      prestataires: '/prestataires',
    };
    const basePath = categoryRoutes[selectedCategory] || '/attractions';
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <main id="main-content" className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header — hidden on mobile homepage, visible on desktop */}
      <div className="hidden lg:block">
        <Header />
      </div>

      {/* ===== HERO SECTION ===== */}

      {/* === MOBILE HERO (Style Voyago — plein ecran) === */}
      <section className="lg:hidden bg-[#f5f7fa]">
        {/* Hero PLEIN ECRAN */}
        <div className="relative h-[35vh] overflow-hidden">
          <Image
            src="/images/highlights/hero-pool-madagascar.jpg"
            alt="Piscine lodge Madagascar"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

          {/* Menu hamburger + Notif — directement sur la photo */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-5 z-30">
            <button className="p-1 text-white" onClick={() => {
              const menuBtn = document.querySelector('[aria-label*="menu"]') as HTMLButtonElement;
              if (menuBtn) menuBtn.click();
            }}>
              <Menu className="w-7 h-7 drop-shadow-lg" />
            </button>
            <Link href="/client" className="relative">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>

          {/* Titre hero — en bas a gauche */}
          <div className="absolute bottom-14 left-5 right-5 z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <h1 className="text-[26px] text-white leading-[1.15] mb-1.5">
              <span className="font-bold">Trouvez votre</span><br />
              <span className="italic font-bold">prochain voyage</span>
            </h1>
            <p className="text-[13px] text-white font-medium">
              Hotels, guides et activites a Madagascar
            </p>
          </div>
        </div>

        {/* Search card — chevauche le hero, coins arrondis en haut */}
        <div className="px-4 -mt-14 relative z-20">
          <form
            role="search"
            aria-label={th.searchLabel}
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="bg-white rounded-t-3xl rounded-b-2xl shadow-2xl shadow-black/15 overflow-hidden"
          >
            {/* Category tabs — style Voyago bleu */}
            <div className="flex border-b border-gray-100">
              {[
                { key: 'hotels', icon: Building2, label: 'Hotels' },
                { key: 'attractions', icon: Mountain, label: 'Activites' },
                { key: 'restaurants', icon: UtensilsCrossed, label: 'Restos' },
                { key: 'prestataires', icon: Users, label: 'Guides' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold transition-all border-b-[3px] ${
                    selectedCategory === cat.key
                      ? 'border-[#ff6b35] text-[#ff6b35]'
                      : 'border-transparent text-gray-400'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3">
              {/* Destination */}
              <div className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Ou allez-vous ?</p>
                  <input
                    type="text"
                    placeholder="Nosy Be, Isalo, Tana..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full outline-none text-gray-900 text-sm font-semibold placeholder:text-gray-300 placeholder:font-normal mt-0.5"
                  />
                </div>
              </div>

              {/* Ville */}
              <div className="flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl">
                <Compass className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Ville</p>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full outline-none text-gray-900 text-sm font-semibold bg-transparent mt-0.5 appearance-none"
                  >
                    <option value="">Toutes les villes</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#ff6b35] text-white font-bold rounded-xl active:scale-[0.98] transition-transform text-[15px]"
              >
                Rechercher
              </button>
            </div>
          </form>
        </div>

        {/* === Destinations populaires (style Voyago - grandes cartes) === */}
        <div className="mt-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Destinations populaires</h2>
            <Link href="/attractions" className="text-sm text-[#ff6b35] font-semibold">Voir tout</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {[
              { name: 'Nosy Be', sub: 'Plages', img: '/images/Attractions/nosy-be/nosy-be-2.jpg', icon: '🏖️' },
              { name: 'Tsingy', sub: 'Aventure', img: '/images/Attractions/bemaraha/tsingy-bemaraha.jpg', icon: '🏔️' },
              { name: 'Isalo', sub: 'Randonnee', img: '/images/Attractions/isalo/parc-isalo.jpg', icon: '🥾' },
              { name: 'Diego', sub: 'Baie', img: '/images/Attractions/diego-suarez/diego-suarez.jpg', icon: '⛵' },
              { name: 'Baobabs', sub: 'Iconique', img: '/images/Attractions/baobabs/allee-des-baobabs-1.jpg', icon: '🌳' },
              { name: 'Andasibe', sub: 'Lemuriens', img: '/images/highlights/indri.jpg', icon: '🐒' },
            ].map((dest) => (
              <Link key={dest.name} href={`/attractions?search=${dest.name}`} className="shrink-0 w-40 group">
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image src={dest.img} alt={dest.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="160px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute top-3 left-3 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-base">{dest.icon}</span>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-bold text-white text-base">{dest.name}</p>
                    <p className="text-xs text-white/70">{dest.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* === Hebergements recommandes === */}
        {!isLoading && featuredAttractions.length > 0 && (
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Lieux recommandes</h2>
              <Link href="/attractions" className="text-xs text-[#ff6b35] font-semibold">Voir plus →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
              {featuredAttractions.slice(0, 6).map((a) => (
                <Link key={a.id} href={`/attractions/${a.slug}`} className="shrink-0 w-44 group">
                  <div className="relative h-36 rounded-2xl overflow-hidden mb-2 border border-gray-100">
                    <Image
                      src={getAttractionImage(a.name, a.coverImage)}
                      alt={a.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="176px"
                    />
                  </div>
                  <p className="font-bold text-gray-900 text-sm line-clamp-1">{a.name}</p>
                  <p className="text-xs text-gray-500 mb-1">{a.city}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-semibold text-gray-900">{a.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">({a.reviewCount})</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* === Banniere promo === */}
        <div className="mx-4 mt-6 rounded-2xl overflow-hidden relative h-32">
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] to-[#ff6b35]" />
          <div className="relative p-5 flex items-center justify-between h-full">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Inscription gratuite</h3>
              <p className="text-white/70 text-xs mb-2">Referencez votre etablissement</p>
              <Link href="/inscrire-etablissement" className="inline-block px-4 py-1.5 bg-white text-[#1a1a2e] text-xs font-bold rounded-lg">
                S&apos;inscrire
              </Link>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                <p className="text-white text-xs">Deja</p>
                <p className="text-white font-black text-2xl">190+</p>
                <p className="text-white/70 text-[10px]">etablissements</p>
              </div>
            </div>
          </div>
        </div>

        {/* === Reassurance === */}
        <div className="grid grid-cols-2 gap-3 px-4 mt-6">
          {[
            { icon: '🔍', title: 'Recherche facile', desc: 'Trouvez en 2 clics' },
            { icon: '📱', title: 'Contact direct', desc: 'WhatsApp & telephone' },
            { icon: '⭐', title: 'Avis verifies', desc: 'Notes authentiques' },
            { icon: '🆓', title: '100% gratuit', desc: 'Pas de commission' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="font-bold text-gray-900 text-xs">{item.title}</p>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* === Comment ca marche (mobile) === */}
        <div className="px-4 mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Comment ca marche</h2>
          <div className="space-y-3">
            {[
              { num: '1', title: 'Cherchez', desc: 'Tapez une destination ou un type d\'etablissement', color: 'bg-[#ff6b35]' },
              { num: '2', title: 'Comparez', desc: 'Photos, avis et prix pour faire le bon choix', color: 'bg-pink-500' },
              { num: '3', title: 'Contactez', desc: 'Appelez ou ecrivez directement par WhatsApp', color: 'bg-purple-500' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <div className={`w-10 h-10 ${step.color} rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {step.num}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === Ce que nos clients disent === */}
        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Ce que nos clients disent</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {[
              { name: 'Jerome A.', city: 'Sambava', stars: 5, text: 'SAVA-MAD Tours a recu 3 reservations en une semaine grace a Mada Spot. Excellent service !' },
              { name: 'Rajaonarivelo', city: 'Nosy Be', stars: 5, text: 'Ocean Beach Sakatia est maintenant visible par des touristes du monde entier. 91 vues en un mois !' },
              { name: 'Haja R.', city: 'Ambatondrazaka', stars: 4, text: 'TourDAlaotra a atteint 83 vues. Les voyageurs nous trouvent facilement maintenant.' },
            ].map((review) => (
              <div key={review.name} className="shrink-0 w-64 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{review.name}</p>
                    <p className="text-xs text-gray-500">{review.city}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">&quot;{review.text}&quot;</p>
              </div>
            ))}
          </div>
        </div>

        {/* === Newsletter === */}
        <div className="mx-4 mt-8 mb-8 rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35] to-[#ff1493]" />
          <div className="relative p-5">
            <h3 className="text-white font-bold text-base mb-1">Newsletter</h3>
            <p className="text-white/80 text-xs mb-3">Recevez nos meilleures offres et inspirations voyage</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre adresse e-mail"
                className="flex-1 px-3 py-2.5 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 outline-none"
              />
              <button className="px-4 py-2.5 bg-[#1a1a2e] text-white text-xs font-bold rounded-lg shrink-0">
                S&apos;abonner
              </button>
            </div>
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
                <span className="block mt-2 text-orange-400 font-semibold">190+ etablissements a decouvrir</span>
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
                  <div className="text-2xl font-bold text-orange-400 mb-1">190+</div>
                  <div className="text-xs text-slate-400">Etablissements</div>
                </div>
                <div className="text-center p-4 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
                  <div className="text-2xl font-bold text-pink-400 mb-1">4.8</div>
                  <div className="text-xs text-slate-400">{th.averageRating}</div>
                </div>
                <div className="text-center p-4 bg-[#1a1a24] rounded-xl border border-[#2a2a36]">
                  <div className="text-2xl font-bold text-purple-400 mb-1">7 700+</div>
                  <div className="text-xs text-slate-400">Visiteurs/mois</div>
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
          <StaggerParent staggerDelay={0.12} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Attractions */}
            <StaggerChild>
              <GlowCard className="h-full rounded-2xl" glowColor="rgba(249, 115, 22, 0.15)">
                <Link
                  href="/attractions"
                  className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-orange-500/50 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg">
                    <Mountain className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{th.attractions}</h2>
                  <p className="text-sm text-slate-300 mb-4">
                    {th.attractionsDesc}
                  </p>
                  <div className="flex items-center text-sm font-medium text-orange-400">
                    {th.explore}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </GlowCard>
            </StaggerChild>

            {/* Hôtels */}
            <StaggerChild>
              <GlowCard className="h-full rounded-2xl" glowColor="rgba(236, 72, 153, 0.15)">
                <Link
                  href="/hotels"
                  className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-pink-500/50 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{th.hotelsLabel}</h2>
                  <p className="text-sm text-slate-300 mb-4">
                    {th.hotelsDesc}
                  </p>
                  <div className="flex items-center text-sm font-medium text-pink-400">
                    {th.discover}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </GlowCard>
            </StaggerChild>

            {/* Restaurants */}
            <StaggerChild>
              <GlowCard className="h-full rounded-2xl" glowColor="rgba(139, 92, 246, 0.15)">
                <Link
                  href="/restaurants"
                  className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-purple-500/50 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg">
                    <UtensilsCrossed className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{th.restaurantsLabel}</h2>
                  <p className="text-sm text-slate-300 mb-4">
                    {th.restaurantsDesc}
                  </p>
                  <div className="flex items-center text-sm font-medium text-purple-400">
                    {th.taste}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </GlowCard>
            </StaggerChild>

            {/* Prestataires */}
            <StaggerChild>
              <GlowCard className="h-full rounded-2xl" glowColor="rgba(6, 182, 212, 0.15)">
                <Link
                  href="/prestataires"
                  className="block h-full bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] hover:border-cyan-500/50 transition-all group"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{th.providersLabel}</h2>
                  <p className="text-sm text-slate-300 mb-4">
                    {th.providersDesc}
                  </p>
                  <div className="flex items-center text-sm font-medium text-cyan-400">
                    {th.discover}
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </GlowCard>
            </StaggerChild>

          </StaggerParent>
        </div>
      </section>

      {/* ===== FEATURED ATTRACTIONS ===== */}
      {!isLoading && featuredAttractions.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
                  <Compass className="w-4 h-4" />
                  {th.mustSeeDestinations}
                </div>
              </ScrollReveal>
              <TextReveal as="h2" delay={0.1} className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {th.heroTitle1} <span className="text-gradient-animate">{th.heroTitle2}</span>
              </TextReveal>
              <TextReveal as="p" delay={0.2} className="text-slate-300 max-w-2xl mx-auto">
                {th.iconicPlaces}
              </TextReveal>
            </div>

            <StaggerParent staggerDelay={0.1} className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
              {featuredAttractions.map((attraction) => (
                <StaggerChild key={attraction.id}>
                  <Link
                    href={`/attractions/${attraction.slug}`}
                    className="block relative rounded-2xl overflow-hidden group card-hover aspect-[3/4] sm:aspect-[4/3]"
                  >
                    {/* Image de fond */}
                    <Image
                      src={getAttractionImage(attraction.name, attraction.coverImage)}
                      alt={attraction.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {/* Badge featured */}
                    {attraction.isFeatured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-[10px] sm:text-xs font-medium flex items-center gap-1 backdrop-blur-sm">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="hidden sm:inline">{th.featured}</span>
                        </span>
                      </div>
                    )}
                    {/* Texte overlay en bas */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                      <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-orange-400 transition-colors line-clamp-1 mb-1">
                        {attraction.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-white/70">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{attraction.city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-white text-xs sm:text-sm">{attraction.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </StaggerChild>
              ))}
            </StaggerParent>

            <ScrollReveal delay={0.3} className="text-center mt-10">
              <Link
                href="/attractions"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all btn-shine"
              >
                <Mountain className="w-5 h-5" />
                {th.seeAllAttractions}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ===== GALERIE MADAGASCAR ===== */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <TextReveal as="h2" className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {th.beautyOfMadagascar.split(th.beautyOf)[0]}<span className="text-gradient-animate">{th.beautyOf}</span>{th.beautyOfMadagascar.split(th.beautyOf)[1]}
            </TextReveal>
            <TextReveal as="p" delay={0.15} className="text-slate-300 max-w-2xl mx-auto">
              {th.beautyDesc}
            </TextReveal>
          </div>

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
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 text-white text-xs sm:text-sm font-semibold sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
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
          <ScrollReveal scale>
          <div
            className="rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden glow-hover"
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
              href="/carte"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <Map className="w-5 h-5" />
              {th.openMap}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          </ScrollReveal>
        </div>
      </section>

      <TrendingSection />

      {/* CTA Final — Inscription */}
      <section className="py-16 px-4">
        <ScrollReveal scale>
          <div className="max-w-5xl mx-auto">
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
                  {[
                    '/images/highlights/baleine.jpg',
                    '/images/Attractions/baobabs/allee-des-baobabs-1.jpg',
                    '/images/Attractions/diego-suarez/diego-suarez.jpg',
                    '/images/highlights/randonnee.jpg',
                    '/images/highlights/biodiversite.jpg',
                  ].map((src, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[#FDFBF7] overflow-hidden"
                      style={{ zIndex: 5 - i }}
                    >
                      <Image src={src} alt="" width={40} height={40} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-[#FDFBF7] bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold" style={{ zIndex: 0 }}>
                    190+
                  </div>
                </div>
                <p className="text-sm text-[#6B7280]">
                  <span className="text-[#1a1a2e] font-semibold">190+ etablissements</span> references par des pros du tourisme
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
                +190 etablissements references — Hotels, restaurants, attractions et prestataires a Madagascar
              </p>
            </div>
          </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ===== COMMENT CA MARCHE ===== */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <TextReveal as="h2" className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            Comment ca <span className="text-gradient-animate">marche</span> ?
          </TextReveal>
          <StaggerParent staggerDelay={0.15} className="grid sm:grid-cols-3 gap-8">
            <StaggerChild className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">1</div>
              <h3 className="text-lg font-bold text-white mb-2">Cherchez</h3>
              <p className="text-sm text-slate-400">Tapez une destination, un hotel ou une activite. Filtrez par ville, prix ou categorie.</p>
            </StaggerChild>
            <StaggerChild className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">2</div>
              <h3 className="text-lg font-bold text-white mb-2">Comparez</h3>
              <p className="text-sm text-slate-400">Consultez les photos, avis et tarifs. Trouvez le prestataire qui correspond a vos envies.</p>
            </StaggerChild>
            <StaggerChild className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">3</div>
              <h3 className="text-lg font-bold text-white mb-2">Contactez</h3>
              <p className="text-sm text-slate-400">Appelez ou ecrivez directement par WhatsApp. Pas d'intermediaire, pas de commission.</p>
            </StaggerChild>
          </StaggerParent>
        </div>
      </section>

      {/* CTA Prestataires */}
      <section className="bg-gradient-to-r from-[#1a1a24] to-[#0a0a0f] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Vous etes un professionnel du tourisme ?
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Inscrivez gratuitement votre hotel, restaurant ou activite sur Mada Spot et touchez des milliers de voyageurs.
            </p>
          </div>
          <Link
            href="/inscrire-etablissement"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all btn-shine"
          >
            Inscrire mon etablissement
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />

      {/* === Bottom Navigation Mobile (style app) === */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: '🏠', label: 'Accueil', href: '/', active: true },
            { icon: '🔍', label: 'Recherche', href: '/hotels', active: false },
            { icon: '🏝️', label: 'Destinations', href: '/attractions', active: false },
            { icon: '📖', label: 'Blog', href: '/blog', active: false },
            { icon: '👤', label: 'Profil', href: '/client', active: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                item.active ? 'text-[#ff6b35]' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      {/* Spacer for bottom nav */}
      <div className="lg:hidden h-16" />
    </main>
  );
}
