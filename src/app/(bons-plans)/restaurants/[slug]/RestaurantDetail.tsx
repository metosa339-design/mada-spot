'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin, Clock, Wifi, Truck, ShoppingBag, ChevronLeft, ChevronRight, Heart, Share2, MessageCircle, X, ArrowLeft, UtensilsCrossed, Coffee, Wine, Image as ImageIcon, FileText, Zap, Car, Smartphone, Music, Cigarette, Baby, Dog, Accessibility, Calendar, CheckCircle2, ThumbsUp, AlertCircle, Sparkles, ZoomIn } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const DirectionsWidget = dynamic(() => import('@/components/maps/DirectionsWidget'), { ssr: false });
import SourceAttribution from '@/components/bons-plans/SourceAttribution';
import EstablishmentDescription from '@/components/bons-plans/EstablishmentDescription';
import BookingChatWidget from '@/components/bons-plans/BookingChatWidget';
import SocialLinks from '@/components/bons-plans/SocialLinks';
import LanguageToggle from '@/components/ui/LanguageToggle';
import CurrencyToggle from '@/components/ui/CurrencyToggle';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/contexts/ToastContext';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import FomoBanner from '@/components/bons-plans/FomoBanner';
import PromoBanner from '@/components/bons-plans/PromoBanner';
import EstablishmentEvents from '@/components/bons-plans/EstablishmentEvents';
import OwnerBio from '@/components/bons-plans/OwnerBio';
import CategorizedGallery from '@/components/bons-plans/CategorizedGallery';
import PhotoGallerySection from '@/components/bons-plans/PhotoGallerySection';
import EnhancedContactButtons from '@/components/bons-plans/EnhancedContactButtons';
import AccessInfo from '@/components/bons-plans/AccessInfo';
import { getImageUrl } from '@/lib/image-url';
import { getEstablishmentImage } from '@/lib/establishment-image';

interface Restaurant {
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
  category: string;
  cuisineTypes: string[];
  priceRange: string;
  menuImages: string[];
  menuPdfUrl: string;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  hasDelivery: boolean;
  hasTakeaway: boolean;
  hasWifi: boolean;
  hasParking: boolean;
  hasReservation: boolean;
  avgMainCourse: number;
  avgBeer: number;
  // Nouvelles propriétés Madagascar
  hasGenerator: boolean;
  hasMobileMoney: boolean;
  hasLiveMusic: boolean;
  liveMusicDays: string[];
  hasSmokingArea: boolean;
  isChildFriendly: boolean;
  isPetFriendly: boolean;
  isAccessible: boolean;
  signatureDish: {
    name: string;
    price: number;
    image: string;
    description: string;
  } | null;
  localLandmark: string;
  lastPriceUpdate: string;
  reviews: Review[];
  // Import metadata
  dataSource?: string;
  sourceUrl?: string;
  sourceAttribution?: string;
  isClaimed?: boolean;
  claimedByUserId?: string | null;
  owner?: { firstName: string; lastName: string; avatar?: string | null; memberSince: string } | null;
  // Multilingual
  nameEn?: string;
  descriptionEn?: string;
  shortDescriptionEn?: string;
}

interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  createdAt: string;
  ownerResponse?: string;
  ownerResponseDate?: string;
  isVerified: boolean;
  helpfulCount: number;
}

const categoryLabels: Record<string, string> = {
  GARGOTE: 'Gargote',
  RESTAURANT: 'Restaurant',
  LOUNGE: 'Lounge & Bar',
  CAFE: 'Café',
  FAST_FOOD: 'Fast Food',
  STREET_FOOD: 'Street Food',
};

