'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Building2,
  Repeat,
  Loader2,
  Music,
  Landmark,
  Trophy,
  TreePine,
  ShoppingBag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { CATEGORY_COLORS } from '@/lib/data/event-categories';

interface EventDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  city: string;
  region?: string | null;
  category: string;
  coverImage?: string | null;
  organizer?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null;
  badge?: string | null;
  eventType?: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  establishment?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    coverImage?: string | null;
    city: string;
  } | null;
}

function buildJsonLd(event: EventDetail) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.startDate,
    endDate: event.endDate || undefined,
    description: event.description || undefined,
    image: event.coverImage || undefined,
    location: {
      '@type': 'Place',
      name: event.location || event.city,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city,
        addressRegion: event.region || 'Madagascar',
        addressCountry: 'MG',
      },
    },
    organizer: event.organizer ? {
      '@type': 'Organization',
      name: event.organizer,
    } : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
  return JSON.stringify(jsonLd);
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FESTIVAL: Music,
  CULTURAL: Landmark,
  SPORT: Trophy,
  NATURE: TreePine,
  MARKET: ShoppingBag,
  OTHER: Calendar,
};

const CATEGORY_LABELS: Record<string, string> = {
  FESTIVAL: 'Festival',
  CULTURAL: 'Culturel',
  SPORT: 'Sport',
  NATURE: 'Nature',
  MARKET: 'Marché',
  OTHER: 'Autre',
};

const BADGE_COLORS: Record<string, string> = {
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const GRADIENT_BG: Record<string, string> = {
  pink: 'from-pink-600 to-pink-900',
  purple: 'from-purple-600 to-purple-900',
  green: 'from-green-600 to-green-900',
  emerald: 'from-emerald-600 to-emerald-900',
  amber: 'from-amber-600 to-amber-900',
  gray: 'from-gray-600 to-gray-900',
};

function formatDateRange(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate);
  if (!endDate) {
    return format(start, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr });
  }
  const end = new Date(endDate);
  if (start.toDateString() === end.toDateString()) {
    return `${format(start, "EEEE d MMMM yyyy, HH:mm", { locale: fr })} - ${format(end, 'HH:mm', { locale: fr })}`;
  }
  return `${format(start, "d MMMM yyyy", { locale: fr })} - ${format(end, "d MMMM yyyy", { locale: fr })}`;
}

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${slug}`);
        const data = await res.json();
        if (data.success) {
          setEvent(data.event);
        } else {
          setError(data.error || 'Événement non trouvé');
        }
      } catch {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070710] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#070710] flex flex-col items-center justify-center">
        <Calendar className="w-16 h-16 text-gray-700 mb-4" />
        <p className="text-gray-400 text-lg mb-4">{error || 'Événement non trouvé'}</p>
        <Link
          href="/evenements"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
      </div>
    );
  }

  const color = CATEGORY_COLORS[event.category] || 'gray';
  const Icon = CATEGORY_ICONS[event.category] || Calendar;
  const badgeColor = BADGE_COLORS[color] || BADGE_COLORS.gray;
  const gradient = GRADIENT_BG[color] || GRADIENT_BG.gray;

  return (
    <div className="min-h-screen bg-[#070710]">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildJsonLd(event) }}
      />

      {/* Cover image hero */}
      <div className="relative w-full h-64 sm:h-80 md:h-96">
        {event.coverImage ? (
          <Image
            src={getImageUrl(event.coverImage)}
            alt={event.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <Icon className="w-24 h-24 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070710] via-[#070710]/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-24 left-4 sm:left-8">
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-white text-sm hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux événements
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-16">
        {/* Category badge + Event badge */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${badgeColor}`}>
            <Icon className="w-4 h-4" />
            {CATEGORY_LABELS[event.category] || 'Autre'}
          </div>
          {event.badge && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${
              event.badge === 'NOUVEAU' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
              event.badge === 'PROMO' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
              event.badge === 'EXCLUSIF' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
              'bg-blue-500/20 text-blue-400 border-blue-500/40'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              {event.badge}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          {event.title}
        </h1>

        {/* Meta info */}
        <div className="space-y-3 mb-8">
          {/* Date */}
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 text-gray-300">
            <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <span>
              {event.location ? `${event.location}, ` : ''}
              {event.city}
              {event.region ? ` (${event.region})` : ''}
            </span>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center gap-3 text-gray-300">
              <User className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <span>Organisé par {event.organizer}</span>
            </div>
          )}

          {/* Recurring */}
          {event.isRecurring && (
            <div className="flex items-center gap-3 text-amber-400/80">
              <Repeat className="w-5 h-5 flex-shrink-0" />
              <span>Événement récurrent{event.recurrenceRule ? ` - ${event.recurrenceRule}` : ''}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="bg-[#0c0c16] rounded-2xl border border-[#1e1e2e] p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
            <div className="text-gray-400 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </div>
          </div>
        )}

        {/* Linked establishment */}
        {event.establishment && (
          <div className="bg-[#0c0c16] rounded-2xl border border-[#1e1e2e] p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Lieu associé</h2>
            <Link
              href={`/bons-plans/${event.establishment.type === 'HOTEL' ? 'hotels' : event.establishment.type === 'RESTAURANT' ? 'restaurants' : event.establishment.type === 'ATTRACTION' ? 'attractions' : 'prestataires'}/${event.establishment.slug}`}
              className="flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                {event.establishment.coverImage ? (
                  <Image
                    src={getImageUrl(event.establishment.coverImage)}
                    alt={event.establishment.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-medium group-hover:text-orange-400 transition-colors">
                  {event.establishment.name}
                </p>
                <p className="text-gray-500 text-sm">{event.establishment.city}</p>
              </div>
            </Link>
          </div>
        )}

        {/* CTA Button */}
        {event.ctaLabel && event.ctaLink && (
          <div className="mb-8">
            <a
              href={event.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-base transition-colors"
            >
              {event.ctaLabel}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* Back button */}
        <Link
          href="/evenements"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
      </div>
    </div>
  );
}
