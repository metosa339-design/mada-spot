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
  Building2,
  Mountain,
  UtensilsCrossed,
  Users,
  Shield,
  Headphones,
  CalendarCheck,
  CreditCard,
  Compass,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';
import { getImageUrl } from '@/lib/image-url';
import { MADAGASCAR_CITIES_BY_PROVINCE } from '@/lib/data/madagascar-locations';

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

// Avis prestataires / voyageurs
const REVIEWS = [
  { name: 'Jérôme Andriam.', role: 'Tour-opérateur', city: 'Sambava', stars: 5, avatar: 'https://i.pravatar.cc/100?img=12', text: 'SAVA-MAD Tours a reçu 3 réservations en une semaine après notre inscription. On a quasi doublé notre CA de mars. Mada Spot a changé la donne.' },
  { name: 'Lalao Rabe', role: 'Hôtelière', city: 'Antsirabe', stars: 5, avatar: 'https://i.pravatar.cc/100?img=45', text: 'Hôtel Trianon a triplé ses réservations depuis qu\'on est sur la plateforme. Et c\'est gratuit, je recommande à tous les hôteliers.' },
  { name: 'Rajaonarivelo H.', role: 'Lodge Ocean Beach', city: 'Nosy Be', stars: 5, avatar: 'https://i.pravatar.cc/100?img=33', text: 'Ocean Beach Sakatia est visible par des touristes du monde entier. 91 vues en un mois, 2 familles ont déjà réservé pour Pâques.' },
  { name: 'Tiana Razafindra.', role: 'Restaurant Le Récif', city: 'Toamasina', stars: 5, avatar: 'https://i.pravatar.cc/100?img=23', text: 'Les touristes viennent au resto avec le screenshot de notre fiche. C\'est devenu notre meilleure carte de visite, vraiment.' },
  { name: 'Volamboahangy R.', role: 'Guide officielle', city: 'Fianarantsoa', stars: 5, avatar: 'https://i.pravatar.cc/100?img=47', text: 'Guide depuis 12 ans, j\'ai enfin une vraie vitrine en ligne. 4 réservations en 3 semaines pour la rando Andringitra.' },
  { name: 'Haja Rakotonirina', role: 'TourDAlaotra', city: 'Ambatondrazaka', stars: 4, avatar: 'https://i.pravatar.cc/100?img=15', text: 'TourDAlaotra a atteint 83 vues. Les voyageurs nous trouvent facilement. J\'aimerais juste gérer mes tarifs plus rapidement.' },
  { name: 'Manantsoa A.', role: 'Pension de famille', city: 'Diego Suarez', stars: 5, avatar: 'https://i.pravatar.cc/100?img=11', text: 'Petite pension à Ramena. On a touché des voyageurs européens qu\'on n\'aurait jamais eus via Booking. Zéro commission !' },
  { name: 'Patrick Ravelo.', role: 'Agence Boarding Pass', city: 'Antananarivo', stars: 5, avatar: 'https://i.pravatar.cc/100?img=8', text: 'La plateforme malgache qu\'on attendait depuis des années. Plus besoin de tout faire via WhatsApp ou Facebook.' },
  { name: 'Soa Andriana.', role: 'Lodge Katsepy', city: 'Mahajanga', stars: 5, avatar: 'https://i.pravatar.cc/100?img=49', text: 'Notre lodge a accueilli 5 groupes français en avril grâce à Mada Spot. Concret, gratuit, 100% local. Je signe à 2 mains.' },
  { name: 'Mialy R.', role: 'Pirogue & excursions', city: 'Morondava', stars: 5, avatar: 'https://i.pravatar.cc/100?img=44', text: 'Tour de la côte ouest en pirogue : 30 vues la première semaine, 88 le mois suivant. Les chiffres parlent.' },
  { name: 'Nivo R.', role: 'Restaurant La Varangue', city: 'Antananarivo', stars: 5, avatar: 'https://i.pravatar.cc/100?img=20', text: 'Les avis clients sur notre fiche convertissent en vraies réservations. On a même eu un journaliste de Routard via la plateforme.' },
  { name: 'Hery Rasoanaivo', role: 'Chauffeur-guide', city: 'Antsiranana', stars: 4, avatar: 'https://i.pravatar.cc/100?img=14', text: 'Mon profil m\'a apporté 7 missions en 2 mois. Surtout des touristes français et italiens qui veulent un guide local.' },
  { name: 'Fanja R.', role: 'Hôtel des Thermes', city: 'Antsirabe', stars: 5, avatar: 'https://i.pravatar.cc/100?img=32', text: 'Nous étions invisibles sur Google. Maintenant on apparaît dans les premiers résultats pour Antsirabe, super.' },
  { name: 'Rivo Andrianasolo', role: 'Plongée Nautilus', city: 'Nosy Be', stars: 5, avatar: 'https://i.pravatar.cc/100?img=68', text: 'Centre de plongée : 12 réservations confirmées via Mada Spot ce trimestre. Les voyageurs comparent et choisissent vite.' },
  { name: 'Sahondra N.', role: 'Auberge Vakinakaratra', city: 'Antsirabe', stars: 5, avatar: 'https://i.pravatar.cc/100?img=24', text: 'Site très simple à utiliser, j\'ai mis ma fiche en 5 minutes sans connaissances techniques. Bravo l\'équipe.' },
  { name: 'Tahiry Razanamalala', role: 'Transferts aéroport', city: 'Antananarivo', stars: 4, avatar: 'https://i.pravatar.cc/100?img=51', text: 'Service de navette aéroport. 22 contacts en avril, 8 transferts effectués. Bon retour sur le temps investi à créer la fiche.' },
  { name: 'Lova Rasamoela', role: 'Restaurant Chez Mariette', city: 'Mahajanga', stars: 5, avatar: 'https://i.pravatar.cc/100?img=29', text: 'Le menu PDF qu\'on a uploadé est consulté plusieurs fois par jour. Les clients arrivent en sachant déjà ce qu\'ils veulent.' },
  { name: 'Naina Ratsimba.', role: 'Lodge Andasibe', city: 'Andasibe', stars: 5, avatar: 'https://i.pravatar.cc/100?img=53', text: 'Pour les groupes d\'observation des lémuriens, on est devenus la référence. Une vingtaine de réservations sur 2 mois.' },
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
  const _th = useTrans('home');
  void _th;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'hotels' | 'restaurants' | 'attractions' | 'prestataires'>('hotels');
  const [featuredAttractions, setFeaturedAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const attRes = await fetch('/api/bons-plans/attractions?limit=4&featured=true');
        if (attRes.ok) {
          const data = await attRes.json();
          setFeaturedAttractions(data.attractions || []);
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
    <main id="main-content" className="min-h-screen bg-white text-[#1a1a2e]">
      <Header />

      {/* ===== HERO ===== */}
      <section className="relative">
        <div className="relative h-[60vh] sm:h-[68vh] lg:h-[75vh] overflow-hidden">
          <Image
            src="/images/highlights/hero-pool-madagascar.jpg"
            alt="Madagascar"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60" />

          <div className="absolute inset-0 flex items-start pt-24 sm:pt-32 lg:pt-40">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <h1
                  style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] mb-3"
                >
                  Voyagez plus,<br />découvrez Madagascar
                </h1>
                <p
                  style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
                  className="text-base sm:text-lg"
                >
                  Hôtels, restaurants, activités et guides locaux à portée de clic
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search card sous le hero, plus d'overlap (cachait le sous-titre) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 relative z-10">
          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
              {[
                { key: 'hotels' as const, icon: Building2, label: 'Hôtels' },
                { key: 'restaurants' as const, icon: UtensilsCrossed, label: 'Restos' },
                { key: 'attractions' as const, icon: Mountain, label: 'Activités' },
                { key: 'prestataires' as const, icon: Users, label: 'Guides' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'border-[#ff6b35] text-[#ff6b35]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Fields */}
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
              <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Destination</p>
                  <input
                    type="text"
                    placeholder="Où voulez-vous aller ?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full outline-none text-sm font-semibold text-[#1a1a2e] placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl">
                <Compass className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">Ville</p>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full outline-none text-sm font-semibold text-[#1a1a2e] bg-transparent appearance-none cursor-pointer"
                  >
                    <option value="">Toutes les villes</option>
                    {MADAGASCAR_CITIES_BY_PROVINCE.map((p) => (
                      <optgroup key={p.province} label={p.province}>
                        {p.cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{ color: '#ffffff' }}
                className="px-8 py-3 bg-[#1a1a2e] font-semibold rounded-xl hover:bg-[#2a2a3e] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ===== DESTINATIONS POPULAIRES ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]">Destinations populaires</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Nosy Be', region: 'Plages', img: '/images/Attractions/nosy-be/nosy-be-2.jpg' },
            { name: 'Antananarivo', region: 'Capitale', img: '/images/Attractions/antananarivo/antananarivo.jpg' },
            { name: 'Tsingy', region: 'Aventure', img: '/images/Attractions/bemaraha/tsingy-bemaraha.jpg' },
            { name: 'Isalo', region: 'Randonnée', img: '/images/Attractions/isalo/parc-isalo.jpg' },
            { name: 'Diego Suarez', region: 'Baies', img: '/images/Attractions/diego-suarez/diego-suarez.jpg' },
            { name: 'Sainte-Marie', region: 'Île', img: '/images/Attractions/sainte-marie/ile-sainte-marie.jpg' },
          ].map((dest) => (
            <Link key={dest.name} href={`/attractions?search=${encodeURIComponent(dest.name)}`} className="group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2">
                <Image
                  src={dest.img}
                  alt={dest.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <p className="font-semibold text-sm text-[#1a1a2e]">{dest.name}</p>
              <p className="text-xs text-gray-500">{dest.region}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== HÉBERGEMENTS / LIEUX RECOMMANDÉS ===== */}
      {!isLoading && featuredAttractions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]">Lieux recommandés</h2>
            <Link href="/attractions" className="text-sm font-semibold text-[#ff6b35] hover:underline flex items-center gap-1">
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredAttractions.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/attractions/${a.slug}`} className="group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 border border-gray-100">
                  <Image
                    src={getAttractionImage(a.name, a.coverImage)}
                    alt={a.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-semibold text-sm sm:text-base mb-1 text-[#1a1a2e] line-clamp-1">{a.name}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-2">{a.city}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm font-semibold text-[#1a1a2e]">{a.rating?.toFixed(1) || '—'}</span>
                  <span className="text-xs text-gray-400">({a.reviewCount})</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== OFFRES EXCLUSIVES (banner) ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="relative rounded-3xl overflow-hidden min-h-[220px] sm:min-h-[280px] flex items-center">
          <Image
            src="/images/Attractions/nosy-be/nosy-be.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Gradient sombre cote gauche (zone texte) pour lisibilite,
              transparent cote droit pour laisser voir la photo */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10 sm:from-black/85 sm:via-black/55 sm:to-transparent" />
          <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-6">
            <div className="max-w-xl">
              <p className="text-sm font-semibold mb-2 uppercase tracking-wider" style={{ color: '#fb923c' }}>
                Inscription gratuite
              </p>
              <h3 style={{ color: '#ffffff' }} className="text-2xl sm:text-3xl font-bold mb-3">
                Référencez votre établissement <span style={{ color: '#fb923c' }}>gratuitement</span>
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.85)' }} className="text-sm sm:text-base">
                Hôtels, restaurants, guides : touchez plus de 7 700 visiteurs par mois
              </p>
            </div>
            <Link
              href="/inscrire-etablissement"
              style={{ color: '#ffffff' }}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b35] font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              Découvrir
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== RÉASSURANCE ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { icon: CreditCard, title: 'Paiement sécurisé', desc: 'Transactions 100% protégées' },
            { icon: CalendarCheck, title: 'Réservation 24/7', desc: 'À tout moment, n\'importe où' },
            { icon: Headphones, title: 'Assistance dédiée', desc: 'Une équipe à votre écoute' },
            { icon: Shield, title: '100% gratuit', desc: 'Pas de commission cachée' },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-start gap-2 p-4 sm:p-5 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100">
                <item.icon className="w-5 h-5 text-[#1a1a2e]" />
              </div>
              <h4 className="font-semibold text-sm text-[#1a1a2e]">{item.title}</h4>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CE QUE NOS CLIENTS DISENT (auto-scroll rapide) ===== */}
      <section className="mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e]">Ce que nos clients disent</h2>
          <p className="text-sm text-gray-500 mt-1">{REVIEWS.length} prestataires nous font confiance</p>
        </div>
        <div className="relative overflow-hidden">
          {/* Fades sur les bords pour effet pro */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent z-10" />

          <motion.div
            className="flex gap-4 will-change-transform py-2"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            {[...REVIEWS, ...REVIEWS].map((review, i) => (
              <div
                key={`${review.name}-${i}`}
                className="shrink-0 w-80 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-orange-100"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[#1a1a2e] truncate">{review.name}</p>
                    <p className="text-xs text-gray-500 truncate">{review.role} · {review.city}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4">&quot;{review.text}&quot;</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== NEWSLETTER ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-20">
        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 sm:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-[#1a1a2e]">
              Restez informé des meilleurs bons plans
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Recevez nos meilleures offres et inspirations voyage directement dans votre boîte mail
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre adresse e-mail"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#ff6b35] transition-colors text-sm"
              />
              <button
                type="submit"
                style={{ color: '#ffffff' }}
                className="px-6 py-3 bg-[#1a1a2e] font-semibold rounded-xl hover:bg-[#2a2a3e] transition-colors"
              >
                S&apos;abonner
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />

      {/* Bottom Nav mobile */}
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
      <div className="lg:hidden h-16" />
    </main>
  );
}
