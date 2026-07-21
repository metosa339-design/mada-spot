'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Heart, Share2, ArrowLeft, Mountain, Trees, Waves, Landmark, Camera, Ticket, Users, Accessibility, ParkingCircle, Sun, Info, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

const DirectionsWidget = dynamic(() => import('@/components/maps/DirectionsWidget'), { ssr: false });
import SourceAttribution from '@/components/bons-plans/SourceAttribution';
import EstablishmentDescription from '@/components/bons-plans/EstablishmentDescription';
import BookingChatWidget from '@/components/bons-plans/BookingChatWidget';
import { getEstablishmentImage, getHighlightImage } from '@/lib/establishment-image';
import SocialLinks from '@/components/bons-plans/SocialLinks';
import ReviewPreview from '@/components/bons-plans/ReviewPreview';
import OpenCloseBadge from '@/components/bons-plans/OpenCloseBadge';
import LanguageToggle from '@/components/ui/LanguageToggle';
import CurrencyToggle from '@/components/ui/CurrencyToggle';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import FomoBanner from '@/components/bons-plans/FomoBanner';
import PromoBanner from '@/components/bons-plans/PromoBanner';
import EstablishmentEvents from '@/components/bons-plans/EstablishmentEvents';
import OwnerBio from '@/components/bons-plans/OwnerBio';
import CategorizedGallery from '@/components/bons-plans/CategorizedGallery';
import PhotoGallerySection from '@/components/bons-plans/PhotoGallerySection';
import EnhancedContactButtons from '@/components/bons-plans/EnhancedContactButtons';
import AccessInfo from '@/components/bons-plans/AccessInfo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/contexts/ToastContext';

interface Attraction {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  city: string;
  district: string;
  region: string;
  address: string;
  coverImage: string;
  images: string[];
  gallery?: { url: string; caption?: string }[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
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
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  isAvailable?: boolean;
  reviews: any[];
  // Multilingual
  nameEn?: string;
  descriptionEn?: string;
  shortDescriptionEn?: string;
  // Import metadata
  dataSource?: string;
  sourceUrl?: string;
  sourceAttribution?: string;
  isClaimed?: boolean;
  claimedByUserId?: string | null;
  owner?: { firstName: string; lastName: string; avatar?: string | null; memberSince: string } | null;
}

const typeLabels: Record<string, string> = {
  parc_national: 'Parc National',
  plage: 'Plage',
  cascade: 'Cascade',
  montagne: 'Montagne',
  reserve: 'Réserve naturelle',
  site_historique: 'Site historique',
  musee: 'Musée',
};

const typeIcons: Record<string, any> = {
  parc_national: Trees,
  plage: Waves,
  cascade: Waves,
  montagne: Mountain,
  reserve: Trees,
  site_historique: Landmark,
  musee: Landmark,
};

const dayLabels: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const EASE = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function AttractionDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const { success: toastSuccess } = useToast();

