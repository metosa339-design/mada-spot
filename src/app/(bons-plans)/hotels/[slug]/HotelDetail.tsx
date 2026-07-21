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
import EstablishmentDescription from '@/components/bons-plans/EstablishmentDescription';
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
import PhotoGallerySection from '@/components/bons-plans/PhotoGallerySection';
import EnhancedContactButtons from '@/components/bons-plans/EnhancedContactButtons';
import AccessInfo from '@/components/bons-plans/AccessInfo';
import ReviewPreview from '@/components/bons-plans/ReviewPreview';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getImageUrl } from '@/lib/image-url';
import { getEstablishmentImage } from '@/lib/establishment-image';
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
      setIsLoading(true);
      setHotel(null);
      setSimilarHotels([]);
      window.scrollTo(0, 0);
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
        className={`w-4 h-4 ${i < count ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#CBD5E1]'}`}
      />
    ));
  };

  const { t } = useLanguage();
  const { convert } = useCurrency();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-64 lg:h-96 bg-white rounded-2xl border border-[#E2E8F0]" />
            <div className="h-8 bg-white rounded w-1/3" />
            <div className="h-4 bg-white rounded w-2/3" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-white rounded-xl border border-[#E2E8F0]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-24" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <Building2 className="w-16 h-16 mx-auto text-[#CBD5E1] mb-4" />
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Hôtel non trouvé</h1>
          <p className="text-[#64748B] mb-6">L&apos;hôtel que vous recherchez n&apos;existe pas ou a été supprimé.</p>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux hôtels
          </Link>
        </div>
      </div>
    );
  }

  const lowestPrice = hotel.roomTypes?.length > 0
    ? Math.min(...hotel.roomTypes.map((r) => r.pricePerNight))
    : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Hero photo */}
      <div className="relative">
        <CategorizedGallery
          coverImage={hotel.coverImage}
          images={hotel.images || []}
          categories={hotel.roomTypes?.length > 0 ? [
            { label: 'Chambres', images: hotel.roomTypes.flatMap((r) => r.images || []) },
          ] : []}
          establishmentName={hotel.name}
          fallbackImage={getEstablishmentImage('HOTEL', hotel.city, hotel.name)}
        />

        {/* Overlay dark gradient bottom-to-transparent */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Back button */}
        <Link
          href="/hotels"
          className="absolute top-24 left-4 md:left-8 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-[#E2E8F0] rounded-lg text-[#0F172A] hover:bg-white/90 hover:border-[#CBD5E1] transition-colors z-30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden md:inline text-[13px] font-medium">Retour</span>
        </Link>

        {/* Actions */}
        <div className="absolute top-24 right-4 md:right-8 flex items-center gap-2 z-30">
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
              const title = hotel?.name || 'Hôtel sur Mada Spot';
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
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 z-30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              {renderStars(hotel.starRating)}
              {hotel.isFeatured && (
                <span className="ml-2 px-2.5 py-1 bg-[#FFF7ED] border border-[#FF6B35]/30 text-[#FF6B35] text-[11px] font-semibold rounded-md uppercase tracking-[0.1em]">
                  Recommandé
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <h1
                className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {hotel.name}
              </h1>
              {hotel.isClaimed && <VerifiedBadge variant="verified" size="lg" />}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[#334155] text-[14px]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#64748B]" />
                {hotel.district}, {hotel.city}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                <span className="font-mono">{hotel.rating?.toFixed(1)}</span>
                <span className="text-[#64748B]">({hotel.reviewCount} avis)</span>
              </span>
              {lowestPrice && (
                <span className="flex items-center gap-1.5 font-mono text-[#0F172A]">
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
            { label: 'Hôtels', href: '/hotels' },
            { label: hotel.name },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">À propos</p>
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-4">
                Présentation
              </h2>
              <EstablishmentDescription
                className="max-w-[65ch]"
                text={t(hotel.description || hotel.shortDescription, hotel.descriptionEn || hotel.shortDescriptionEn)}
              />
            </section>

            {/* Photo Gallery */}
            {(hotel.coverImage || hotel.images?.length > 0 || hotel.gallery?.length) && (
              <PhotoGallerySection
                images={hotel.images || []}
                gallery={hotel.gallery}
                coverImage={hotel.coverImage}
              />
            )}

            {/* Owner Bio */}
            {hotel.owner && (
              <OwnerBio owner={hotel.owner} establishmentName={hotel.name} />
            )}

            {/* Équipements */}
            {hotel.amenities?.length > 0 && (
              <section className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Services</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
                  Équipements & services
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {hotel.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <motion.div
                        key={amenity}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
                      >
                        <div className="w-9 h-9 bg-[#FFF7ED] border border-[#FF6B35]/20 rounded-md flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-[#FF6B35]" />
                        </div>
                        <span className="text-[#334155] text-[13px] font-medium">
                          {amenityLabels[amenity] || amenity}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Horaires d'ouverture */}
            {hotel.openingHours && Object.keys(hotel.openingHours).length > 0 && (
              <section className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Horaires</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-4">
                  Horaires d&apos;ouverture
                </h2>
                <div className="space-y-1.5">
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
                        className={`flex items-center justify-between py-2.5 px-4 rounded-lg ${
                          isToday
                            ? 'bg-[#FF6B35]/8 border border-[#FF6B35]/25'
                            : 'bg-white border border-[#E2E8F0]'
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
              </section>
            )}

            {/* Chambres */}
            {hotel.roomTypes?.length > 0 && (
              <section className="bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Hébergement</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
                  Types de chambres
                </h2>
                <div className="space-y-4">
                  {hotel.roomTypes.map((room) => (
                    <motion.div
                      key={room.id}
                      className={`rounded-xl p-4 md:p-6 cursor-pointer transition-colors border ${
                        selectedRoom?.id === room.id
                          ? 'border-[#FF6B35] bg-[#FF6B35]/8'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                      }`}
                      onClick={() => setSelectedRoom(room)}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {room.images?.[0] && (
                          <div className="relative w-full md:w-40 h-32 rounded-lg overflow-hidden border border-[#E2E8F0]">
                            <Image
                              src={getImageUrl(room.images[0])}
                              alt={room.name}
                              width={160}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2 gap-3">
                            <h3 className="text-[16px] font-semibold text-[#0F172A]">{room.name}</h3>
                            <div className="text-right shrink-0">
                              <p className="text-[20px] font-semibold font-mono text-[#0F172A]">
                                {convert(room.pricePerNight)}
                              </p>
                              <p className="text-[12px] text-[#64748B]">par nuit</p>
                            </div>
                          </div>
                          <p className="text-[#334155] text-[13px] mb-3 leading-relaxed">{room.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#64748B]">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              {room.capacity} personnes
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Bed className="w-3.5 h-3.5" />
                              {room.bedType}
                            </span>
                            {room.size > 0 && (
                              <span className="font-mono">{room.size} m²</span>
                            )}
                          </div>
                          {room.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {room.amenities.slice(0, 4).map((a) => (
                                <span
                                  key={a}
                                  className="px-2.5 py-1 bg-[#F8FAFC] text-[#64748B] text-[11px] rounded-md border border-[#E2E8F0]"
                                >
                                  {amenityLabels[a] || a}
                                </span>
                              ))}
                              {room.amenities.length > 4 && (
                                <span className="px-2.5 py-1 text-[#94A3B8] text-[11px]">
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

              {/* Reservation card */}
              <div className="bg-white rounded-xl p-6 border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#64748B] mb-1">À partir de</p>
                    <p className="text-[28px] font-semibold font-mono text-[#0F172A]">
                      {lowestPrice ? convert(lowestPrice) : 'Sur demande'}
                    </p>
                    <p className="text-[12px] text-[#64748B]">par nuit</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg">
                    <Star className="w-4 h-4 text-[#FF6B35] fill-[#FF6B35]" />
                    <span className="font-mono text-[#0F172A] text-[14px]">{hotel.rating?.toFixed(1)}</span>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-center gap-3 p-3 bg-white border border-[#E2E8F0] rounded-lg mb-4">
                  <Clock className="w-4 h-4 text-[#64748B] shrink-0" />
                  <div className="text-[12px]">
                    <p className="text-[#64748B]">
                      Check-in : <span className="font-mono text-[#0F172A]">{hotel.checkInTime || '14:00'}</span>
                    </p>
                    <p className="text-[#64748B]">
                      Check-out : <span className="font-mono text-[#0F172A]">{hotel.checkOutTime || '11:00'}</span>
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
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
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
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0]">
              <DirectionsWidget
                destinationLat={hotel.latitude}
                destinationLng={hotel.longitude}
                destinationName={hotel.name}
                city={hotel.city}
                district={hotel.district}
              />
            </div>
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Continuer l&apos;exploration</p>
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-6">
              Hôtels similaires
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
              {similarHotels.map((h) => (
                <motion.div
                  key={h.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 w-56 lg:w-auto"
                >
                  <Link
                    href={`/hotels/${h.slug}`}
                    className="group block bg-white rounded-xl overflow-hidden border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
                  >
                    <div className="relative h-36 lg:h-48 bg-white">
                      <Image
                        src={getEstablishmentImage('HOTEL', h.city, h.name, h.coverImage)}
                        alt={h.name}
                        fill
                        sizes="(max-width: 1024px) 224px, 33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-[#0F172A] text-[14px] group-hover:text-[#FF6B35] transition-colors line-clamp-1">
                        {h.name}
                      </h3>
                      <p className="text-[12px] text-[#64748B] flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {h.city}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-[#FF6B35] fill-[#FF6B35]" />
                          <span className="font-mono text-[#0F172A] text-[13px]">{h.rating?.toFixed(1)}</span>
                        </div>
                        {h.lowestPrice && (
                          <p className="font-mono text-[#0F172A] text-[13px]">
                            {convert(h.lowestPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
