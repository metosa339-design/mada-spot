'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Shield,
  Headphones,
  CalendarCheck,
  CreditCard,
  Home as HomeIcon,
  Search as SearchIcon,
  Compass,
  BookOpen as BlogIcon,
  User as UserIcon,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroClean from '@/components/home/HeroClean';
import { useTrans } from '@/i18n';
import { getImageUrl } from '@/lib/image-url';

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { y: 24, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

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
  baobab: ['/images/Attractions/baobabs/allee-des-baobabs.jpg', '/images/highlights/baobabs.jpg'],
  ile: ['/images/Attractions/nosy-be/nosy-be.jpg', '/images/Attractions/sainte-marie/ile-sainte-marie.jpg'],
  plage: ['/images/Attractions/ifaty/ifaty-tulear.jpg', '/images/highlights/plage.jpg'],
  montagne: ['/images/Attractions/divers/massif-andringitra.jpg', '/images/highlights/montagne.jpg'],
  parc: ['/images/Attractions/isalo/parc-isalo.jpg', '/images/Attractions/andasibe/andasibe-mantadia.jpg'],
  reserve: ['/images/Attractions/divers/reserve-anja.jpg', '/images/Attractions/ankarana/ankarana.jpg'],
  train: ['/images/highlights/train.jpg', '/images/Attractions/fianarantsoa/fianarantsoa.jpg'],
};

const ATTRACTION_KEYWORDS: Record<string, string[]> = {
  tsingy: ['tsingy', 'bemaraha'],
  baobab: ['baobab', 'morondava', 'allée'],
  ile: ['nosy', 'île', 'ile', 'iranja', 'sainte-marie'],
  plage: ['plage', 'beach', 'ifaty', 'tuléar', 'toliara'],
  montagne: ['montagne', 'andringitra', 'massif', 'isalo'],
  parc: ['parc', 'ranomafana', 'andasibe', 'masoala', 'mantadia'],
  reserve: ['réserve', 'reserve', 'anja', 'berenty', 'ankarana'],
  train: ['train', 'fce', 'fianarantsoa'],
};

const DEFAULT_IMAGES = [
  '/images/Attractions/antananarivo/antananarivo.jpg',
  '/images/Attractions/diego-suarez/diego-suarez.jpg',
  '/images/Attractions/antsirabe/antsirabe.jpg',
  '/images/highlights/sunset.jpg',
];

// Avis prestataires / voyageurs (sélection)
const REVIEWS = [
  { name: 'Jérôme Andriam.', role: 'Tour-opérateur', city: 'Sambava', stars: 5, text: 'SAVA-MAD Tours a reçu 3 réservations en une semaine après notre inscription. On a quasi doublé notre CA de mars. Mada Spot a changé la donne.' },
  { name: 'Lalao Rabe', role: 'Hôtelière', city: 'Antsirabe', stars: 5, text: 'Hôtel Trianon a triplé ses réservations depuis qu\'on est sur la plateforme. Et c\'est gratuit, je recommande à tous les hôteliers.' },
  { name: 'Rajaonarivelo H.', role: 'Lodge Ocean Beach', city: 'Nosy Be', stars: 5, text: 'Ocean Beach Sakatia est visible par des touristes du monde entier. 91 vues en un mois, 2 familles ont déjà réservé pour Pâques.' },
  { name: 'Tiana Razafindra.', role: 'Restaurant Le Récif', city: 'Toamasina', stars: 5, text: 'Les touristes viennent au resto avec le screenshot de notre fiche. C\'est devenu notre meilleure carte de visite.' },
  { name: 'Volamboahangy R.', role: 'Guide officielle', city: 'Fianarantsoa', stars: 5, text: 'Guide depuis 12 ans, j\'ai enfin une vraie vitrine en ligne. 4 réservations en 3 semaines pour la rando Andringitra.' },
  { name: 'Patrick Ravelo.', role: 'Agence Boarding Pass', city: 'Antananarivo', stars: 5, text: 'La plateforme malgache qu\'on attendait depuis des années. Plus besoin de tout faire via WhatsApp ou Facebook.' },
  { name: 'Soa Andriana.', role: 'Lodge Katsepy', city: 'Mahajanga', stars: 5, text: 'Notre lodge a accueilli 5 groupes français en avril grâce à Mada Spot. Concret, gratuit, 100% local.' },
  { name: 'Nivo R.', role: 'Restaurant La Varangue', city: 'Antananarivo', stars: 5, text: 'Les avis clients sur notre fiche convertissent en vraies réservations. On a même eu un journaliste de Routard via la plateforme.' },
  { name: 'Rivo Andrianasolo', role: 'Plongée Nautilus', city: 'Nosy Be', stars: 5, text: 'Centre de plongée : 12 réservations confirmées via Mada Spot ce trimestre. Les voyageurs comparent et choisissent vite.' },
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <HomePage />
    </Suspense>
  );
}

