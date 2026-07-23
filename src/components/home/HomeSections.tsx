'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ArrowRight,
  BadgeCheck,
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
import Footer from '@/components/layout/Footer';
import Reveal from '@/components/ui/Reveal';
import { useTrans } from '@/i18n';
import { getEstablishmentImage } from '@/lib/establishment-image';

interface FeaturedHotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  coverImage?: string | null;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  completenessScore?: number;
}

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

/**
 * HomeSections — tout le contenu SOUS le hero.
 *
 * Chargé en `next/dynamic` depuis la page d'accueil. Les animations d'apparition
 * utilisent le composant CSS `Reveal` (IntersectionObserver) au lieu de
 * framer-motion → moins de JavaScript, même effet visuel.
 */
export default function HomeSections() {
  const t = useTrans('home');
  const [featuredHotels, setFeaturedHotels] = useState<FeaturedHotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // On récupère un large pool d'hôtels (tri par défaut = complétude), puis
        // on ne garde QUE ceux ayant une vraie photo chargée par le propriétaire
        // (upload local /uploads/ ou hébergement Cloudinary), jamais un visuel
        // générique de repli. Classés par conformité (completenessScore) puis note.
        const res = await fetch('/api/search?type=HOTEL&limit=40');
        if (res.ok) {
          const data = await res.json();
          const isRealOwnerPhoto = (cover?: string | null) => {
            const c = (cover || '').trim();
            return (
              c.startsWith('/uploads/') ||
              c.includes('cloudinary.com') ||
              c.startsWith('http')
            );
          };
          // Exclusions manuelles : fiches dont la couverture n'est pas une vraie
          // photo de l'établissement (logo, affiche publicitaire avec coordonnées),
          // ou que l'on ne souhaite pas mettre en avant ici.
          // Vérifiées à l'oeil — à compléter/retirer ici au besoin.
          const EXCLUDED_SLUGS = new Set<string>([
            'green-park-hotel-mrjfmqkv', // logo « GREEN PARK », pas de photo du bâtiment
            'chambres-d-hotes-le-bon-endroit-mo18d8uu', // affiche pub (tél/mail incrustés)
            'souimanga-hotel', // bannière Facebook (texte + logo + adresse incrustés)
            'vakinahandro', // collage promotionnel avec logo au centre
            'nosy-saba-private-island-spa-mq51h408', // retiré à la demande (vue d'île)
            'manga-lodge-mr52tmih', // retiré à la demande
          ]);
          // Hôtels épinglés en tête (dans cet ordre), quelle que soit leur
          // complétude. Vérifiés à l'oeil (vraie photo). Modifiable ici.
          const PINNED_SLUGS: string[] = [
            'hotel-antemoro-mq4zsjhk', // Hôtel Antemoro (Manakara) — bungalows
            'samirah-hotel-majunga-mqho61z2', // Samirah Hotel Majunga — villas + piscine
          ];

          const eligible: FeaturedHotel[] = (data.establishments || []).filter(
            (h: FeaturedHotel) =>
              isRealOwnerPhoto(h.coverImage) && !EXCLUDED_SLUGS.has(h.slug),
          );
          // Épinglés d'abord (dans l'ordre de PINNED_SLUGS), puis le reste trié
          // par conformité (complétude → note → slug pour un ordre stable).
          const pinned = PINNED_SLUGS.map((slug) =>
            eligible.find((h) => h.slug === slug),
          ).filter((h): h is FeaturedHotel => Boolean(h));
          const pinnedSet = new Set(pinned.map((h) => h.slug));
          const rest = eligible
            .filter((h) => !pinnedSet.has(h.slug))
            .sort(
              (a, b) =>
                (b.completenessScore || 0) - (a.completenessScore || 0) ||
                (b.rating || 0) - (a.rating || 0) ||
                a.slug.localeCompare(b.slug),
            );
          const hotels: FeaturedHotel[] = [...pinned, ...rest].slice(0, 8);
          setFeaturedHotels(hotels);
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
    <>
      {/* ===== DESTINATIONS POPULAIRES ===== */}
      <PopularDestinationsSection t={t} />

      {/* ===== SÉLECTION PREMIUM — HÔTELS ===== */}
      {!isLoading && featuredHotels.length > 0 && (
        <FeaturedHotelsSection hotels={featuredHotels} />
      )}

      {/* ===== POURQUOI MADA SPOT ===== */}
      <WhyMadaSpotSection t={t} />

      {/* ===== CE QUE NOS CLIENTS DISENT ===== */}
      <TestimonialsSection t={t} />

      {/* ===== NEWSLETTER ===== */}
      <NewsletterSection t={t} />

      {/* ===== BANNIÈRE INSCRIPTION PROS (B2B, juste avant footer) ===== */}
      <ProBannerSection t={t} />

      <Footer />

      {/* Bottom Nav mobile */}
      <BottomNav t={t} />
      <div className="lg:hidden h-16" />
    </>
  );
}