  const [attraction, setAttraction] = useState<Attraction | null>(null);
  const [similarAttractions, setSimilarAttractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchAttraction = async () => {
      setIsLoading(true);
      setAttraction(null);
      setSimilarAttractions([]);
      window.scrollTo(0, 0);
      try {
        const response = await fetch(`/api/bons-plans/attractions/${slug}`);
        const data = await response.json();
        if (data.attraction) {
          setAttraction(data.attraction);
          setSimilarAttractions(data.similarAttractions || []);
        }
      } catch (error) {
        console.error('Error fetching attraction:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchAttraction();
    }
  }, [slug]);

  const { t } = useLanguage();
  const { convert } = useCurrency();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="pt-24 max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-white rounded-2xl border border-[#E2E8F0]" />
            <div className="h-8 bg-white rounded w-1/3" />
            <div className="h-4 bg-white rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="pt-24 max-w-7xl mx-auto px-4 py-12 text-center">
          <Mountain className="w-16 h-16 mx-auto text-[#CBD5E1] mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Attraction non trouvée</h1>
          <p className="text-[#64748B] mb-6">L&apos;attraction que vous recherchez n&apos;existe pas.</p>
          <Link
            href="/attractions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux attractions
          </Link>
        </div>
      </div>
    );
  }

  const TypeIcon = typeIcons[attraction.attractionType] || Camera;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero photo */}
      <div className="relative h-[50vh] md:h-[60vh] bg-[#F8FAFC]">
        <CategorizedGallery
          coverImage={attraction.coverImage}
          images={attraction.images || []}
          establishmentName={attraction.name}
          fallbackImage={getEstablishmentImage('ATTRACTION', attraction.city, attraction.name)}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        <Link
          href="/attractions"
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:bg-white/90 hover:border-[#CBD5E1] transition-colors z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline text-[13px] font-medium">Retour</span>
        </Link>

        <div className="absolute top-24 right-4 md:right-8 flex items-center gap-2 z-10">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2.5 rounded-lg backdrop-blur-md border transition-colors ${
              isFavorite
                ? 'bg-[#FF6B35] border-[#FF6B35] text-white'
                : 'bg-white/80 border-[#E2E8F0] text-[#0F172A] hover:bg-white/90 hover:border-[#CBD5E1]'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={async () => {
              const url = window.location.href;
              const title = attraction?.name || 'Attraction sur Mada Spot';
              if (navigator.share) {
                try { await navigator.share({ title, url }); } catch {}
              } else {
                await navigator.clipboard.writeText(url);
                toastSuccess('Lien copié !');
              }
            }}
            className="p-2.5 bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:bg-white/90 hover:border-[#CBD5E1] transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <CurrencyToggle />
          <LanguageToggle />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                <TypeIcon className="w-3.5 h-3.5" />
                {typeLabels[attraction.attractionType]}
              </span>
              {attraction.isFree ? (
                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                  Entrée gratuite
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[#0F172A] font-mono rounded-md text-[12px] font-semibold">
                  {convert(attraction.entryFeeLocal)}
                </span>
              )}
              {attraction.isFeatured && (
                <span className="px-2.5 py-1 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                  Incontournable
                </span>
              )}
            </div>
            <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-3 flex items-center gap-2">
              {attraction.name}
              {attraction.isClaimed && <VerifiedBadge variant="verified" size="lg" />}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[#334155] text-[14px]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#64748B]" />
                {attraction.district}, {attraction.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                <span className="font-mono">{attraction.rating?.toFixed(1)}</span>
                <span className="text-[#64748B]">({attraction.reviewCount} avis)</span>
              </span>
              {attraction.isAvailable !== undefined && (
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  attraction.isAvailable
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  {attraction.isAvailable ? 'Disponible' : 'Non disponible'}
                </span>
              )}
              {attraction.visitDuration && (
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <Clock className="w-4 h-4" />
                  {attraction.visitDuration}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6">
          <Breadcrumbs items={[
            { label: 'Bons Plans', href: '/bons-plans' },
            { label: 'Attractions', href: '/attractions' },
            { label: attraction.name },
          ]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">À propos</p>
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-4">
                Présentation
              </h2>
              <EstablishmentDescription
                className="max-w-[65ch]"
                text={t(attraction.description || attraction.shortDescription, attraction.descriptionEn || attraction.shortDescriptionEn)}
              />
            </motion.section>

            {/* Photo Gallery */}
            {(attraction.coverImage || attraction.images?.length > 0 || attraction.gallery?.length) && (
              <PhotoGallerySection
                images={attraction.images || []}
                gallery={attraction.gallery}
                coverImage={attraction.coverImage}
              />
            )}

            {/* Owner Bio */}
            {attraction.owner && <OwnerBio owner={attraction.owner} establishmentName={attraction.name} />}

            {/* Highlights */}
            {attraction.highlights?.length > 0 && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">À voir absolument</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-5">
                  Points forts &amp; lieux à visiter
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attraction.highlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                      className="group relative overflow-hidden rounded-xl bg-white aspect-[4/3] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${getHighlightImage(highlight, attraction.name)})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 w-7 h-7 bg-[#FF6B35] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-[#0F172A] font-semibold text-[13px] leading-snug">
                          {highlight}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Tarifs */}
            {!attraction.isFree && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Tarifs</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-5">
                  Tarifs d&apos;entrée
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 text-[#FF6B35] mb-2">
                      <Ticket className="w-4 h-4" />
                      <span className="text-[11px] uppercase tracking-[0.15em] font-semibold">Résidents</span>
                    </div>
                    <p className="text-[24px] font-semibold font-mono text-[#0F172A]">
                      {convert(attraction.entryFeeLocal)}
                    </p>
                  </div>
                  <div className="p-5 bg-white rounded-lg border border-[#E2E8F0]">
                    <div className="flex items-center gap-2 text-[#FF6B35] mb-2">
                      <Ticket className="w-4 h-4" />
                      <span className="text-[11px] uppercase tracking-[0.15em] font-semibold">Touristes</span>
                    </div>
                    <p className="text-[24px] font-semibold font-mono text-[#0F172A]">
                      {convert(attraction.entryFeeForeign)}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Infos pratiques */}
            <motion.section
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Préparer la visite</p>
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-5">
                Informations pratiques
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attraction.visitDuration && (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#E2E8F0]">
                    <Clock className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#64748B]">Durée</p>
                      <p className="font-medium text-[#0F172A] text-[13px]">{attraction.visitDuration}</p>
                    </div>
                  </div>
                )}
                {attraction.bestTimeToVisit && (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[#E2E8F0]">
                    <Sun className="w-4 h-4 text-[#FF6B35] shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#64748B]">Période</p>
                      <p className="font-medium text-[#0F172A] text-[13px]">{attraction.bestTimeToVisit}</p>
                    </div>
                  </div>
                )}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  attraction.hasGuide ? 'bg-white border-[#CBD5E1]' : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <Users className={`w-4 h-4 shrink-0 ${attraction.hasGuide ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-[#64748B]">Guide</p>
                    <p className={`font-medium text-[13px] ${attraction.hasGuide ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                      {attraction.hasGuide ? 'Disponible' : 'Non disponible'}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  attraction.isAccessible ? 'bg-white border-[#CBD5E1]' : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <Accessibility className={`w-4 h-4 shrink-0 ${attraction.isAccessible ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-[#64748B]">Accessibilité</p>
                    <p className={`font-medium text-[13px] ${attraction.isAccessible ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                      {attraction.isAccessible ? 'Accessible' : 'Non accessible'}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  attraction.hasParking ? 'bg-white border-[#CBD5E1]' : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <ParkingCircle className={`w-4 h-4 shrink-0 ${attraction.hasParking ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-[#64748B]">Parking</p>
                    <p className={`font-medium text-[13px] ${attraction.hasParking ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                      {attraction.hasParking ? 'Disponible' : 'Non disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Horaires */}
            {attraction.openingHours && Object.keys(attraction.openingHours).length > 0 && (
              <motion.section
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]"
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Horaires</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-4">
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-1.5">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const hours = attraction.openingHours[day];
                    const now = new Date();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const isToday = dayNames[now.getDay()] === day;

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between py-2.5 px-4 rounded-lg border ${
                          isToday ? 'bg-[#FF6B35]/8 border-[#FF6B35]/25' : 'bg-white border-[#E2E8F0]'
                        }`}
                      >
                        <span className={`text-[13px] font-medium ${isToday ? 'text-[#FF6B35]' : 'text-[#334155]'}`}>
                          {dayLabels[day]}
                          {isToday && <span className="ml-2 text-[11px] text-[#FF6B35]/70">(aujourd&apos;hui)</span>}
                        </span>
                        {hours?.closed ? (
                          <span className="text-[#94A3B8] text-[13px] font-mono">Fermé</span>
                        ) : hours ? (
                          <span className="text-[#0F172A] text-[13px] font-mono">{hours.open} – {hours.close}</span>
                        ) : (
                          <span className="text-[#94A3B8] text-[13px] font-mono">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Avis détaillés */}
            {attraction.reviews?.length > 0 && (
              <ReviewPreview
                reviews={attraction.reviews}
                maxReviews={2}
                rating={attraction.rating}
                reviewCount={attraction.reviewCount}
                establishmentId={attraction.id}
              />
            )}

            <EstablishmentEvents establishmentId={attraction.id} city={attraction.city} />
          </div>

          {/* Sidebar */}
          <div>
            <div className="lg:sticky lg:top-24 space-y-6">
              <PromoBanner establishmentId={attraction.id} />
              <FomoBanner establishmentId={attraction.id} />

              <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] mb-1">Tarif d&apos;entrée</p>
                    {attraction.isFree ? (
                      <p className="text-[24px] font-semibold text-emerald-400">Gratuit</p>
                    ) : (
                      <p className="text-[26px] font-semibold font-mono text-[#0F172A]">
                        {convert(attraction.entryFeeLocal)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg">
                    <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                    <span className="font-mono text-[#0F172A] text-[14px]">{attraction.rating?.toFixed(1)}</span>
                  </div>
                </div>

                {/* Info box */}
                <div className="p-4 bg-[#FF6B35]/8 rounded-lg mb-4 border border-[#FF6B35]/25">
                  <div className="flex items-start gap-3">
                    <Info className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                    <div className="text-[12px]">
                      <p className="font-semibold mb-1 text-[#FF6B35] text-[11px] uppercase tracking-[0.15em]">Conseils</p>
                      <p className="text-[#334155] leading-relaxed">
                        {attraction.bestTimeToVisit
                          ? `Meilleure période : ${attraction.bestTimeToVisit}`
                          : 'Pensez à réserver votre guide à l\'avance'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* OpenCloseBadge */}
                {attraction.openingHours && Object.keys(attraction.openingHours).length > 0 && (
                  <div className="mb-4">
                    <OpenCloseBadge openingHours={attraction.openingHours} variant="card" />
                  </div>
                )}

                <BookingChatWidget
                  establishmentId={attraction.id}
                  establishmentName={attraction.name}
                  establishmentType="attraction"
                  ownerId={(attraction as any).claimedByUserId || null}
                  pricePerNight={null}
                />

                <EnhancedContactButtons
                  phone={attraction.phone}
                  whatsapp={attraction.whatsapp}
                  email={attraction.email}
                  establishmentName={attraction.name}
                  establishmentId={attraction.id}
                />

                {(attraction.website || attraction.facebook || attraction.instagram) && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                    <SocialLinks
                      website={attraction.website}
                      facebook={attraction.facebook}
                      instagram={attraction.instagram}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Localisation & Directions — full width below grid */}
        {(attraction.latitude && attraction.longitude) && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
              <DirectionsWidget
                destinationLat={attraction.latitude}
                destinationLng={attraction.longitude}
                destinationName={attraction.name}
                city={attraction.city}
                district={attraction.district}
              />
            </div>
            <AccessInfo
              city={attraction.city}
              district={attraction.district}
              address={attraction.address}
              hasParking={attraction.hasParking}
              latitude={attraction.latitude}
              longitude={attraction.longitude}
            />
          </div>
        )}

        {/* Source Attribution */}
        {attraction.dataSource && attraction.dataSource !== 'manual' && (
          <div className="mt-8 max-w-4xl">
            <SourceAttribution
              establishmentId={attraction.id}
              establishmentName={attraction.name}
              sourceAttribution={attraction.sourceAttribution}
              sourceUrl={attraction.sourceUrl}
              isClaimed={attraction.isClaimed}
              dataSource={attraction.dataSource}
            />
          </div>
        )}

        {/* Attractions similaires */}
        {similarAttractions.length > 0 && (
          <section className="mt-12">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Continuer l&apos;exploration</p>
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
              Attractions similaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarAttractions.map((a) => {
                const SimilarTypeIcon = typeIcons[a.attractionType] || Camera;
                return (
                  <motion.div
                    key={a.id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={`/attractions/${a.slug}`}
                      className="group block bg-white rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
                    >
                      <div
                        className="relative h-48 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${getEstablishmentImage('ATTRACTION', a.city, a.name, a.coverImage)})`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-[#FFF7ED] backdrop-blur-md border border-[#FF6B35]/30 text-[#FF6B35] text-[11px] font-semibold uppercase tracking-[0.1em] rounded-md">
                          <SimilarTypeIcon className="w-3 h-3" />
                          {typeLabels[a.attractionType]}
                        </div>
                        <div className="absolute top-3 right-3">
                          {a.isFree ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[11px] font-semibold uppercase tracking-[0.1em] border border-emerald-500/30">
                              Gratuit
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-white/80 backdrop-blur-md text-[#0F172A] rounded-md text-[12px] font-mono font-semibold border border-[#E2E8F0]">
                              {a.entryFeeLocal?.toLocaleString()} Ar
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[#0F172A] text-[14px] group-hover:text-[#FF6B35] transition-colors">
                          {a.name}
                        </h3>
                        <p className="text-[12px] text-[#64748B] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {a.city}
                        </p>
                        <div className="flex items-center gap-1.5 mt-3">
                          <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                          <span className="font-mono text-[#0F172A] text-[13px]">{a.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
