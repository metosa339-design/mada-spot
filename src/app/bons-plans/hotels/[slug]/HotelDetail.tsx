'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, MapPin, Clock, Wifi, Car, Coffee, Waves, Dumbbell, UtensilsCrossed, Wind, Tv, ShowerHead, Refrigerator, Heart, Share2, Check, ArrowLeft, Building2, Users, Bed } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const DirectionsWidget = dynamic(() => import('@/components/maps/DirectionsWidget'), { ssr: false });
import SourceAttribution from '@/components/bons-plans/SourceAttribution';
import BookingChatWidget from '@/components/bons-plans/BookingChatWidget';
import SocialLinks from '@/components/bons-plans/SocialLinks';
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
import EnhancedContactButtons from '@/components/bons-plans/EnhancedContactButtons';
import AccessInfo from '@/components/bons-plans/AccessInfo';
import ReviewPreview from '@/components/bons-plans/ReviewPreview';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getImageUrl } from '@/lib/image-url';
import { useToast } from '@/contexts/ToastContext';

interface RoomType {
  id: string;
  name: string;
  description: string;
  capacity: number;
  bedType: string;
  size: number;
  pricePerNight: number;
  priceWeekend: number;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
}

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  ownerResponse?: string;
}

interface Hotel {
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
  starRating: number;
  hotelType: string;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  openingHours: Record<string, { open: string; close: string; closed?: boolean }> | null;
  roomTypes: RoomType[];
  reviews: Review[];
  // Multilingual
  nameEn?: string;
  descriptionEn?: string;
  shortDescriptionEn?: string;
  // Import metadata
  dataSource?: string;
  sourceUrl?: string;
  sourceAttribution?: string;
  isClaimed?: boolean;
  phone2?: string;
  owner?: {
    firstName: string;
    lastName: string;
    avatar?: string | null;
    memberSince: string;
  } | null;
}

const amenityIcons: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  restaurant: UtensilsCrossed,
  pool: Waves,
  gym: Dumbbell,
  spa: Coffee,
  ac: Wind,
  tv: Tv,
  bathroom: ShowerHead,
  minibar: Refrigerator,
};

const amenityLabels: Record<string, string> = {
  wifi: 'WiFi gratuit',
  parking: 'Parking',
  restaurant: 'Restaurant',
  pool: 'Piscine',
  gym: 'Salle de sport',
  spa: 'Spa',
  ac: 'Climatisation',
  tv: 'TV',
  bathroom: 'Salle de bain privée',
  minibar: 'Minibar',
};