function HomePage() {
  const t = useTrans('home');
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

  return (
    <main id="main-content" className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      {/* ===== HERO ===== */}
      <HeroClean />

      {/* ===== DESTINATIONS POPULAIRES ===== */}
      <PopularDestinationsSection t={t} />

      {/* ===== LIEUX RECOMMANDÉS ===== */}
      {!isLoading && featuredAttractions.length > 0 && (
        <RecommendedSection t={t} attractions={featuredAttractions} />
      )}

      {/* ===== BANNIÈRE INSCRIPTION PROS ===== */}
      <ProBannerSection t={t} />

      {/* ===== POURQUOI MADA SPOT ===== */}
      <WhyMadaSpotSection t={t} />

      {/* ===== CE QUE NOS CLIENTS DISENT ===== */}
      <TestimonialsSection t={t} />

      {/* ===== NEWSLETTER ===== */}
      <NewsletterSection t={t} />

      <Footer />

      {/* Bottom Nav mobile */}
      <BottomNav t={t} />
      <div className="lg:hidden h-16" />
    </main>
  );
}

/* ============================================================
   Section : Destinations populaires
   ============================================================ */
function PopularDestinationsSection({ t }: { t: Record<string, string> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const destinations = [
    { name: 'Nosy Be', region: t.regionBeaches, img: '/images/Attractions/nosy-be/nosy-be-2.jpg' },
    { name: 'Antananarivo', region: t.regionCapital, img: '/images/Attractions/antananarivo/antananarivo.jpg' },
    { name: 'Tsingy', region: t.regionAdventure, img: '/images/Attractions/bemaraha/tsingy-bemaraha.jpg' },
    { name: 'Isalo', region: t.regionHiking, img: '/images/Attractions/isalo/parc-isalo.jpg' },
    { name: 'Diego Suarez', region: t.regionBays, img: '/images/Attractions/diego-suarez/diego-suarez.jpg' },
    { name: 'Sainte-Marie', region: t.regionIsland, img: '/images/Attractions/sainte-marie/ile-sainte-marie.jpg' },
  ];

  return (
    <section ref={ref} className="relative bg-[#F8FAFC] py-16 sm:py-20 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="mb-8"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
          >
            {t.discoverMadagascar}
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
          >
            {t.popularDestinations}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5"
        >
          {destinations.map((dest) => (
            <motion.div key={dest.name} variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href={`/attractions?search=${encodeURIComponent(dest.name)}`}
                className="group block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:border-[#FF6B35]/30 hover:shadow-[0_8px_30px_rgba(255,107,53,0.08)] transition-all duration-300"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={dest.img}
                    alt={dest.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
                <div className="px-4 py-3.5 border-t border-[#E2E8F0]">
                  <p className="text-[15px] font-semibold text-[#0F172A] tracking-[-0.01em]">{dest.name}</p>
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">{dest.region}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Lieux recommandés
   ============================================================ */
function RecommendedSection({
  t,
  attractions,
}: {
  t: ReturnType<typeof useTrans<'home'>>;
  attractions: Attraction[];
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative bg-white py-16 sm:py-20 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="flex items-end justify-between mb-8 gap-4"
        >
          <div>
            <motion.p
              variants={fadeUp}
              className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
            >
              {t.featured}
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              {t.recommendedPlaces}
            </motion.h2>
          </div>
          <motion.div variants={fadeUp}>
            <Link
              href="/attractions"
              className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
            >
              {t.seeAll}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {attractions.slice(0, 4).map((a) => (
            <motion.div key={a.id} variants={fadeUp} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href={`/attractions/${a.slug}`}
                className="group block bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:border-[#FF6B35]/30 hover:shadow-[0_8px_30px_rgba(255,107,53,0.08)] transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={getAttractionImage(a.name, a.coverImage)}
                    alt={a.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="p-4 border-t border-[#E2E8F0]">
                  <h3 className="text-[14px] font-semibold text-[#0F172A] line-clamp-1">{a.name}</h3>
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">{a.city}</p>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <Star className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
                    <span className="text-[13px] font-semibold text-[#0F172A] font-mono tabular-nums">
                      {a.rating?.toFixed(1) || '—'}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">({a.reviewCount})</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Bannière inscription pros
   ============================================================ */
function ProBannerSection({ t }: { t: Record<string, string> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="relative bg-[#003B95] py-14 sm:py-20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-12 items-center"
        >
          <div>
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 text-white rounded-full text-[12px] font-medium border border-white/20 mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
              {t.bannerEyebrow}
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.04] font-semibold tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              {t.bannerTitlePart1}{' '}
              <span className="text-[#FFB088]">{t.bannerTitleHighlight}</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-[15px] sm:text-[17px] text-white/85 max-w-lg leading-[1.6]"
            >
              {t.bannerSubtitle}
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8">
              <Link
                href="/inscrire-etablissement"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-xl text-[14px] font-semibold transition-colors shadow-[0_4px_14px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                {t.bannerCta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="relative aspect-[5/4] sm:aspect-[4/3] lg:aspect-[5/4] w-full max-w-[560px] lg:max-w-none lg:ml-auto rounded-2xl overflow-hidden border border-white/15 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]"
          >
            <Image
              src="/images/Attractions/nosy-be/nosy-be.jpg"
              alt="Madagascar"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Pourquoi Mada Spot
   ============================================================ */
function WhyMadaSpotSection({ t }: { t: Record<string, string> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const items = [
    { icon: CreditCard, title: t.securePayment, desc: t.securePaymentDesc },
    { icon: CalendarCheck, title: t.booking24, desc: t.booking24Desc },
    { icon: Headphones, title: t.supportTitle, desc: t.supportDesc },
    { icon: Shield, title: t.freeService, desc: t.freeServiceDesc },
  ];

  return (
    <section ref={ref} className="relative bg-white py-16 sm:py-20 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="mb-8 max-w-2xl"
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
          >
            Pourquoi Mada Spot
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
          >
            La plateforme tourisme la plus directe de Madagascar.
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
        >
          {items.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="p-5 sm:p-6 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-[#FDBA74]" />
              </div>
              <h4 className="text-[15px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                {item.title}
              </h4>
              <p className="mt-1.5 text-[13px] text-[#64748B] leading-[1.55]">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Témoignages (carrousel manuel)
   ============================================================ */
function TestimonialsSection({ t }: { t: Record<string, string> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [index, setIndex] = useState(0);
  const pageSize = 3;
  const maxIndex = Math.max(0, REVIEWS.length - pageSize);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(maxIndex, i + 1));
  const visibleDots = Math.ceil(REVIEWS.length / pageSize);

  return (
    <section ref={ref} className="relative bg-[#F8FAFC] py-16 sm:py-20 border-b border-[#E2E8F0] overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <motion.p
              variants={fadeUp}
              className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
            >
              Témoignages
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              {t.reviewsTitle}
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-[14px] text-[#64748B]">
              {REVIEWS.length}+ {t.reviewsTrustSuffix}
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={index === 0}
              aria-label="Précédent"
              className="w-10 h-10 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              disabled={index >= maxIndex}
              aria-label="Suivant"
              className="w-10 h-10 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>

        {/* Carrousel */}
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-4 sm:gap-5"
            animate={{ x: `calc(-${index} * (100% / ${pageSize}) - ${index} * 1.25rem / ${pageSize})` }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {REVIEWS.map((review, i) => (
              <div
                key={`${review.name}-${i}`}
                className="shrink-0 w-[85%] sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)] p-6 bg-white border border-[#E2E8F0] rounded-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#F59E0B] flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
                    {getInitials(review.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#0F172A] truncate">{review.name}</p>
                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {review.role} · {review.city}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.stars }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
                  ))}
                </div>
                <p className="text-[13px] text-[#334155] leading-[1.6] line-clamp-5">
                  &laquo;&nbsp;{review.text}&nbsp;&raquo;
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {Array.from({ length: visibleDots }).map((_, i) => {
            const target = Math.min(i * pageSize, maxIndex);
            const isActive = index >= target && index < Math.min(target + pageSize, REVIEWS.length);
            return (
              <button
                key={i}
                onClick={() => setIndex(target)}
                aria-label={`Page ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  isActive ? 'w-8 bg-[#FF6B35]' : 'w-1.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().replace('.', '');
}

/* ============================================================
   Section : Newsletter compacte
   ============================================================ */
function NewsletterSection({ t }: { t: Record<string, string> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="bg-[#F8FAFC] py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="p-8 sm:p-10 bg-white border border-[#E2E8F0] rounded-2xl"
        >
          <motion.h2
            variants={fadeUp}
            className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[#0F172A] text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
          >
            {t.newsletterTitleHome}
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-3 text-[14px] sm:text-[15px] text-[#64748B] text-center max-w-md mx-auto"
          >
            {t.newsletterDescHome}
          </motion.p>
          <motion.form
            variants={fadeUp}
            className="mt-7 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder={t.emailPlaceholderHome}
              className="flex-1 px-4 py-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#FF6B35]/40 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[14px] font-medium whitespace-nowrap transition-colors shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
            >
              {t.subscribeHome}
            </button>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   Bottom Nav mobile
   ============================================================ */
function BottomNav({ t }: { t: Record<string, string> }) {
  const items = [
    { icon: HomeIcon, label: t.navHome, href: '/', active: true },
    { icon: SearchIcon, label: t.navSearch, href: '/hotels', active: false },
    { icon: Compass, label: t.navDestinations, href: '/attractions', active: false },
    { icon: BlogIcon, label: t.navBlog, href: '/blog', active: false },
    { icon: UserIcon, label: t.navProfile, href: '/client', active: false },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] shadow-[0_-2px_12px_rgba(15,23,42,0.04)] z-50 safe-area-pb">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
              item.active ? 'text-[#FF6B35]' : 'text-[#94A3B8] hover:text-[#334155]'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-[0.02em]">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