/* ============================================================
   Section : Destinations populaires
   ============================================================ */
function PopularDestinationsSection({ t }: { t: Record<string, string> }) {
  // Grille asymétrique (style Booking) : les 12 destinations pavent parfaitement
  // une grille de 12 colonnes → 2×(6) + 3×(4) + 4×(3) + 3×(4).
  const layout = (i: number): string => {
    if (i < 2) return 'md:col-span-6 h-[150px] sm:h-[190px]';
    if (i < 5) return 'md:col-span-4 h-[140px] sm:h-[165px]';
    if (i < 9) return 'md:col-span-3 h-[130px] sm:h-[150px]';
    return 'md:col-span-4 h-[140px] sm:h-[165px]';
  };

  const destinations: { name: string; city?: string; img: string }[] = [
    { name: 'Nosy Be', img: '/images/Attractions/nosy-be/nosy-be-12.jpg' },
    { name: 'Antananarivo', img: '/images/Attractions/antananarivo/antananarivo-12.jpg' },
    { name: 'Tsingy', img: '/images/Attractions/bemaraha/tsingy-de-bemaraha-260.jpg' },
    { name: 'Isalo', img: '/images/Attractions/isalo/isalo-12.jpg' },
    { name: 'Diego Suarez', img: '/images/Attractions/diego-suarez/diego-suarez.jpg' },
    { name: 'Sainte-Marie', img: '/images/Attractions/sainte-marie/ile-sainte-marie.jpg' },
    { name: 'Morondava', img: '/images/Attractions/baobabs/avenue-des-baobabs-a-madagascar-130.jpg' },
    { name: 'Antsirabe', img: '/images/Attractions/antsirabe/antsirabe-12.jpg' },
    { name: 'Andasibe', img: '/images/Attractions/andasibe/Andasibe-386.jpg' },
    { name: 'Fianarantsoa', img: '/images/Attractions/fianarantsoa/fianarantsoa-12.jpg' },
    { name: 'Ifaty', img: '/images/Attractions/ifaty/ifaty-tulear.jpg' },
    { name: 'Ankarana', img: '/images/Attractions/ankarana/ankarana-12.jpg' },
  ];

  // Compte d'hôtels par ville → priorise les villes les mieux fournies (grandes cartes en haut).
  const [hotelCounts, setHotelCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    fetch('/api/bons-plans/hotel-counts')
      .then((r) => (r.ok ? r.json() : { counts: {} }))
      .then((d) => setHotelCounts(d.counts || {}))
      .catch(() => {});
  }, []);

  const slugify = (s: string) =>
    s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // Tri stable : à nombre d'hôtels égal, l'ordre curé d'origine est conservé.
  const ordered = destinations
    .map((d) => ({ ...d, count: hotelCounts[slugify(d.city || d.name)] || 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <section className="relative bg-[#F8FAFC] py-10 sm:py-12 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="mb-6">
          <Reveal
            as="p"
            className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
          >
            {t.discoverMadagascar}
          </Reveal>
          <Reveal
            as="h2"
            delay={80}
            className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
          >
            {t.popularDestinations}
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 w-full">
          {ordered.map((dest, i) => (
            <Reveal key={dest.name} delay={Math.min(i, 8) * 60} className={layout(i)}>
              <Link
                href={`/search?city=${encodeURIComponent(dest.city || dest.name)}&type=HOTEL`}
                className="group relative block w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Image
                  src={dest.img}
                  alt={dest.name}
                  fill
                  quality={90}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
                {/* Dégradé sombre prononcé : lisibilité parfaite du texte */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
                {/* Nom incrusté en haut à gauche */}
                <span className="absolute top-0 left-0 z-10 p-4 text-white font-semibold text-lg md:text-xl drop-shadow-sm">
                  {dest.name}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Sélection premium — Hôtels coups de cœur et de confiance
   ============================================================ */
function FeaturedHotelsSection({ hotels }: { hotels: FeaturedHotel[] }) {
  return (
    <section className="relative bg-white py-16 sm:py-20 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <Reveal
              as="p"
              className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
            >
              SÉLECTION PREMIUM
            </Reveal>
            <Reveal
              as="h2"
              delay={80}
              className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              Hôtels coups de cœur et de confiance
            </Reveal>
          </div>
          <Reveal delay={120}>
            <Link
              href="/hotels"
              className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-medium text-[#0F172A] bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
            >
              Voir tout
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {hotels.map((h, i) => (
            <Reveal key={h.id} delay={Math.min(i, 8) * 60}>
              <Link
                href={`/hotels/${h.slug}`}
                className="group block bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#FF6B35]/30 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={getEstablishmentImage('HOTEL', h.city, h.name, h.coverImage)}
                    alt={h.name}
                    fill
                    quality={90}
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {/* Badge note — uniquement si de vrais avis existent */}
                  {h.rating > 0 && (
                    <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur-sm px-2 py-1 shadow-sm">
                      <Star className="w-3.5 h-3.5 fill-[#FF6B35] text-[#FF6B35]" />
                      <span className="text-[12px] font-semibold text-slate-800 font-mono tabular-nums">
                        {h.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                  {/* Badge conformité : vérifié par un admin, ou fiche 100% complète */}
                  {(h.isVerified || (h.completenessScore || 0) >= 100) && (
                    <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-emerald-500/95 text-white px-2 py-1 shadow-sm">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        {h.isVerified ? 'Vérifié' : 'Fiche complète'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-[#E2E8F0]">
                  <h3 className="text-[13px] sm:text-[14px] font-semibold text-slate-800 line-clamp-1 leading-snug group-hover:text-[#FF6B35] transition-colors">
                    {h.name}
                  </h3>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <p className="text-[12px] text-[#94A3B8] truncate">{h.city}</p>
                    {h.reviewCount > 0 && (
                      <span className="text-[11px] text-[#94A3B8] shrink-0">{h.reviewCount} avis</span>
                    )}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Bannière inscription pros
   ============================================================ */
function ProBannerSection({ t }: { t: Record<string, string> }) {
  return (
    <section className="relative bg-[#003B95] py-14 sm:py-20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-12 items-center">
          <div>
            <Reveal
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 text-white rounded-full text-[12px] font-medium border border-white/20 mb-6"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
              {t.bannerEyebrow}
            </Reveal>

            <Reveal
              as="h2"
              delay={80}
              className="text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.04] font-semibold tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              {t.bannerTitlePart1}{' '}
              <span className="text-[#FFB088]">{t.bannerTitleHighlight}</span>
            </Reveal>

            <Reveal
              as="p"
              delay={140}
              className="mt-5 text-[15px] sm:text-[17px] text-white/85 max-w-lg leading-[1.6]"
            >
              {t.bannerSubtitle}
            </Reveal>

            <Reveal delay={200} className="mt-8">
              <Link
                href="/inscrire-etablissement"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-xl text-[14px] font-semibold transition-colors shadow-[0_4px_14px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                Ajouter mon établissement (Gratuit)
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </div>

          <Reveal
            delay={120}
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
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Pourquoi Mada Spot
   ============================================================ */
function WhyMadaSpotSection({ t }: { t: Record<string, string> }) {
  const items = [
    { icon: CreditCard, title: t.securePayment, desc: t.securePaymentDesc },
    { icon: CalendarCheck, title: t.booking24, desc: t.booking24Desc },
    { icon: Headphones, title: t.supportTitle, desc: t.supportDesc },
    { icon: Shield, title: t.freeService, desc: t.freeServiceDesc },
  ];

  return (
    <section className="relative bg-white py-16 sm:py-20 border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="mb-8 max-w-2xl">
          <Reveal
            as="p"
            className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
          >
            Pourquoi Mada Spot
          </Reveal>
          <Reveal
            as="h2"
            delay={80}
            className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
          >
            La plateforme tourisme la plus directe de Madagascar.
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 70}
              className="p-5 sm:p-6 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-[#FDBA74]" />
              </div>
              <h4 className="text-[15px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                {item.title}
              </h4>
              <p className="mt-1.5 text-[13px] text-[#64748B] leading-[1.55]">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Section : Témoignages (carrousel manuel)
   ============================================================ */
function TestimonialsSection({ t }: { t: Record<string, string> }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const pageSize = 3;
  const maxIndex = Math.max(0, REVIEWS.length - pageSize);

  const goPrev = () => {
    setIsPaused(true);
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  };
  const goNext = () => {
    setIsPaused(true);
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  };
  const visibleDots = Math.ceil(REVIEWS.length / pageSize);

  // Autoplay : uniquement quand la section a été vue et non mise en pause.
  useEffect(() => {
    if (isPaused || !autoplay) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4500);
    return () => clearInterval(id);
  }, [isPaused, autoplay, maxIndex]);

  const carouselRef = (el: HTMLDivElement | null) => {
    if (!el || autoplay || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAutoplay(true);
          io.disconnect();
        }
      },
      { rootMargin: '-80px' },
    );
    io.observe(el);
    return () => io.disconnect();
  };

  return (
    <section
      ref={carouselRef}
      className="relative bg-[#F8FAFC] py-16 sm:py-20 border-b border-[#E2E8F0] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <Reveal
              as="p"
              className="text-[11px] uppercase tracking-[0.12em] text-[#FF6B35] font-medium mb-3"
            >
              {t.reviewsEyebrow}
            </Reveal>
            <Reveal
              as="h2"
              delay={80}
              className="text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#0F172A]"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              {t.reviewsTitle}
            </Reveal>
          </div>

          <Reveal delay={120} className="flex items-center gap-2">
            <button
              onClick={goPrev}
              aria-label={t.previous}
              className="w-10 h-10 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goNext}
              aria-label={t.next}
              className="w-10 h-10 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </Reveal>
        </div>

        {/* Carrousel */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
        >
          <div
            className="flex gap-4 sm:gap-5"
            style={{
              transform: `translateX(calc(-${index} * (100% / ${pageSize}) - ${index} * 1.25rem / ${pageSize}))`,
              transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
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
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {Array.from({ length: visibleDots }).map((_, i) => {
            const target = Math.min(i * pageSize, maxIndex);
            const isActive = index >= target && index < Math.min(target + pageSize, REVIEWS.length);
            return (
              <button
                key={i}
                onClick={() => {
                  setIsPaused(true);
                  setIndex(target);
                }}
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
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success !== false) {
        setStatus('success');
        setMessage(t.newsletterSuccess);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data?.error || t.newsletterError);
      }
    } catch {
      setStatus('error');
      setMessage(t.newsletterError);
    }
  };

  return (
    <section className="bg-[#F8FAFC] py-16 sm:py-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <Reveal className="p-8 sm:p-10 bg-white border border-[#E2E8F0] rounded-2xl">
          <h2
            className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[#0F172A] text-center"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
          >
            {t.newsletterTitleHome}
          </h2>
          <p className="mt-3 text-[14px] sm:text-[15px] text-[#64748B] text-center max-w-md mx-auto">
            {t.newsletterDescHome}
          </p>
          <form
            className="mt-7 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto"
            onSubmit={handleSubscribe}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              placeholder={t.emailPlaceholderHome}
              className="flex-1 px-4 py-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#FF6B35]/40 transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-5 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[14px] font-medium whitespace-nowrap transition-colors shadow-[0_8px_30px_rgba(255,107,53,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '...' : t.subscribeHome}
            </button>
          </form>
          {message && (
            <p
              className={`mt-3 text-center text-[13px] ${
                status === 'success' ? 'text-[#10B981]' : 'text-[#EF4444]'
              }`}
            >
              {message}
            </p>
          )}
        </Reveal>
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
