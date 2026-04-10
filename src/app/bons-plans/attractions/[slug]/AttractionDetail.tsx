'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Heart, Share2, ArrowLeft, Mountain, Trees, Waves, Landmark, Camera, Ticket, Users, Accessibility, ParkingCircle, Sun, Info, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

const DirectionsWidget = dynamic(() => import('@/components/maps/DirectionsWidget'), { ssr: false });
import SourceAttribution from '@/components/bons-plans/SourceAttribution';
import BookingChatWidget from '@/components/bons-plans/BookingChatWidget';
import { getImageUrl } from '@/lib/image-url';
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

function getAttractionImage(name: string, coverImage?: string | null): string {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
                <div className="pt-24 max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-[#1a1a24] rounded-2xl" />
            <div className="h-8 bg-[#1a1a24] rounded w-1/3" />
            <div className="h-4 bg-[#1a1a24] rounded w-2/3" />
          </div>
        </div>
        </div>
    );
  }

  if (!attraction) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
                <div className="pt-24 max-w-7xl mx-auto px-4 py-12 text-center">
          <Mountain className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Attraction non trouvée</h1>
          <p className="text-slate-400 mb-6">L'attraction que vous recherchez n'existe pas.</p>
          <Link
            href="/bons-plans/attractions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux attractions
          </Link>
        </div>
        </div>
    );
  }

  const { t } = useLanguage();
  const { convert } = useCurrency();
  const TypeIcon = typeIcons[attraction.attractionType] || Camera;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">

      {/* Header avec image */}
      <div className="relative h-[50vh] md:h-[60vh] bg-[#1a1a24]">
        <CategorizedGallery
          coverImage={attraction.coverImage}
          images={attraction.images || []}
          establishmentName={attraction.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-black/30 pointer-events-none" />

        <Link
          href="/bons-plans/attractions"
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">Retour</span>
        </Link>

        <div className="absolute top-24 right-4 md:right-8 flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors border border-white/10 ${
              isFavorite ? 'bg-pink-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
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
            className="p-3 bg-black/40 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors border border-white/10"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <CurrencyToggle />
          <LanguageToggle />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full text-sm font-medium">
                <TypeIcon className="w-4 h-4" />
                {typeLabels[attraction.attractionType]}
              </span>
              {attraction.isFree ? (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/30">
                  Entrée gratuite
                </span>
              ) : (
                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-bold border border-white/20">
                  {convert(attraction.entryFeeLocal)}
                </span>
              )}
              {attraction.isFeatured && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium border border-yellow-500/30">
                  Incontournable
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
              {attraction.name}
              {attraction.isClaimed && <VerifiedBadge variant="verified" size="lg" />}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-orange-400" />
                {attraction.district}, {attraction.city}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {attraction.rating?.toFixed(1)} ({attraction.reviewCount} avis)
              </span>
              {attraction.isAvailable !== undefined && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  attraction.isAvailable
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {attraction.isAvailable ? 'Disponible' : 'Non disponible'}
                </span>
              )}
              {attraction.visitDuration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-pink-400" />
                  {attraction.visitDuration}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs items={[
            { label: 'Bons Plans', href: '/bons-plans' },
            { label: 'Attractions', href: '/bons-plans/attractions' },
            { label: attraction.name },
          ]} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]"
            >
              <h2 className="text-xl font-bold text-white mb-4">À propos</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {t(attraction.description || attraction.shortDescription, attraction.descriptionEn || attraction.shortDescriptionEn)}
              </p>
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]"
              >
                <h2 className="text-xl font-bold text-white mb-4">Points forts & Lieux à visiter</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attraction.highlights.map((highlight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                      whileHover={{ scale: 1.03 }}
                      className="group relative overflow-hidden rounded-xl bg-[#2a2a36] aspect-[4/3] cursor-pointer border border-[#3a3a46]"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700"
                        style={{
                          backgroundImage: `url(${getAttractionImage(highlight)})`
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                        className="absolute top-3 right-3 w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-white font-semibold text-sm leading-tight group-hover:text-orange-300 transition-colors">
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
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]"
              >
                <h2 className="text-xl font-bold text-white mb-4">Tarifs d'entrée</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#2a2a36] rounded-xl border border-[#3a3a46]">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Ticket className="w-5 h-5 text-orange-400" />
                      <span>Résidents malagasy</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-400">
                      {convert(attraction.entryFeeLocal)}
                    </p>
                  </div>
                  <div className="p-4 bg-[#2a2a36] rounded-xl border border-[#3a3a46]">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Ticket className="w-5 h-5 text-pink-400" />
                      <span>Touristes étrangers</span>
                    </div>
                    <p className="text-2xl font-bold text-pink-400">
                      {convert(attraction.entryFeeForeign)}
                    </p>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Infos pratiques */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]"
            >
              <h2 className="text-xl font-bold text-white mb-4">Informations pratiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {attraction.visitDuration && (
                  <div className="flex items-center gap-3 p-3 bg-[#2a2a36] rounded-xl border border-[#3a3a46]">
                    <Clock className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-sm text-slate-400">Durée de visite</p>
                      <p className="font-medium text-white">{attraction.visitDuration}</p>
                    </div>
                  </div>
                )}
                {attraction.bestTimeToVisit && (
                  <div className="flex items-center gap-3 p-3 bg-[#2a2a36] rounded-xl border border-[#3a3a46]">
                    <Sun className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-sm text-slate-400">Meilleure période</p>
                      <p className="font-medium text-white">{attraction.bestTimeToVisit}</p>
                    </div>
                  </div>
                )}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  attraction.hasGuide ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#2a2a36] border-[#3a3a46]'
                }`}>
                  <Users className={`w-5 h-5 ${attraction.hasGuide ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-sm text-slate-400">Guide</p>
                    <p className={`font-medium ${attraction.hasGuide ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {attraction.hasGuide ? 'Disponible' : 'Non disponible'}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  attraction.isAccessible ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#2a2a36] border-[#3a3a46]'
                }`}>
                  <Accessibility className={`w-5 h-5 ${attraction.isAccessible ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-sm text-slate-400">Accessibilité</p>
                    <p className={`font-medium ${attraction.isAccessible ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {attraction.isAccessible ? 'Accessible' : 'Non accessible'}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  attraction.hasParking ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#2a2a36] border-[#3a3a46]'
                }`}>
                  <ParkingCircle className={`w-5 h-5 ${attraction.hasParking ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <p className="text-sm text-slate-400">Parking</p>
                    <p className={`font-medium ${attraction.hasParking ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {attraction.hasParking ? 'Disponible' : 'Non disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Horaires */}
            {attraction.openingHours && Object.keys(attraction.openingHours).length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]"
              >
                <h2 className="text-xl font-bold text-white mb-4">Horaires d'ouverture</h2>
                <div className="space-y-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const hours = attraction.openingHours[day];
                    const now = new Date();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const isToday = dayNames[now.getDay()] === day;

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                          isToday ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-[#2a2a36]/50'
                        }`}
                      >
                        <span className={`font-medium ${isToday ? 'text-orange-400' : 'text-slate-300'}`}>
                          {dayLabels[day]}
                          {isToday && <span className="ml-2 text-xs text-orange-400/70">(aujourd'hui)</span>}
                        </span>
                        {hours?.closed ? (
                          <span className="text-slate-500">Fermé</span>
                        ) : hours ? (
                          <span className="text-slate-300">{hours.open} - {hours.close}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            )}

            {/* Avis détaillés */}
            {attraction.reviews?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <ReviewPreview
                  reviews={attraction.reviews}
                  maxReviews={2}
                  rating={attraction.rating}
                  reviewCount={attraction.reviewCount}
                  establishmentId={attraction.id}
                />
              </motion.div>
            )}

            {/* Events nearby */}
            <EstablishmentEvents establishmentId={attraction.id} city={attraction.city} />
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] lg:sticky lg:top-24">
              <PromoBanner establishmentId={attraction.id} />
              <FomoBanner establishmentId={attraction.id} />

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">Tarif d'entrée</p>
                  {attraction.isFree ? (
                    <p className="text-2xl font-bold text-emerald-400">Gratuit</p>
                  ) : (
                    <p className="text-2xl font-bold text-orange-400">
                      {convert(attraction.entryFeeLocal)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-yellow-400">{attraction.rating?.toFixed(1)}</span>
                </div>
              </div>

              {/* Info box */}
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-xl mb-4 border border-orange-500/20">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1 text-orange-400">Conseils de visite</p>
                    <p className="text-slate-300">
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

              {/* Booking + Chat Widget */}
              <BookingChatWidget
                establishmentId={attraction.id}
                establishmentName={attraction.name}
                establishmentType="attraction"
                ownerId={(attraction as any).claimedByUserId || null}
                pricePerNight={null}
              />

              {/* Contact */}
              <EnhancedContactButtons
                phone={attraction.phone}
                whatsapp={attraction.whatsapp}
                email={attraction.email}
                establishmentName={attraction.name}
                establishmentId={attraction.id}
              />

              {/* Liens sociaux */}
              {(attraction.website || attraction.facebook || attraction.instagram) && (
                <div className="mt-4 pt-4 border-t border-[#2a2a36]">
                  <SocialLinks
                    website={attraction.website}
                    facebook={attraction.facebook}
                    instagram={attraction.instagram}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Localisation & Directions — full width below grid */}
        {(attraction.latitude && attraction.longitude) && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DirectionsWidget
              destinationLat={attraction.latitude}
              destinationLng={attraction.longitude}
              destinationName={attraction.name}
              city={attraction.city}
              district={attraction.district}
            />
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

        {/* Source Attribution pour fiches importées */}
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
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Attractions similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarAttractions.map((a) => {
                const SimilarTypeIcon = typeIcons[a.attractionType] || Camera;
                return (
                  <Link
                    key={a.id}
                    href={`/bons-plans/attractions/${a.slug}`}
                    className="group bg-[#1a1a24] rounded-xl overflow-hidden border border-[#2a2a36] hover:border-orange-500/50 transition-all"
                  >
                    <div
                      className="relative h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{
                        backgroundImage: `url(${getAttractionImage(a.name, a.coverImage)})`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium rounded-full">
                        <SimilarTypeIcon className="w-3 h-3" />
                        {typeLabels[a.attractionType]}
                      </div>
                      <div className="absolute top-3 right-3">
                        {a.isFree ? (
                          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/30">
                            Gratuit
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/10">
                            {a.entryFeeLocal?.toLocaleString()} Ar
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                        {a.name}
                      </h3>
                      <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {a.city}
                      </p>
                      <div className="flex items-center gap-1 mt-3">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-white">{a.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
