'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin,
  Repeat,
  Music,
  Landmark,
  Trophy,
  TreePine,
  ShoppingBag,
  Calendar,
  Sparkles,
  Pin,
  ExternalLink,
  Crown,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CATEGORY_COLORS } from '@/lib/data/event-categories';
import { getImageUrl } from '@/lib/image-url';

interface EventCardEvent {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  city: string;
  category: string;
  coverImage?: string | null;
  isRecurring?: boolean;
  organizer?: string | null;
  badge?: string | null;
  eventType?: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  isPinned?: boolean;
  isPromotion?: boolean;
  priorityScore?: number;
}

interface EventCardProps {
  event: EventCardEvent;
  index?: number;
  isVip?: boolean;
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

const BADGE_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ComponentType<{ className?: string }> }> = {
  NOUVEAU: { bg: 'bg-emerald-500/25', text: 'text-emerald-300', border: 'border-emerald-400/40', icon: Sparkles },
  PROMO: { bg: 'bg-orange-500/25', text: 'text-orange-300', border: 'border-orange-400/40', icon: Zap },
  EXCLUSIF: { bg: 'bg-purple-500/25', text: 'text-purple-300', border: 'border-purple-400/40', icon: Crown },
  OFFICIEL: { bg: 'bg-blue-500/25', text: 'text-blue-300', border: 'border-blue-400/40', icon: Sparkles },
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  EVENT: { label: 'Événement', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  PROMOTION: { label: 'Promo', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  ADVERTISEMENT: { label: 'Sponsorisé', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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
    return format(start, 'd MMMM yyyy', { locale: fr });
  }
  const end = new Date(endDate);
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'd', { locale: fr })}-${format(end, 'd MMMM yyyy', { locale: fr })}`;
  }
  return `${format(start, 'd MMM', { locale: fr })} - ${format(end, 'd MMM yyyy', { locale: fr })}`;
}

// Check if event ends soon (within 48h)
function isLastChance(endDate?: string | null): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return diff > 0 && diff < 48 * 60 * 60 * 1000;
}

export default function EventCard({ event, index = 0, isVip }: EventCardProps) {
  const color = CATEGORY_COLORS[event.category] || 'gray';
  const Icon = CATEGORY_ICONS[event.category] || Calendar;
  const gradient = GRADIENT_BG[color] || GRADIENT_BG.gray;
  const startDate = new Date(event.startDate);
  const badgeStyle = event.badge ? BADGE_STYLES[event.badge] : null;
  const BadgeIcon = badgeStyle?.icon || Sparkles;
  const typeInfo = TYPE_LABELS[event.eventType || 'EVENT'] || TYPE_LABELS.EVENT;
  const lastChance = isLastChance(event.endDate);
  const effectiveVip = isVip || (event.priorityScore || 0) >= 5;

  // VIP Card - larger, horizontal layout
  if (effectiveVip) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Link
          href={`/evenements/${event.slug}`}
          className="group block relative rounded-2xl overflow-hidden border border-[#1a1a2a] hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10"
        >
          {/* Full-width immersive image */}
          <div className="relative h-[260px] sm:h-[320px] overflow-hidden">
            {event.coverImage ? (
              <Image
                src={getImageUrl(event.coverImage)}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                <Icon className="w-20 h-20 text-white/10" />
              </div>
            )}

            {/* Multi-layer overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

            {/* VIP Crown badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 border border-amber-400/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg shadow-amber-500/10">
                <Crown className="w-3 h-3" />
                VIP
              </span>
              <span className={`px-2.5 py-1.5 rounded-full text-[10px] font-semibold border backdrop-blur-md ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            </div>

            {/* Top-right badges */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {event.badge && badgeStyle && (
                <span className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold border backdrop-blur-md flex items-center gap-1 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shadow-lg`}>
                  <BadgeIcon className="w-3 h-3" />
                  {event.badge}
                </span>
              )}
              {lastChance && (
                <span className="px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-red-500/25 text-red-300 border border-red-400/40 backdrop-blur-md flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  Dernière chance
                </span>
              )}
            </div>

            {/* Pinned indicator */}
            {event.isPinned && (
              <div className="absolute top-4 left-[140px] w-7 h-7 rounded-full bg-orange-500/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Pin className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {/* Content overlay - bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-orange-200 transition-colors">
                {event.title}
              </h3>

              {event.description && (
                <p className="text-gray-300/80 text-sm mb-3 line-clamp-2 max-w-xl">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  {event.city}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
                {event.isRecurring && (
                  <span className="flex items-center gap-1.5 text-amber-400/80">
                    <Repeat className="w-3.5 h-3.5" />
                    Récurrent
                  </span>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff6b35] to-[#ff3d7f] text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                  Voir les détails
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
                {event.ctaLabel && event.ctaLink && (
                  <a
                    href={event.ctaLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl text-sm border border-white/20 transition-all"
                  >
                    {event.ctaLabel}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Standard Card - Premium "Ad Card" style
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        href={`/evenements/${event.slug}`}
        className="group block relative rounded-2xl overflow-hidden border border-[#1a1a2a] hover:border-orange-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-black/30 hover:scale-[1.03]"
      >
        {/* Image with immersive overlay */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {event.coverImage ? (
            <Image
              src={getImageUrl(event.coverImage)}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="w-14 h-14 text-white/15" />
            </div>
          )}

          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Date badge (top-left) - glassmorphism */}
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md rounded-xl px-3 py-2 text-center border border-white/10">
            <div className="text-xl font-black text-white leading-tight">
              {format(startDate, 'd')}
            </div>
            <div className="text-[9px] font-semibold text-gray-300 uppercase tracking-wider">
              {format(startDate, 'MMM', { locale: fr })}
            </div>
          </div>

          {/* Event type + Category (top-right) */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
            {event.eventType && event.eventType !== 'EVENT' && (
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-md ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
            )}
            {event.isPromotion && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-orange-500/25 to-pink-500/25 text-orange-300 border border-orange-400/30 backdrop-blur-md">
                Promo
              </span>
            )}
          </div>

          {/* Badge overlay - bottom left */}
          {event.badge && badgeStyle && (
            <div className={`absolute bottom-14 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md flex items-center gap-1 shadow-lg ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
              <BadgeIcon className="w-3 h-3" />
              {event.badge}
            </div>
          )}

          {/* Last chance tag */}
          {lastChance && (
            <div className="absolute bottom-14 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/25 text-red-300 border border-red-400/40 backdrop-blur-md flex items-center gap-1 animate-pulse">
              <Clock className="w-3 h-3" />
              Dernière chance
            </div>
          )}

          {/* Pinned glow */}
          {event.isPinned && (
            <div className="absolute top-3 left-[72px] w-6 h-6 rounded-full bg-orange-500/80 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Pin className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Bottom content on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-base leading-tight mb-1.5 line-clamp-2 group-hover:text-orange-200 transition-colors">
              {event.title}
            </h3>

            <div className="flex items-center gap-3 text-gray-300 text-xs">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400/70" />
                {event.city}
              </span>
              <span className="text-gray-600">|</span>
              <span>{formatDateRange(event.startDate, event.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#0c0c16] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {event.isRecurring && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400/70">
                <Repeat className="w-3 h-3" />
                Récurrent
              </span>
            )}
            <span className="text-[10px] text-gray-600">
              {CATEGORY_LABELS[event.category] || 'Autre'}
            </span>
          </div>

          {event.ctaLabel && event.ctaLink ? (
            <a
              href={event.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#ff6b35] to-[#ff3d7f] rounded-lg text-[11px] font-semibold text-white shadow-md shadow-orange-500/15 hover:shadow-orange-500/30 transition-shadow overflow-hidden"
            >
              {/* Shimmer effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative">{event.ctaLabel}</span>
              <ExternalLink className="w-3 h-3 relative" />
            </a>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-gray-500 group-hover:text-orange-400 transition-colors">
              Voir plus
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