const categoryIcons: Record<string, any> = {
  GARGOTE: Coffee,
  RESTAURANT: UtensilsCrossed,
  LOUNGE: Wine,
  CAFE: Coffee,
  FAST_FOOD: ShoppingBag,
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

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function RestaurantDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const { success: toastSuccess } = useToast();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [similarRestaurants, setSimilarRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenuGallery, setShowMenuGallery] = useState(false);
  const [menuImageIndex, setMenuImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [zoomedMenu, setZoomedMenu] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true);
      setRestaurant(null);
      setSimilarRestaurants([]);
      window.scrollTo(0, 0);
      try {
        const response = await fetch(`/api/bons-plans/restaurants/${slug}`);
        const data = await response.json();
        if (data.restaurant) {
          setRestaurant(data.restaurant);
          setSimilarRestaurants(data.similarRestaurants || []);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchRestaurant();
    }
  }, [slug]);

  const getPriceRangeSymbol = (range: string) => {
    switch (range) {
      case 'BUDGET': return '€';
      case 'MODERATE': return '€€';
      case 'UPSCALE': return '€€€';
      case 'LUXURY': return '€€€€';
      default: return '';
    }
  };

  const getPriceRangeLabel = (range: string) => {
    switch (range) {
      case 'BUDGET': return 'Budget - Moins de 15 000 Ar';
      case 'MODERATE': return 'Modéré - 15 000 à 40 000 Ar';
      case 'UPSCALE': return 'Haut de gamme - 40 000 à 80 000 Ar';
      case 'LUXURY': return 'Luxe - Plus de 80 000 Ar';
      default: return '';
    }
  };

  // Calculer le statut d'ouverture dynamique
  const openStatus = useMemo(() => {
    if (!restaurant?.openingHours) return null;

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[now.getDay()];
    const hours = restaurant.openingHours[today];

    if (!hours || hours.closed) {
      return { isOpen: false, message: 'Fermé aujourd\'hui', nextOpen: getNextOpenTime(restaurant.openingHours, now) };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes < openMinutes) {
      return { isOpen: false, message: `Ouvre à ${hours.open}`, color: 'text-amber-600' };
    } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minutesLeft = closeMinutes - currentMinutes;
      if (minutesLeft <= 60) {
        return { isOpen: true, message: `Ferme bientôt (${hours.close})`, color: 'text-amber-600' };
      }
      return { isOpen: true, message: `Ouvert jusqu'à ${hours.close}`, color: 'text-green-400' };
    } else {
      return { isOpen: false, message: 'Fermé', nextOpen: getNextOpenTime(restaurant.openingHours, now) };
    }
  }, [restaurant?.openingHours]);

  function getNextOpenTime(openingHours: Record<string, any>, now: Date): string | null {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = now.getDay();

    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDay + i) % 7;
      const nextDay = dayNames[nextDayIndex];
      const hours = openingHours[nextDay];

      if (hours && !hours.closed) {
        if (i === 1) return `Demain à ${hours.open}`;
        return `${dayLabels[nextDay]} à ${hours.open}`;
      }
    }
    return null;
  }

  // Calculer le temps depuis la dernière mise à jour des prix
  const priceUpdateText = useMemo(() => {
    if (!restaurant?.lastPriceUpdate) return 'Prix non vérifiés';

    const updateDate = new Date(restaurant.lastPriceUpdate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Prix vérifiés aujourd\'hui';
    if (diffDays === 1) return 'Prix vérifiés hier';
    if (diffDays < 7) return `Prix vérifiés il y a ${diffDays} jours`;
    if (diffDays < 14) return 'Prix vérifiés la semaine dernière';
    if (diffDays < 30) return `Prix vérifiés il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Prix vérifiés il y a ${Math.floor(diffDays / 30)} mois`;
  }, [restaurant?.lastPriceUpdate]);

  const { t } = useLanguage();
  const { convert } = useCurrency();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-white rounded-2xl border border-[#E2E8F0]" />
            <div className="h-8 bg-white rounded w-1/3" />
            <div className="h-4 bg-white rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-[#CBD5E1] mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Restaurant non trouvé</h1>
          <p className="text-[#64748B] mb-6">Le restaurant que vous recherchez n&apos;existe pas.</p>
          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux restaurants
          </Link>
        </div>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[restaurant.category] || UtensilsCrossed;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ==================== 1. EN-TÊTE VISUEL ==================== */}
      <div className="relative h-[50vh] md:h-[60vh] bg-[#F8FAFC]">
        <CategorizedGallery
          coverImage={restaurant.coverImage}
          images={restaurant.images || []}
          categories={restaurant.menuImages?.length > 0 ? [
            { label: 'Carte & Menu', images: restaurant.menuImages },
          ] : []}
          establishmentName={restaurant.name}
          fallbackImage={getEstablishmentImage('RESTAURANT', restaurant.city, restaurant.name)}
        />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Navigation */}
        <Link
          href="/restaurants"
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:bg-white/90 hover:border-[#CBD5E1] transition-colors z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline text-[13px] font-medium">Retour</span>
        </Link>

        {/* Actions */}
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
              const title = restaurant?.name || 'Restaurant sur Mada Spot';
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

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {/* Catégorie */}
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                <CategoryIcon className="w-3.5 h-3.5" />
                {categoryLabels[restaurant.category]}
              </span>

              {/* Gamme de prix */}
              <span className="px-2.5 py-1 bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[#0F172A] rounded-md text-[12px] font-mono font-semibold">
                {getPriceRangeSymbol(restaurant.priceRange)}
              </span>

              {/* Badge Statut Ouverture */}
              {openStatus && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  openStatus.isOpen
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {openStatus.message}
                </span>
              )}

              {restaurant.isFeatured && (
                <span className="px-2.5 py-1 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                  Recommandé
                </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-3 flex items-center gap-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {restaurant.name}
              {restaurant.isClaimed && <VerifiedBadge variant="verified" size="lg" />}
            </h1>

            {/* Infos rapides */}
            <div className="flex flex-wrap items-center gap-4 text-[#334155] text-[14px]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#64748B]" />
                {restaurant.district}, {restaurant.city}
              </span>

              {/* Note communautaire */}
              {restaurant.reviewCount > 0 ? (
                <span className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md border border-[#E2E8F0] px-3 py-1 rounded-md">
                  <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                  <span className="font-mono text-[#0F172A]">{restaurant.rating?.toFixed(1)}</span>
                  <span className="text-[#64748B] text-[12px]">({restaurant.reviewCount} avis)</span>
                </span>
              ) : (
                <span className="bg-white/70 backdrop-blur-md border border-[#E2E8F0] px-3 py-1 rounded-md text-[#64748B] text-[12px]">
                  Nouveau
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Bons Plans', href: '/bons-plans' },
            { label: 'Restaurants', href: '/restaurants' },
            { label: restaurant.name },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* ==================== 2. BLOC MENU-SCOPE ==================== */}
            {(restaurant.menuImages?.length > 0 || restaurant.signatureDish) && (
              <section className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6 gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-2">Menu-Scope</p>
                      <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#FF6B35]" />
                        Menu &amp; prix
                      </h2>
                      <p className="text-[#64748B] text-[13px] mt-1">
                        Photos du menu avec prix réels
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[#94A3B8] text-[12px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {priceUpdateText}
                      </div>
                    </div>
                    {restaurant.menuPdfUrl && (
                      <a
                        href={restaurant.menuPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-[#0F172A] text-[13px] font-medium transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Télécharger PDF
                      </a>
                    )}
                  </div>

                  {/* Plat Signature */}
                  {restaurant.signatureDish && (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-6">
                      <div className="flex items-center gap-2 mb-4 text-[#FF6B35]">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">Plat signature</span>
                      </div>
                      <div className="flex gap-4">
                        {restaurant.signatureDish.image && (
                          <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-[#E2E8F0] shrink-0">
                            <Image
                              src={getImageUrl(restaurant.signatureDish.image)}
                              alt={restaurant.signatureDish.name}
                              width={112}
                              height={112}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-[18px] font-semibold text-[#0F172A]">{restaurant.signatureDish.name}</h3>
                          <p className="text-[#64748B] text-[13px] mt-1 leading-relaxed">{restaurant.signatureDish.description}</p>
                          <p className="text-[22px] font-semibold font-mono text-[#0F172A] mt-2">
                            {convert(restaurant.signatureDish.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Galerie de menus */}
                  {restaurant.menuImages?.length > 0 && (
                    <>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {restaurant.menuImages.slice(0, 4).map((img, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setMenuImageIndex(index);
                              setShowMenuGallery(true);
                            }}
                            className="relative aspect-[3/4] rounded-lg overflow-hidden group border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
                          >
                            <Image
                              src={img}
                              alt={`Menu page ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 33vw, 25vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {index === 3 && restaurant.menuImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <span className="text-[18px] font-semibold font-mono text-white">+{restaurant.menuImages.length - 4}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setMenuImageIndex(0);
                          setShowMenuGallery(true);
                        }}
                        className="mt-4 w-full py-3 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F172A] text-[13px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        Voir tout le menu ({restaurant.menuImages.length} pages)
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Prix moyens */}
            {(restaurant.avgMainCourse || restaurant.avgBeer) && (
              <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Tarifs</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-5">
                  Prix moyens constatés
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {restaurant.avgMainCourse && (
                    <div className="p-5 bg-white rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-2 text-[#FF6B35] mb-2">
                        <UtensilsCrossed className="w-4 h-4" />
                        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold">Plat principal</span>
                      </div>
                      <p className="text-[24px] font-semibold font-mono text-[#0F172A]">
                        ~{convert(restaurant.avgMainCourse)}
                      </p>
                    </div>
                  )}
                  {restaurant.avgBeer && (
                    <div className="p-5 bg-white rounded-lg border border-[#E2E8F0]">
                      <div className="flex items-center gap-2 text-[#FF6B35] mb-2">
                        <Coffee className="w-4 h-4" />
                        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold">Boisson</span>
                      </div>
                      <p className="text-[24px] font-semibold font-mono text-[#0F172A]">
                        ~{convert(restaurant.avgBeer)}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[12px] text-[#64748B] mt-4 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {getPriceRangeLabel(restaurant.priceRange)}
                </p>
              </section>
            )}

            {/* Description */}
            <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">À propos</p>
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-4">
                L&apos;établissement
              </h2>
              <EstablishmentDescription
                className="max-w-[65ch]"
                text={t(restaurant.description || restaurant.shortDescription, restaurant.descriptionEn || restaurant.shortDescriptionEn)}
              />

              {restaurant.cuisineTypes?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-[#E2E8F0]">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] mb-3">Types de cuisine</p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisineTypes.map((cuisine) => (
                      <span
                        key={cuisine}
                        className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px] font-medium"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Photo Gallery */}
            {(restaurant.coverImage || restaurant.images?.length > 0 || restaurant.gallery?.length) && (
              <PhotoGallerySection
                images={restaurant.images || []}
                gallery={restaurant.gallery}
                coverImage={restaurant.coverImage}
              />
            )}

            {restaurant.owner && <OwnerBio owner={restaurant.owner} establishmentName={restaurant.name} />}

            {/* ==================== 3. INFOS PRATIQUES MADAGASCAR ==================== */}
            <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Check-list Mada</p>
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
                Infos pratiques
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Groupe électrogène */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  restaurant.hasGenerator
                    ? 'bg-white border-[#CBD5E1]'
                    : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    restaurant.hasGenerator ? 'bg-[#FFF7ED] border border-[#FF6B35]/20' : 'bg-[#F1F5F9]'
                  }`}>
                    <Zap className={`w-4 h-4 ${restaurant.hasGenerator ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">Groupe électrogène</p>
                    <p className="text-[11px] text-[#64748B]">
                      {restaurant.hasGenerator ? 'Service continu' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* WiFi */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  restaurant.hasWifi
                    ? 'bg-white border-[#CBD5E1]'
                    : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    restaurant.hasWifi ? 'bg-[#FFF7ED] border border-[#FF6B35]/20' : 'bg-[#F1F5F9]'
                  }`}>
                    <Wifi className={`w-4 h-4 ${restaurant.hasWifi ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">WiFi gratuit</p>
                    <p className="text-[11px] text-[#64748B]">
                      {restaurant.hasWifi ? 'Haut débit' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Parking */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  restaurant.hasParking
                    ? 'bg-white border-[#CBD5E1]'
                    : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    restaurant.hasParking ? 'bg-[#FFF7ED] border border-[#FF6B35]/20' : 'bg-[#F1F5F9]'
                  }`}>
                    <Car className={`w-4 h-4 ${restaurant.hasParking ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">Parking sécurisé</p>
                    <p className="text-[11px] text-[#64748B]">
                      {restaurant.hasParking ? 'Gardien présent' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Mobile Money */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  restaurant.hasMobileMoney
                    ? 'bg-white border-[#CBD5E1]'
                    : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    restaurant.hasMobileMoney ? 'bg-[#FFF7ED] border border-[#FF6B35]/20' : 'bg-[#F1F5F9]'
                  }`}>
                    <Smartphone className={`w-4 h-4 ${restaurant.hasMobileMoney ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">Mobile Money</p>
                    <p className="text-[11px] text-[#64748B]">
                      {restaurant.hasMobileMoney ? 'MVola / OM' : 'Espèces uniquement'}
                    </p>
                  </div>
                </div>

                {/* Live Music */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  restaurant.hasLiveMusic
                    ? 'bg-white border-[#CBD5E1]'
                    : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    restaurant.hasLiveMusic ? 'bg-[#FFF7ED] border border-[#FF6B35]/20' : 'bg-[#F1F5F9]'
                  }`}>
                    <Music className={`w-4 h-4 ${restaurant.hasLiveMusic ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">Live Music</p>
                    <p className="text-[11px] text-[#64748B]">
                      {restaurant.hasLiveMusic
                        ? restaurant.liveMusicDays?.join(', ') || 'Certains soirs'
                        : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Espace fumeur */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  restaurant.hasSmokingArea
                    ? 'bg-white border-[#CBD5E1]'
                    : 'bg-white/50 border-[#E2E8F0]'
                }`}>
                  <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                    restaurant.hasSmokingArea ? 'bg-[#FFF7ED] border border-[#FF6B35]/20' : 'bg-[#F1F5F9]'
                  }`}>
                    <Cigarette className={`w-4 h-4 ${restaurant.hasSmokingArea ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-[#0F172A] text-[13px]">Espace fumeur</p>
                    <p className="text-[11px] text-[#64748B]">
                      {restaurant.hasSmokingArea ? 'Terrasse dédiée' : 'Non-fumeur'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Autres services */}
              <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] mb-3">Autres services</p>
                <div className="flex flex-wrap gap-2">
                  {restaurant.hasDelivery && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px]">
                      <Truck className="w-3.5 h-3.5 text-[#FF6B35]" /> Livraison
                    </span>
                  )}
                  {restaurant.hasTakeaway && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px]">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#FF6B35]" /> À emporter
                    </span>
                  )}
                  {restaurant.hasReservation && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px]">
                      <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" /> Réservation
                    </span>
                  )}
                  {restaurant.isChildFriendly && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px]">
                      <Baby className="w-3.5 h-3.5 text-[#FF6B35]" /> Enfants bienvenus
                    </span>
                  )}
                  {restaurant.isPetFriendly && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px]">
                      <Dog className="w-3.5 h-3.5 text-[#FF6B35]" /> Animaux acceptés
                    </span>
                  )}
                  {restaurant.isAccessible && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#334155] rounded-md text-[12px]">
                      <Accessibility className="w-3.5 h-3.5 text-[#FF6B35]" /> Accessible PMR
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Horaires */}
            {restaurant.openingHours && Object.keys(restaurant.openingHours).length > 0 && (
              <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Horaires</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-4">
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-1.5">
                  {dayOrder.map((day) => {
                    const hours = restaurant.openingHours[day];
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
                          {isToday && (
                            <span className="ml-2 text-[11px] text-[#FF6B35]/70">(aujourd&apos;hui)</span>
                          )}
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
              </section>
            )}

            {/* ==================== 5. SECTION AVIS & PREUVE SOCIALE ==================== */}
            {restaurant.reviews?.length > 0 && (
              <section className="bg-white border border-[#E2E8F0] rounded-xl p-6 md:p-8">
                <div className="flex items-center justify-between mb-6 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Communauté</p>
                    <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A]">
                      Avis clients vérifiés
                    </h2>
                    <p className="text-[13px] text-[#64748B] mt-1">
                      {restaurant.reviewCount} avis de vrais clients
                    </p>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-lg">
                      <Star className="w-5 h-5 text-[#FF6B35] fill-[#FF6B35]" />
                      <span className="text-[22px] font-semibold font-mono text-[#0F172A]">{restaurant.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {restaurant.reviews.map((review) => (
                    <div key={review.id} className="border-b border-[#E2E8F0] pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-[#FF6B35] to-amber-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                          {review.authorAvatar ? (
                            <Image src={getImageUrl(review.authorAvatar)} alt={review.authorName || 'Auteur'} fill sizes="44px" className="rounded-full object-cover" />
                          ) : (
                            review.authorName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[#0F172A] text-[14px] flex items-center gap-2 flex-wrap">
                                {review.authorName}
                                {review.isVerified && (
                                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    <CheckCircle2 className="w-3 h-3" /> Vérifié
                                  </span>
                                )}
                              </p>
                              <p className="text-[12px] font-mono text-[#94A3B8] mt-0.5">
                                {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < review.rating ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#CBD5E1]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {review.title && (
                            <p className="font-medium text-[#0F172A] text-[14px] mt-3">{review.title}</p>
                          )}
                          <p className="text-[#334155] text-[13px] mt-1 leading-relaxed">{review.comment}</p>

                          {/* Photos du client */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#E2E8F0]">
                                  <Image
                                    src={img}
                                    alt={`Photo de ${review.authorName}`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Bouton utile */}
                          <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1.5 text-[12px] text-[#64748B] hover:text-[#FF6B35] transition-colors">
                              <ThumbsUp className="w-3.5 h-3.5" />
                              Utile ({review.helpfulCount || 0})
                            </button>
                          </div>

                          {/* Réponse du propriétaire */}
                          {review.ownerResponse && (
                            <div className="mt-4 ml-2 p-4 bg-white rounded-lg border-l-2 border-[#FF6B35]">
                              <p className="text-[12px] font-semibold text-[#FF6B35] mb-2 flex items-center gap-2">
                                <MessageCircle className="w-3.5 h-3.5" />
                                Réponse de l&apos;établissement
                                {review.ownerResponseDate && (
                                  <span className="font-normal font-mono text-[#94A3B8]">
                                    • {new Date(review.ownerResponseDate).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </p>
                              <p className="text-[13px] text-[#334155] leading-relaxed">{review.ownerResponse}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bouton voir plus d'avis */}
                {restaurant.reviewCount > restaurant.reviews.length && (
                  <button className="mt-6 w-full py-3 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F172A] text-[13px] font-medium rounded-lg transition-colors">
                    Voir les {restaurant.reviewCount - restaurant.reviews.length} autres avis
                  </button>
                )}
              </section>
            )}

            <EstablishmentEvents establishmentId={restaurant.id} city={restaurant.city} />

          </div>

          {/* ==================== SIDEBAR ==================== */}
          <div>
            <div className="lg:sticky lg:top-24 space-y-6">
            <PromoBanner establishmentId={restaurant.id} />
            <FomoBanner establishmentId={restaurant.id} />
            {/* Contact card */}
            <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-semibold font-mono text-[#0F172A]">
                    {getPriceRangeSymbol(restaurant.priceRange)}
                  </span>
                  <span className="text-[12px] text-[#64748B]">{categoryLabels[restaurant.category]}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg">
                  <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                  <span className="font-mono text-[#0F172A] text-[13px]">{restaurant.rating?.toFixed(1)}</span>
                </div>
              </div>

              {/* Statut d'ouverture */}
              {openStatus && (
                <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 border ${
                  openStatus.isOpen
                    ? 'bg-emerald-500/8 border-emerald-500/25'
                    : 'bg-red-500/8 border-red-500/25'
                }`}>
                  <Clock className={`w-4 h-4 shrink-0 ${openStatus.isOpen ? 'text-emerald-400' : 'text-red-400'}`} />
                  <div className="min-w-0">
                    <p className={`text-[13px] font-medium ${openStatus.isOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                      {openStatus.message}
                    </p>
                    {!openStatus.isOpen && openStatus.nextOpen && (
                      <p className="text-[11px] text-[#64748B] mt-0.5">Prochaine ouverture : {openStatus.nextOpen}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Booking + Chat Widget */}
              <BookingChatWidget
                establishmentId={restaurant.id}
                establishmentName={restaurant.name}
                establishmentType="restaurant"
                ownerId={restaurant.claimedByUserId || null}
                pricePerNight={null}
              />

              {/* Contact direct */}
              <EnhancedContactButtons
                phone={restaurant.phone}
                whatsapp={restaurant.whatsapp}
                email={restaurant.email}
                establishmentName={restaurant.name}
                establishmentId={restaurant.id}
              />

              {(restaurant.website || restaurant.facebook || restaurant.instagram) && (
                <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                  <SocialLinks
                    website={restaurant.website}
                    facebook={restaurant.facebook}
                    instagram={restaurant.instagram}
                  />
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* ==================== CARTE & ACCÈS — full width below grid ==================== */}
        {restaurant.latitude && restaurant.longitude && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
              <DirectionsWidget
                destinationLat={restaurant.latitude}
                destinationLng={restaurant.longitude}
                destinationName={restaurant.name}
                city={restaurant.city}
                district={restaurant.district}
              />
            </div>

            <div className="space-y-6">
              {/* Adresse et repères */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 space-y-4 self-start">
                <p className="text-[13px] text-[#334155] leading-relaxed">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] block mb-1">Adresse</span>
                  {restaurant.address || `${restaurant.district}, ${restaurant.city}, ${restaurant.region}`}
                </p>
                {restaurant.localLandmark && (
                  <div className="text-[13px] text-[#334155] bg-white p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] block mb-1">Repère</span>
                    {restaurant.localLandmark}
                  </div>
                )}
              </div>
              <AccessInfo
                city={restaurant.city}
                district={restaurant.district}
                address={restaurant.address}
                hasParking={restaurant.hasParking}
                latitude={restaurant.latitude}
                longitude={restaurant.longitude}
              />
            </div>
          </div>
        )}

        {/* Source Attribution pour fiches importées */}
        {restaurant.dataSource && restaurant.dataSource !== 'manual' && (
          <div className="mt-8 max-w-4xl">
            <SourceAttribution
              establishmentId={restaurant.id}
              establishmentName={restaurant.name}
              sourceAttribution={restaurant.sourceAttribution}
              sourceUrl={restaurant.sourceUrl}
              isClaimed={restaurant.isClaimed}
              dataSource={restaurant.dataSource}
            />
          </div>
        )}

        {/* Restaurants similaires */}
        {similarRestaurants.length > 0 && (
          <section className="mt-12">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Continuer l&apos;exploration</p>
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
              Restaurants similaires
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarRestaurants.map((r) => (
                <motion.div
                  key={r.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={`/restaurants/${r.slug}`}
                    className="group block bg-white rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="relative h-48 bg-white">
                      <Image
                        src={getEstablishmentImage('RESTAURANT', r.city, r.name, r.coverImage)}
                        alt={r.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#FFF7ED] backdrop-blur-md border border-[#FF6B35]/30 text-[#FF6B35] text-[11px] font-semibold uppercase tracking-[0.1em] rounded-md">
                        {categoryLabels[r.category]}
                      </div>
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/80 backdrop-blur-md border border-[#E2E8F0] text-[#0F172A] text-[12px] font-mono font-semibold rounded-md">
                        {getPriceRangeSymbol(r.priceRange)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#0F172A] text-[14px] group-hover:text-[#FF6B35] transition-colors line-clamp-1">
                        {r.name}
                      </h3>
                      <p className="text-[12px] text-[#64748B] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {r.city}
                      </p>
                      <div className="flex items-center gap-1.5 mt-3">
                        <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                        <span className="font-mono text-[#0F172A] text-[13px]">{r.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ==================== MODAL MENU GALLERY ==================== */}
      <AnimatePresence>
        {showMenuGallery && restaurant.menuImages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={() => setShowMenuGallery(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 text-white">
                <div>
                  <h3 className="font-bold text-lg">Menu - {restaurant.name}</h3>
                  <p className="text-white/70 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    {priceUpdateText}
                  </p>
                </div>
                <button
                  onClick={() => setShowMenuGallery(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Image principale */}
              <div className="flex-1 relative flex items-center justify-center p-4">
                <motion.img
                  key={menuImageIndex}
                  src={restaurant.menuImages[menuImageIndex]}
                  alt={`Menu page ${menuImageIndex + 1}`}
                  className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
                    zoomedMenu ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setZoomedMenu(!zoomedMenu)}
                />

                {/* Navigation */}
                {restaurant.menuImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setMenuImageIndex((prev) => (prev - 1 + restaurant.menuImages.length) % restaurant.menuImages.length)}
                      className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setMenuImageIndex((prev) => (prev + 1) % restaurant.menuImages.length)}
                      className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Footer avec thumbnails */}
              <div className="p-4">
                <p className="text-center text-white mb-3">
                  Page {menuImageIndex + 1} sur {restaurant.menuImages.length}
                </p>
                {restaurant.menuImages.length > 1 && (
                  <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                    {restaurant.menuImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setMenuImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border transition-all relative ${
                          index === menuImageIndex
                            ? 'border-[#FF6B35]'
                            : 'border-[#E2E8F0] opacity-50 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`Menu thumb ${index + 1}`}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
