'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Phone, Share2, Users, Globe, Clock, Car, Award, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';

const DirectionsWidget = dynamic(() => import('@/components/maps/DirectionsWidget'), { ssr: false });
import BookingChatWidget from '@/components/bons-plans/BookingChatWidget';
import CategorizedGallery from '@/components/bons-plans/CategorizedGallery';
import PhotoGallerySection from '@/components/bons-plans/PhotoGallerySection';
import { getEstablishmentImage } from '@/lib/establishment-image';
import SocialLinks from '@/components/bons-plans/SocialLinks';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';

interface Provider {
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
  isClaimed: boolean;
  nameEn: string;
  descriptionEn: string;
  shortDescriptionEn: string;
  serviceType: string;
  languages: string[];
  experience: string;
  priceRange: string;
  priceFrom: number;
  priceTo: number;
  priceUnit: string;
  isAvailable: boolean;
  operatingZone: string[];
  vehicleType: string;
  vehicleCapacity: number;
  licenseNumber: string;
  certifications: string[];
  reviews: Array<{
    id: string;
    authorName: string;
    rating: number;
    title: string;
    comment: string;
    createdAt: string;
    ownerResponse: string | null;
  }>;
}

interface SimilarProvider {
  id: string;
  name: string;
  slug: string;
  city: string;
  coverImage: string;
  rating: number;
  serviceType: string;
  priceFrom: number;
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GUIDE: 'Guide touristique',
  DRIVER: 'Chauffeur',
  TOUR_OPERATOR: 'Tour opérateur',
  CAR_RENTAL: 'Location de voiture',
  PHOTOGRAPHER: 'Photographe',
  TRANSLATOR: 'Traducteur / Interprète',
  TRAVEL_AGENCY: 'Agence de voyage',
  TRANSFER: 'Transfert',
  BOAT_EXCURSION: 'Excursion en bateau',
  OTHER: 'Autre',
};

