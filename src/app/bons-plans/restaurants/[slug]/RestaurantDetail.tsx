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
import EnhancedContactButtons from '@/components/bons-plans/EnhancedContactButtons';
import AccessInfo from '@/components/bons-plans/AccessInfo';
import { getImageUrl } from '@/lib/image-url';

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
      <div className="min-h-screen bg-[#12121a] pt-24">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-white/10 rounded-2xl" />
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/10 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#12121a] pt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <UtensilsCrossed className="w-16 h-16 mx-auto text-white/15 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Restaurant non trouvé</h1>
          <p className="text-gray-400 mb-6">Le restaurant que vous recherchez n'existe pas.</p>
          <Link
            href="/bons-plans/restaurants"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/100 text-white rounded-xl hover:bg-orange-600 transition-colors"
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
    <div className="min-h-screen bg-[#12121a]">
      {/* ==================== 1. EN-TÊTE VISUEL (L'effet "Wao") ==================== */}
      <div className="relative h-[50vh] md:h-[60vh] bg-slate-900">
        <CategorizedGallery
          coverImage={restaurant.coverImage}
          images={restaurant.images || []}
          categories={restaurant.menuImages?.length > 0 ? [
            { label: 'Carte & Menu', images: restaurant.menuImages },
          ] : []}
          establishmentName={restaurant.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 pointer-events-none" />

        {/* Navigation */}
        <Link
          href="/bons-plans/restaurants"
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">Retour</span>
        </Link>

        {/* Actions */}
        <div className="absolute top-24 right-4 md:right-8 flex items-center gap-2">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              isFavorite ? 'bg-red-500/100 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
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
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <CurrencyToggle />
          <LanguageToggle />
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {/* Catégorie */}
              <span className="flex items-center gap-1 px-3 py-1.5 bg-orange-500/100 text-white rounded-full text-sm font-medium">
                <CategoryIcon className="w-4 h-4" />
                {categoryLabels[restaurant.category]}
              </span>

              {/* Gamme de prix */}
              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold">
                {getPriceRangeSymbol(restaurant.priceRange)}
              </span>

              {/* Badge Statut Ouverture */}
              {openStatus && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                  openStatus.isOpen
                    ? 'bg-green-500/100 text-white'
                    : 'bg-red-500/100/90 text-white'
                }`}>
                  <Clock className="w-4 h-4" />
                  {openStatus.message}
                </span>
              )}

              {restaurant.isFeatured && (
                <span className="px-3 py-1.5 bg-yellow-400 text-yellow-900 rounded-full text-sm font-medium">
                  ⭐ Recommandé
                </span>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-2">
              {restaurant.name}
              {restaurant.isClaimed && <VerifiedBadge variant="verified" size="lg" />}
            </h1>

            {/* Infos rapides */}
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {restaurant.district}, {restaurant.city}
              </span>

              {/* Note communautaire */}
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{restaurant.rating?.toFixed(1)}</span>
                <span className="text-white/70">({restaurant.reviewCount} avis vérifiés)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Breadcrumbs
          items={[
            { label: 'Bons Plans', href: '/bons-plans' },
            { label: 'Restaurants', href: '/bons-plans/restaurants' },
            { label: restaurant.name },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* ==================== 2. BLOC MENU-SCOPE ==================== */}
            {(restaurant.menuImages?.length > 0 || restaurant.signatureDish) && (
              <section className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ImageIcon className="w-7 h-7" />
                        Menu-Scope
                      </h2>
                      <p className="text-white/80 mt-1">
                        Photos du menu avec prix réels
                      </p>
                      {/* Date de mise à jour des prix */}
                      <div className="flex items-center gap-2 mt-2 text-white/70 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        {priceUpdateText}
                      </div>
                    </div>
                    {restaurant.menuPdfUrl && (
                      <a
                        href={restaurant.menuPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-white"
                      >
                        <FileText className="w-4 h-4" />
                        Télécharger PDF
                      </a>
                    )}
                  </div>

                  {/* Plat Signature */}
                  {restaurant.signatureDish && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-2 mb-3 text-yellow-300">
                        <Sparkles className="w-5 h-5" />
                        <span className="font-semibold">Plat Signature - Le plus commandé</span>
                      </div>
                      <div className="flex gap-4">
                        {restaurant.signatureDish.image && (
                          <Image
                            src={getImageUrl(restaurant.signatureDish.image)}
                            alt={restaurant.signatureDish.name}
                            width={128}
                            height={128}
                            className="w-32 h-32 rounded-xl object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{restaurant.signatureDish.name}</h3>
                          <p className="text-white/80 text-sm mt-1">{restaurant.signatureDish.description}</p>
                          <p className="text-3xl font-bold text-yellow-300 mt-3">
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
                            className="relative aspect-[3/4] rounded-lg overflow-hidden group"
                          >
                            <Image
                              src={img}
                              alt={`Menu page ${index + 1}`}
                              fill
                              sizes="(max-width: 768px) 33vw, 25vw"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {index === 3 && restaurant.menuImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-xl font-bold text-white">+{restaurant.menuImages.length - 4}</span>
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
                        className="mt-4 w-full py-3 bg-[#1a1a24] text-orange-400 font-semibold rounded-xl hover:bg-[#1a1a24]/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-5 h-5" />
                        Voir tout le menu ({restaurant.menuImages.length} pages)
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Prix moyens */}
            {(restaurant.avgMainCourse || restaurant.avgBeer) && (
              <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-white mb-4">Prix moyens constatés</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {restaurant.avgMainCourse && (
                    <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                      <div className="flex items-center gap-2 text-orange-400 mb-1">
                        <UtensilsCrossed className="w-5 h-5" />
                        <span className="font-medium">Plat principal</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ~{convert(restaurant.avgMainCourse)}
                      </p>
                    </div>
                  )}
                  {restaurant.avgBeer && (
                    <div className="p-4 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <Coffee className="w-5 h-5" />
                        <span className="font-medium">Boisson (bière/soda)</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ~{convert(restaurant.avgBeer)}
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {getPriceRangeLabel(restaurant.priceRange)}
                </p>
              </section>
            )}

            {/* Description */}
            <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-4">À propos</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                {t(restaurant.description || restaurant.shortDescription, restaurant.descriptionEn || restaurant.shortDescriptionEn)}
              </p>

              {restaurant.cuisineTypes?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2a2a36]">
                  <p className="text-sm font-medium text-gray-300 mb-2">Types de cuisine</p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisineTypes.map((cuisine) => (
                      <span
                        key={cuisine}
                        className="px-3 py-1 bg-orange-500/20 text-orange-700 rounded-full text-sm font-medium"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {restaurant.owner && <OwnerBio owner={restaurant.owner} establishmentName={restaurant.name} />}

            {/* ==================== 3. INFOS PRATIQUES MADAGASCAR ==================== */}
            <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-6">
                Infos pratiques
                <span className="ml-2 text-sm font-normal text-gray-400">Check-list Mada</span>
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Groupe électrogène */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  restaurant.hasGenerator ? 'bg-green-500/10 border border-green-500/30' : 'bg-[#12121a]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    restaurant.hasGenerator ? 'bg-green-500/20' : 'bg-white/10'
                  }`}>
                    <Zap className={`w-5 h-5 ${restaurant.hasGenerator ? 'text-green-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Groupe électrogène</p>
                    <p className="text-xs text-gray-400">
                      {restaurant.hasGenerator ? 'Service continu garanti' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* WiFi */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  restaurant.hasWifi ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-[#12121a]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    restaurant.hasWifi ? 'bg-blue-500/20' : 'bg-white/10'
                  }`}>
                    <Wifi className={`w-5 h-5 ${restaurant.hasWifi ? 'text-blue-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">WiFi gratuit</p>
                    <p className="text-xs text-gray-400">
                      {restaurant.hasWifi ? 'Haut débit disponible' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Parking */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  restaurant.hasParking ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-[#12121a]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    restaurant.hasParking ? 'bg-purple-500/20' : 'bg-white/10'
                  }`}>
                    <Car className={`w-5 h-5 ${restaurant.hasParking ? 'text-purple-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Parking sécurisé</p>
                    <p className="text-xs text-gray-400">
                      {restaurant.hasParking ? 'Gardien présent' : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Mobile Money */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  restaurant.hasMobileMoney ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-[#12121a]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    restaurant.hasMobileMoney ? 'bg-orange-500/20' : 'bg-white/10'
                  }`}>
                    <Smartphone className={`w-5 h-5 ${restaurant.hasMobileMoney ? 'text-orange-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Mobile Money</p>
                    <p className="text-xs text-gray-400">
                      {restaurant.hasMobileMoney ? 'MVola / Orange Money' : 'Espèces uniquement'}
                    </p>
                  </div>
                </div>

                {/* Live Music */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  restaurant.hasLiveMusic ? 'bg-pink-500/10 border border-pink-500/30' : 'bg-[#12121a]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    restaurant.hasLiveMusic ? 'bg-pink-500/20' : 'bg-white/10'
                  }`}>
                    <Music className={`w-5 h-5 ${restaurant.hasLiveMusic ? 'text-pink-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Live Music</p>
                    <p className="text-xs text-gray-400">
                      {restaurant.hasLiveMusic
                        ? restaurant.liveMusicDays?.join(', ') || 'Certains soirs'
                        : 'Non disponible'}
                    </p>
                  </div>
                </div>

                {/* Espace fumeur */}
                <div className={`flex items-center gap-3 p-4 rounded-xl ${
                  restaurant.hasSmokingArea ? 'bg-white/5 border border-[#2a2a36]' : 'bg-[#12121a]'
                }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    restaurant.hasSmokingArea ? 'bg-white/10' : 'bg-white/10'
                  }`}>
                    <Cigarette className={`w-5 h-5 ${restaurant.hasSmokingArea ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-white">Espace fumeur</p>
                    <p className="text-xs text-gray-400">
                      {restaurant.hasSmokingArea ? 'Terrasse dédiée' : 'Non-fumeur'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Autres services */}
              <div className="mt-6 pt-6 border-t border-[#2a2a36]">
                <p className="text-sm font-medium text-gray-300 mb-3">Autres services</p>
                <div className="flex flex-wrap gap-2">
                  {restaurant.hasDelivery && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-700 rounded-full text-sm">
                      <Truck className="w-4 h-4" /> Livraison
                    </span>
                  )}
                  {restaurant.hasTakeaway && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-700 rounded-full text-sm">
                      <ShoppingBag className="w-4 h-4" /> À emporter
                    </span>
                  )}
                  {restaurant.hasReservation && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-700 rounded-full text-sm">
                      <Calendar className="w-4 h-4" /> Réservation
                    </span>
                  )}
                  {restaurant.isChildFriendly && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 text-pink-700 rounded-full text-sm">
                      <Baby className="w-4 h-4" /> Enfants bienvenus
                    </span>
                  )}
                  {restaurant.isPetFriendly && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-700 rounded-full text-sm">
                      <Dog className="w-4 h-4" /> Animaux acceptés
                    </span>
                  )}
                  {restaurant.isAccessible && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 text-indigo-700 rounded-full text-sm">
                      <Accessibility className="w-4 h-4" /> Accessible PMR
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Horaires */}
            {restaurant.openingHours && Object.keys(restaurant.openingHours).length > 0 && (
              <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-white mb-4">Horaires d'ouverture</h2>
                <div className="space-y-2">
                  {dayOrder.map((day) => {
                    const hours = restaurant.openingHours[day];
                    const now = new Date();
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const isToday = dayNames[now.getDay()] === day;

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                          isToday ? 'bg-orange-500/10 border border-orange-500/30' : 'hover:bg-white/10'
                        }`}
                      >
                        <span className={`font-medium ${isToday ? 'text-orange-400' : 'text-gray-300'}`}>
                          {dayLabels[day]}
                          {isToday && (
                            <span className="ml-2 text-xs bg-orange-500/100 text-white px-2 py-0.5 rounded-full">
                              Aujourd'hui
                            </span>
                          )}
                        </span>
                        {hours?.closed ? (
                          <span className="text-red-500 font-medium">Fermé</span>
                        ) : hours ? (
                          <span className="text-gray-400 font-medium">{hours.open} - {hours.close}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ==================== 5. SECTION AVIS & PREUVE SOCIALE ==================== */}
            {restaurant.reviews?.length > 0 && (
              <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Avis clients vérifiés
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {restaurant.reviewCount} avis de vrais clients
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-xl">
                      <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                      <span className="text-2xl font-bold text-white">{restaurant.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {restaurant.reviews.map((review) => (
                    <div key={review.id} className="border-b border-[#2a2a36] pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {review.authorAvatar ? (
                            <Image src={getImageUrl(review.authorAvatar)} alt={review.authorName || 'Auteur'} fill sizes="48px" className="rounded-full object-cover" />
                          ) : (
                            review.authorName.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-white flex items-center gap-2">
                                {review.authorName}
                                {review.isVerified && (
                                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Vérifié
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {review.title && (
                            <p className="font-medium text-white mt-2">{review.title}</p>
                          )}
                          <p className="text-gray-400 mt-1">{review.comment}</p>

                          {/* Photos du client */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((img, idx) => (
                                <Image
                                  key={idx}
                                  src={img}
                                  alt={`Photo de ${review.authorName}`}
                                  width={80}
                                  height={80}
                                  className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              ))}
                            </div>
                          )}

                          {/* Bouton utile */}
                          <div className="flex items-center gap-4 mt-3">
                            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                              Utile ({review.helpfulCount || 0})
                            </button>
                          </div>

                          {/* Réponse du propriétaire */}
                          {review.ownerResponse && (
                            <div className="mt-4 ml-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border-l-4 border-orange-400">
                              <p className="text-sm font-semibold text-orange-700 mb-1 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Réponse de l'établissement
                                {review.ownerResponseDate && (
                                  <span className="font-normal text-orange-500">
                                    • {new Date(review.ownerResponseDate).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-300">{review.ownerResponse}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bouton voir plus d'avis */}
                {restaurant.reviewCount > restaurant.reviews.length && (
                  <button className="mt-6 w-full py-3 border-2 border-orange-500/30 text-orange-400 font-medium rounded-xl hover:bg-orange-500/100/10 transition-colors">
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
            <div className="bg-[#1a1a24] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white">
                    {getPriceRangeSymbol(restaurant.priceRange)}
                  </span>
                  <span className="text-gray-400">{categoryLabels[restaurant.category]}</span>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{restaurant.rating?.toFixed(1)}</span>
                </div>
              </div>

              {/* Statut d'ouverture */}
              {openStatus && (
                <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${
                  openStatus.isOpen ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                }`}>
                  <Clock className={`w-5 h-5 ${openStatus.isOpen ? 'text-green-400' : 'text-red-600'}`} />
                  <div>
                    <p className={`font-medium ${openStatus.isOpen ? 'text-green-700' : 'text-red-700'}`}>
                      {openStatus.message}
                    </p>
                    {!openStatus.isOpen && openStatus.nextOpen && (
                      <p className="text-sm text-gray-400">Prochaine ouverture: {openStatus.nextOpen}</p>
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
                <div className="mt-4 pt-4 border-t border-[#2a2a36]">
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
            <DirectionsWidget
              destinationLat={restaurant.latitude}
              destinationLng={restaurant.longitude}
              destinationName={restaurant.name}
              city={restaurant.city}
              district={restaurant.district}
            />

            <div className="space-y-6">
              {/* Adresse et repères */}
              <div className="bg-[#1a1a24] rounded-2xl p-6 shadow-sm space-y-4 self-start">
                <p className="text-sm text-gray-400">
                  <span className="font-medium text-white">Adresse :</span><br />
                  {restaurant.address || `${restaurant.district}, ${restaurant.city}, ${restaurant.region}`}
                </p>
                {restaurant.localLandmark && (
                  <p className="text-sm text-gray-400 bg-amber-500/10 p-3 rounded-lg border border-amber-100">
                    <span className="font-medium text-amber-700">Repère :</span><br />
                    {restaurant.localLandmark}
                  </p>
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
            <h2 className="text-2xl font-bold text-white mb-6">Restaurants similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarRestaurants.map((r) => (
                <Link
                  key={r.id}
                  href={`/bons-plans/restaurants/${r.slug}`}
                  className="group bg-[#1a1a24] rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="relative h-48 bg-gradient-to-br from-slate-700 to-slate-800">
                    {r.coverImage ? (
                      <Image
                        src={getImageUrl(r.coverImage)}
                        alt={r.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UtensilsCrossed className="w-16 h-16 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-2 py-1 bg-orange-500/100 text-white text-xs font-medium rounded-full">
                      {categoryLabels[r.category]}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 bg-[#1a1a24]/90 text-gray-300 text-sm font-bold rounded-full">
                      {getPriceRangeSymbol(r.priceRange)}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                      {r.name}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {r.city}
                    </p>
                    <div className="flex items-center gap-1 mt-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-white">{r.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
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
                        className={`flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                          index === menuImageIndex
                            ? 'border-orange-500 scale-110'
                            : 'border-transparent opacity-50 hover:opacity-100'
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