export default function HotelDetail() {
  const params = useParams();
  const slug = params.slug as string;
  const { success: toastSuccess } = useToast();

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [similarHotels, setSimilarHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const response = await fetch(`/api/bons-plans/hotels/${slug}`);
        const data = await response.json();
        if (data.hotel) {
          setHotel(data.hotel);
          setSimilarHotels(data.similarHotels || []);
        }
      } catch (error) {
        console.error('Error fetching hotel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchHotel();
    }
  }, [slug]);

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-24">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-slate-200 rounded-2xl" />
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] pt-24">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Hôtel non trouvé</h1>
          <p className="text-slate-400 mb-6">L'hôtel que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link
            href="/bons-plans/hotels"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux hôtels
          </Link>
        </div>
      </div>
    );
  }

  const { t } = useLanguage();
  const { convert } = useCurrency();

  const lowestPrice = hotel.roomTypes?.length > 0
    ? Math.min(...hotel.roomTypes.map((r) => r.pricePerNight))
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header avec image */}
      <div className="relative">
        <CategorizedGallery
          coverImage={hotel.coverImage}
          images={hotel.images || []}
          categories={hotel.roomTypes?.length > 0 ? [
            { label: 'Chambres', images: hotel.roomTypes.flatMap((r) => r.images || []) },
          ] : []}
          establishmentName={hotel.name}
        />

        {/* Back button */}
        <Link
          href="/bons-plans/hotels"
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors z-30"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden md:inline">Retour</span>
        </Link>

        {/* Actions */}
        <div className="absolute top-24 right-4 md:right-8 flex items-center gap-2 z-30">
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={async () => {
              const url = window.location.href;
              const title = hotel?.name || 'Hôtel sur Mada Spot';
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
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              {renderStars(hotel.starRating)}
              {hotel.isFeatured && (
                <span className="ml-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded-full">
                  Recommandé
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{hotel.name}</h1>
              {hotel.isClaimed && <VerifiedBadge variant="verified" size="lg" />}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {hotel.district}, {hotel.city}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                {hotel.rating?.toFixed(1)} ({hotel.reviewCount} avis)
              </span>
              {lowestPrice && (
                <span className="flex items-center gap-1 font-semibold">
                  À partir de {convert(lowestPrice)}/nuit
                </span>
              )}
              {hotel.openingHours && Object.keys(hotel.openingHours).length > 0 && (
                <OpenCloseBadge openingHours={hotel.openingHours} variant="badge" />
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
            { label: 'Hôtels', href: '/bons-plans/hotels' },
            { label: hotel.name },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]">
              <h2 className="text-xl font-bold text-white mb-4">À propos</h2>
              <p className="text-slate-400 leading-relaxed whitespace-pre-line">
                {t(hotel.description || hotel.shortDescription, hotel.descriptionEn || hotel.shortDescriptionEn)}
              </p>
            </section>

            {/* Owner Bio */}
            {hotel.owner && (
              <OwnerBio owner={hotel.owner} establishmentName={hotel.name} />
            )}

            {/* Équipements */}
            {hotel.amenities?.length > 0 && (
              <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]">
                <h2 className="text-xl font-bold text-white mb-6">Équipements & Services</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <div key={amenity} className="flex items-center gap-3 p-3 bg-[#0d1520] rounded-xl">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-slate-300 font-medium">
                          {amenityLabels[amenity] || amenity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Horaires d'ouverture */}
            {hotel.openingHours && Object.keys(hotel.openingHours).length > 0 && (
              <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]">
                <h2 className="text-xl font-bold text-white mb-4">Horaires d'ouverture</h2>
                <div className="space-y-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const hours = hotel.openingHours?.[day];
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    const now = new Date();
                    const isToday = dayNames[now.getDay()] === day;
                    const dayLabels: Record<string, string> = {
                      monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
                      thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche',
                    };

                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                          isToday ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-[#2a2a36]/50'
                        }`}
                      >
                        <span className={`font-medium ${isToday ? 'text-orange-400' : 'text-slate-300'}`}>
                          {dayLabels[day]}
                          {isToday && <span className="ml-2 text-xs text-orange-400/70">(aujourd&apos;hui)</span>}
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
              </section>
            )}

            {/* Chambres */}
            {hotel.roomTypes?.length > 0 && (
              <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]">
                <h2 className="text-xl font-bold text-white mb-6">Types de chambres</h2>
                <div className="space-y-4">
                  {hotel.roomTypes.map((room) => (
                    <motion.div
                      key={room.id}
                      className={`border-2 rounded-xl p-4 md:p-6 cursor-pointer transition-all ${
                        selectedRoom?.id === room.id
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-[#2a2a36] hover:border-orange-500/50'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {room.images?.[0] && (
                          <Image
                            src={getImageUrl(room.images[0])}
                            alt={room.name}
                            width={160}
                            height={128}
                            className="w-full md:w-40 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                            <div className="text-right">
                              <p className="text-xl font-bold text-orange-400">
                                {convert(room.pricePerNight)}
                              </p>
                              <p className="text-sm text-slate-400">par nuit</p>
                            </div>
                          </div>
                          <p className="text-slate-400 text-sm mb-3">{room.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {room.capacity} personnes
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4" />
                              {room.bedType}
                            </span>
                            {room.size > 0 && (
                              <span>{room.size} m²</span>
                            )}
                          </div>
                          {room.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {room.amenities.slice(0, 4).map((a) => (
                                <span
                                  key={a}
                                  className="px-2 py-1 bg-[#0d1520] text-slate-400 text-xs rounded-full"
                                >
                                  {amenityLabels[a] || a}
                                </span>
                              ))}
                              {room.amenities.length > 4 && (
                                <span className="px-2 py-1 text-slate-500 text-xs">
                                  +{room.amenities.length - 4} autres
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Avis */}
            {hotel.reviews?.length > 0 && (
              <ReviewPreview
                reviews={hotel.reviews}
                maxReviews={3}
                rating={hotel.rating}
                reviewCount={hotel.reviewCount}
                establishmentId={hotel.id}
              />
            )}

            {/* Events */}
            <EstablishmentEvents establishmentId={hotel.id} city={hotel.city} />
          </div>

          {/* Sidebar — booking only, sticky */}
          <div>
            <div className="lg:sticky lg:top-24 space-y-6">
              <PromoBanner establishmentId={hotel.id} />
              <FomoBanner establishmentId={hotel.id} />

              {/* Réservation card */}
              <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-400">À partir de</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {lowestPrice ? convert(lowestPrice) : 'Sur demande'}
                    </p>
                    <p className="text-sm text-slate-400">par nuit</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{hotel.rating?.toFixed(1)}</span>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-center gap-4 p-3 bg-[#0d1520] rounded-lg mb-4">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div className="text-sm">
                    <p className="text-slate-400">
                      Check-in: <span className="font-medium">{hotel.checkInTime || '14:00'}</span>
                    </p>
                    <p className="text-slate-400">
                      Check-out: <span className="font-medium">{hotel.checkOutTime || '11:00'}</span>
                    </p>
                  </div>
                </div>

                {/* OpenCloseBadge in sidebar */}
                {hotel.openingHours && Object.keys(hotel.openingHours).length > 0 && (
                  <div className="mb-4">
                    <OpenCloseBadge openingHours={hotel.openingHours} variant="card" />
                  </div>
                )}

                {/* Booking + Chat Widget */}
                <BookingChatWidget
                  establishmentId={hotel.id}
                  establishmentName={hotel.name}
                  establishmentType="hotel"
                  ownerId={(hotel as any).claimedByUserId || null}
                  pricePerNight={hotel.roomTypes?.[0]?.pricePerNight || null}
                />

                {/* Contact direct */}
                <EnhancedContactButtons
                  phone={hotel.phone}
                  phone2={hotel.phone2}
                  whatsapp={hotel.whatsapp}
                  email={hotel.email}
                  establishmentName={hotel.name}
                  establishmentId={hotel.id}
                />

                {/* Liens sociaux */}
                {(hotel.website || hotel.facebook || hotel.instagram) && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a36]">
                    <SocialLinks
                      website={hotel.website}
                      facebook={hotel.facebook}
                      instagram={hotel.instagram}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Localisation & Directions — full width below grid */}
        {(hotel.latitude && hotel.longitude) && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DirectionsWidget
              destinationLat={hotel.latitude}
              destinationLng={hotel.longitude}
              destinationName={hotel.name}
              city={hotel.city}
              district={hotel.district}
            />
            <AccessInfo
              city={hotel.city}
              district={hotel.district}
              address={hotel.address}
              hasParking={hotel.amenities?.includes('parking')}
              latitude={hotel.latitude}
              longitude={hotel.longitude}
            />
          </div>
        )}

        {/* Source Attribution pour fiches importées */}
        {hotel.dataSource && hotel.dataSource !== 'manual' && (
          <div className="mt-8 max-w-4xl">
            <SourceAttribution
              establishmentId={hotel.id}
              establishmentName={hotel.name}
              sourceAttribution={hotel.sourceAttribution}
              sourceUrl={hotel.sourceUrl}
              isClaimed={hotel.isClaimed}
              dataSource={hotel.dataSource}
            />
          </div>
        )}

        {/* Hôtels similaires */}
        {similarHotels.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Hôtels similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarHotels.map((h) => (
                <Link
                  key={h.id}
                  href={`/bons-plans/hotels/${h.slug}`}
                  className="group bg-[#1a1a24] rounded-xl overflow-hidden border border-[#2a2a36] hover:border-orange-500/50 transition-all"
                >
                  <div className="relative h-48 bg-gradient-to-br from-[#1a1a24] to-[#2a2a36]">
                    {h.coverImage ? (
                      <Image
                        src={getImageUrl(h.coverImage)}
                        alt={h.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                      {Array.from({ length: h.starRating || 0 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                      {h.name}
                    </h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {h.city}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-white">{h.rating?.toFixed(1)}</span>
                      </div>
                      {h.lowestPrice && (
                        <p className="text-orange-400 font-semibold">
                          {convert(h.lowestPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