export default function ProviderDetail() {
  const { slug } = useParams();
  const { locale } = useLanguage();
  const toast = useToast();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [similarProviders, setSimilarProviders] = useState<SimilarProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllDescription, setShowAllDescription] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      setIsLoading(true);
      setProvider(null);
      setSimilarProviders([]);
      window.scrollTo(0, 0);
      try {
        const res = await fetch(`/api/bons-plans/prestataires/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProvider(data.provider);
        setSimilarProviders(data.similarProviders || []);
      } catch {
        // not found
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchProvider();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Users className="w-16 h-16 text-[#3F3F46]" />
        <h1 className="text-xl font-semibold text-[#FAFAFA]">Prestataire non trouvé</h1>
        <Link
          href="/prestataires"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
        >
          Retour aux prestataires
        </Link>
      </div>
    );
  }

  const name = locale === 'en' && provider.nameEn ? provider.nameEn : provider.name;
  const description = locale === 'en' && provider.descriptionEn ? provider.descriptionEn : provider.description;

  const handleShare = async () => {
    try {
      await navigator.share({ title: provider.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-4">
        <Breadcrumbs items={[
          { label: 'Bons Plans', href: '/bons-plans' },
          { label: 'Prestataires', href: '/prestataires' },
          { label: provider.name },
        ]} />
      </div>

      {/* Gallery */}
      <CategorizedGallery
        coverImage={provider.coverImage}
        images={provider.images || []}
        establishmentName={provider.name}
        fallbackImage={getEstablishmentImage('PROVIDER', provider.city, provider.name)}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-[#111114] rounded-xl p-6 md:p-8 border border-[#27272A]">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="px-2.5 py-1 bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                      {SERVICE_TYPE_LABELS[provider.serviceType] || provider.serviceType}
                    </span>
                    {provider.isAvailable !== false && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-[11px] font-semibold uppercase tracking-[0.1em] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Disponible
                      </span>
                    )}
                    {provider.isFeatured && (
                      <span className="px-2.5 py-1 bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35] rounded-md text-[11px] font-semibold uppercase tracking-[0.1em]">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] text-[#FAFAFA]">{name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-[#A1A1AA] text-[13px]">
                    <MapPin className="w-4 h-4" />
                    <span>{provider.district ? `${provider.district}, ` : ''}{provider.city}{provider.region ? `, ${provider.region}` : ''}</span>
                  </div>
                </div>
                <button onClick={handleShare} className="p-2.5 bg-[#1A1A1F] border border-[#27272A] hover:border-[#3F3F46] rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors shrink-0">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 p-4 bg-[#1A1A1F] border border-[#27272A] rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-[#FF6B35] fill-[#FF6B35]" />
                  <span className="text-[20px] font-semibold font-mono text-[#FAFAFA]">{provider.rating?.toFixed(1)}</span>
                </div>
                <span className="text-[#A1A1AA] text-[13px]">{provider.reviewCount} avis</span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="bg-[#111114] rounded-xl p-6 md:p-8 border border-[#27272A]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">À propos</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-4">
                  Présentation
                </h2>
                <div className={`text-[#D4D4D8] leading-relaxed max-w-[65ch] ${!showAllDescription && description.length > 400 ? 'line-clamp-4' : ''}`}>
                  {description}
                </div>
                {description.length > 400 && (
                  <button
                    onClick={() => setShowAllDescription(!showAllDescription)}
                    className="mt-3 text-[#FF6B35] text-[13px] hover:underline"
                  >
                    {showAllDescription ? 'Voir moins' : 'Voir plus'}
                  </button>
                )}
              </div>
            )}

            {/* Photo Gallery */}
            {(provider.coverImage || provider.images?.length > 0 || provider.gallery?.length) && (
              <PhotoGallerySection
                images={provider.images || []}
                gallery={provider.gallery}
                coverImage={provider.coverImage}
              />
            )}

            {/* Provider Details */}
            <div className="bg-[#111114] rounded-xl p-6 md:p-8 border border-[#27272A]">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Profil</p>
              <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-5">
                Informations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {provider.languages?.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                    <Globe className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">Langues parlées</p>
                      <p className="text-[#FAFAFA] font-medium text-[13px] mt-0.5">{provider.languages.join(', ')}</p>
                    </div>
                  </div>
                )}
                {provider.experience && (
                  <div className="flex items-start gap-3 p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                    <Clock className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">Expérience</p>
                      <p className="text-[#FAFAFA] font-medium text-[13px] mt-0.5">{provider.experience}</p>
                    </div>
                  </div>
                )}
                {provider.operatingZone?.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                    <MapPin className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">Zone d&apos;opération</p>
                      <p className="text-[#FAFAFA] font-medium text-[13px] mt-0.5">{provider.operatingZone.join(', ')}</p>
                    </div>
                  </div>
                )}
                {provider.vehicleType && (
                  <div className="flex items-start gap-3 p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                    <Car className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">Véhicule</p>
                      <p className="text-[#FAFAFA] font-medium text-[13px] mt-0.5">
                        {provider.vehicleType}
                        {provider.vehicleCapacity && ` (${provider.vehicleCapacity} places)`}
                      </p>
                    </div>
                  </div>
                )}
                {provider.licenseNumber && (
                  <div className="flex items-start gap-3 p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                    <Award className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">Licence / Agrément</p>
                      <p className="text-[#FAFAFA] font-medium text-[13px] font-mono mt-0.5">{provider.licenseNumber}</p>
                    </div>
                  </div>
                )}
                {provider.certifications?.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                    <Award className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">Certifications</p>
                      <p className="text-[#FAFAFA] font-medium text-[13px] mt-0.5">{provider.certifications.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            {(provider.priceFrom || provider.priceTo) && (
              <div className="bg-[#111114] rounded-xl p-6 md:p-8 border border-[#27272A]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Tarifs</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-5">
                  Grille tarifaire
                </h2>
                <div className="p-5 bg-[#1A1A1F] border border-[#27272A] rounded-lg">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {provider.priceFrom && (
                      <span className="text-[26px] font-semibold font-mono text-[#FAFAFA]">
                        {provider.priceFrom.toLocaleString()} Ar
                      </span>
                    )}
                    {provider.priceTo && provider.priceFrom && (
                      <span className="text-[#71717A]">–</span>
                    )}
                    {provider.priceTo && (
                      <span className="text-[26px] font-semibold font-mono text-[#FAFAFA]">
                        {provider.priceTo.toLocaleString()} Ar
                      </span>
                    )}
                    {provider.priceUnit && (
                      <span className="text-[#A1A1AA] text-[13px]">/ {provider.priceUnit}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {provider.reviews?.length > 0 && (
              <div className="bg-[#111114] rounded-xl p-6 md:p-8 border border-[#27272A]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Communauté</p>
                <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-5">
                  Avis clients ({provider.reviews.length})
                </h2>
                <div className="space-y-4">
                  {provider.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-[#1A1A1F] rounded-lg border border-[#27272A]">
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <span className="font-semibold text-[#FAFAFA] text-[14px]">{review.authorName}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < review.rating ? 'text-[#FF6B35] fill-[#FF6B35]' : 'text-[#3F3F46]'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="font-medium text-[#FAFAFA] text-[14px] mb-1">{review.title}</p>}
                      <p className="text-[#D4D4D8] text-[13px] leading-relaxed">{review.comment}</p>
                      <p className="text-[#71717A] text-[11px] font-mono mt-2">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {review.ownerResponse && (
                        <div className="mt-3 p-3 bg-[#0A0A0F] border-l-2 border-[#FF6B35] rounded-lg">
                          <p className="text-[11px] uppercase tracking-[0.15em] text-[#FF6B35] font-semibold mb-1">Réponse</p>
                          <p className="text-[13px] text-[#D4D4D8] leading-relaxed">{review.ownerResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directions */}
            {provider.latitude && provider.longitude && (
              <div className="rounded-xl overflow-hidden border border-[#27272A]">
                <DirectionsWidget
                  destinationLat={provider.latitude}
                  destinationLng={provider.longitude}
                  destinationName={provider.name}
                  city={provider.city}
                  district={provider.district}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-[#111114] rounded-xl p-6 border border-[#27272A] lg:sticky lg:top-24">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-2">Contacter</p>
              <h3 className="text-[18px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-4">Réservation directe</h3>

              {/* Booking + Chat Widget */}
              <BookingChatWidget
                establishmentId={provider.id}
                establishmentName={provider.name}
                establishmentType="provider"
                ownerId={(provider as any).claimedByUserId || null}
                pricePerNight={null}
              />

              {/* Contact direct */}
              <div className="space-y-2.5">
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </a>
                )}
                {provider.whatsapp && (
                  <a
                    href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#1A1A1F] border border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA] font-medium text-[14px] rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    WhatsApp
                  </a>
                )}
                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-[#1A1A1F] border border-[#27272A] hover:border-[#3F3F46] text-[#FAFAFA] font-medium text-[14px] rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#A1A1AA]" />
                    Email
                  </a>
                )}
              </div>

              {/* Social links */}
              <div className="mt-4 pt-4 border-t border-[#27272A]">
                <SocialLinks
                  facebook={provider.facebook}
                  instagram={provider.instagram}
                  website={provider.website}
                />
              </div>
            </div>

            {/* Similar Providers */}
            {similarProviders.length > 0 && (
              <div className="bg-[#111114] rounded-xl p-6 border border-[#27272A]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-2">Continuer</p>
                <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-4">Découvrir aussi</h3>
                <div className="space-y-2.5">
                  {similarProviders.map((sp) => (
                    <motion.div key={sp.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                      <Link
                        href={`/prestataires/${sp.slug}`}
                        className="flex items-center gap-3 p-3 bg-[#1A1A1F] border border-[#27272A] hover:border-[#3F3F46] rounded-lg transition-colors group"
                      >
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0A0A0F] flex-shrink-0 relative border border-[#27272A]">
                          <Image
                            src={getEstablishmentImage('PROVIDER', sp.city, sp.name, sp.coverImage)}
                            alt={sp.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#FAFAFA] text-[13px] truncate group-hover:text-[#FF6B35] transition-colors">{sp.name}</p>
                          <div className="flex items-center gap-1 text-[11px] text-[#A1A1AA]">
                            <MapPin className="w-3 h-3" />
                            {sp.city}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#FF6B35] fill-[#FF6B35]" />
                            <span className="text-[12px] font-mono text-[#FAFAFA]">{sp.rating?.toFixed(1)}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
