'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Phone, Share2, Users, Globe, Clock, Car, Award, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

const DirectionsWidget = dynamic(() => import('@/components/maps/DirectionsWidget'), { ssr: false });
import BookingChatWidget from '@/components/bons-plans/BookingChatWidget';
import CategorizedGallery from '@/components/bons-plans/CategorizedGallery';
import PhotoGallerySection from '@/components/bons-plans/PhotoGallerySection';
import { getImageUrl } from '@/lib/image-url';
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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-4">
        <Users className="w-16 h-16 text-slate-600" />
        <h1 className="text-xl font-semibold text-white">Prestataire non trouvé</h1>
        <Link href="/bons-plans/prestataires" className="text-cyan-400 hover:underline">Retour aux prestataires</Link>
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
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-4">
        <Breadcrumbs items={[
          { label: 'Bons Plans', href: '/bons-plans' },
          { label: 'Prestataires', href: '/bons-plans/prestataires' },
          { label: provider.name },
        ]} />
      </div>

      {/* Gallery */}
      <CategorizedGallery
        coverImage={provider.coverImage}
        images={provider.images || []}
        establishmentName={provider.name}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-medium">
                      {SERVICE_TYPE_LABELS[provider.serviceType] || provider.serviceType}
                    </span>
                    {provider.isAvailable !== false && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        Disponible
                      </span>
                    )}
                    {provider.isFeatured && (
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-medium">
                        Recommandé
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{provider.district ? `${provider.district}, ` : ''}{provider.city}{provider.region ? `, ${provider.region}` : ''}</span>
                  </div>
                </div>
                <button onClick={handleShare} className="p-2 bg-[#0d1520] rounded-lg text-slate-400 hover:text-white transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 p-4 bg-[#0d1520] rounded-xl">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span className="text-xl font-bold text-white">{provider.rating?.toFixed(1)}</span>
                </div>
                <span className="text-slate-400">{provider.reviewCount} avis</span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
                <h2 className="text-lg font-semibold text-white mb-4">À propos</h2>
                <div className={`text-slate-300 leading-relaxed ${!showAllDescription && description.length > 400 ? 'line-clamp-4' : ''}`}>
                  {description}
                </div>
                {description.length > 400 && (
                  <button
                    onClick={() => setShowAllDescription(!showAllDescription)}
                    className="mt-2 text-cyan-400 text-sm hover:underline"
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
            <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
              <h2 className="text-lg font-semibold text-white mb-4">Informations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {provider.languages?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-[#0d1520] rounded-xl">
                    <Globe className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Langues parlées</p>
                      <p className="text-white font-medium">{provider.languages.join(', ')}</p>
                    </div>
                  </div>
                )}
                {provider.experience && (
                  <div className="flex items-start gap-3 p-3 bg-[#0d1520] rounded-xl">
                    <Clock className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Expérience</p>
                      <p className="text-white font-medium">{provider.experience}</p>
                    </div>
                  </div>
                )}
                {provider.operatingZone?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-[#0d1520] rounded-xl">
                    <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Zone d&apos;opération</p>
                      <p className="text-white font-medium">{provider.operatingZone.join(', ')}</p>
                    </div>
                  </div>
                )}
                {provider.vehicleType && (
                  <div className="flex items-start gap-3 p-3 bg-[#0d1520] rounded-xl">
                    <Car className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Véhicule</p>
                      <p className="text-white font-medium">
                        {provider.vehicleType}
                        {provider.vehicleCapacity && ` (${provider.vehicleCapacity} places)`}
                      </p>
                    </div>
                  </div>
                )}
                {provider.licenseNumber && (
                  <div className="flex items-start gap-3 p-3 bg-[#0d1520] rounded-xl">
                    <Award className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Licence / Agrément</p>
                      <p className="text-white font-medium">{provider.licenseNumber}</p>
                    </div>
                  </div>
                )}
                {provider.certifications?.length > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-[#0d1520] rounded-xl">
                    <Award className="w-5 h-5 text-cyan-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-400">Certifications</p>
                      <p className="text-white font-medium">{provider.certifications.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            {(provider.priceFrom || provider.priceTo) && (
              <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
                <h2 className="text-lg font-semibold text-white mb-4">Tarifs</h2>
                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-xl">
                  <div className="flex items-baseline gap-2">
                    {provider.priceFrom && (
                      <span className="text-2xl font-bold text-cyan-400">
                        {provider.priceFrom.toLocaleString()} Ar
                      </span>
                    )}
                    {provider.priceTo && provider.priceFrom && (
                      <span className="text-slate-400">—</span>
                    )}
                    {provider.priceTo && (
                      <span className="text-2xl font-bold text-cyan-400">
                        {provider.priceTo.toLocaleString()} Ar
                      </span>
                    )}
                    {provider.priceUnit && (
                      <span className="text-slate-400">/ {provider.priceUnit}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            {provider.reviews?.length > 0 && (
              <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36]">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Avis clients ({provider.reviews.length})
                </h2>
                <div className="space-y-4">
                  {provider.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-[#0d1520] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{review.authorName}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && <p className="font-medium text-white mb-1">{review.title}</p>}
                      <p className="text-slate-300 text-sm">{review.comment}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {review.ownerResponse && (
                        <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                          <p className="text-xs text-cyan-400 font-medium mb-1">Réponse du prestataire</p>
                          <p className="text-sm text-slate-300">{review.ownerResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directions */}
            {provider.latitude && provider.longitude && (
              <DirectionsWidget
                destinationLat={provider.latitude}
                destinationLng={provider.longitude}
                destinationName={provider.name}
                city={provider.city}
                district={provider.district}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Contacter</h3>

              {/* Booking + Chat Widget */}
              <BookingChatWidget
                establishmentId={provider.id}
                establishmentName={provider.name}
                establishmentType="provider"
                ownerId={(provider as any).claimedByUserId || null}
                pricePerNight={null}
              />

              {/* Contact direct */}
              <div className="space-y-3">
                {provider.phone && (
                  <a
                    href={`tel:${provider.phone}`}
                    className="flex items-center gap-3 w-full p-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Appeler
                  </a>
                )}
                {provider.whatsapp && (
                  <a
                    href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full p-3 bg-emerald-500/20 text-emerald-400 font-medium rounded-xl hover:bg-emerald-500/30 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp
                  </a>
                )}
                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="flex items-center gap-3 w-full p-3 bg-[#0d1520] text-slate-300 font-medium rounded-xl hover:bg-[#0d1520]/80 transition-all border border-[#2a2a36]"
                  >
                    <Mail className="w-5 h-5" />
                    Email
                  </a>
                )}
              </div>

              {/* Social links */}
              <div className="mt-4">
                <SocialLinks
                  facebook={provider.facebook}
                  instagram={provider.instagram}
                  website={provider.website}
                />
              </div>
            </div>

            {/* Similar Providers */}
            {similarProviders.length > 0 && (
              <div className="bg-[#1a1a24] rounded-2xl p-6 border border-[#2a2a36] mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Découvrir aussi</h3>
                <div className="space-y-3">
                  {similarProviders.map((sp) => (
                    <Link
                      key={sp.id}
                      href={`/bons-plans/prestataires/${sp.slug}`}
                      className="flex items-center gap-3 p-3 bg-[#0d1520] rounded-xl hover:bg-[#0d1520]/80 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#2a2a36] flex-shrink-0 relative">
                        {sp.coverImage ? (
                          <Image src={getImageUrl(sp.coverImage)} alt={sp.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">{sp.name}</p>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {sp.city}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-white">{sp.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
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
