'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Building2,
  UtensilsCrossed,
  Mountain,
  Briefcase,
} from 'lucide-react';
import { useTrans } from '@/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

type Tab = 'hotels' | 'restaurants' | 'attractions' | 'guides';

/**
 * HeroClean — Booking.com inspired hero.
 *
 * Structure :
 *  - Bandeau bleu avec tabs catégorie en haut + grid 2 cols (texte + image immersive)
 *  - Search bar simplifiée 1 ligne en bas, dépasse à cheval bleu/blanc
 *  - Bordure orange MadaSpot autour de la search box (signature)
 *
 * Les popovers (suggestions / dates / voyageurs) apparaissent via une petite
 * animation CSS (.pop-in) — plus de framer-motion, pour alléger le bundle.
 */
export default function HeroClean() {
  const t = useTrans('home');
  const { locale } = useLanguage();
  const [tab, setTab] = useState<Tab>('hotels');
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [openPopover, setOpenPopover] = useState<'dates' | 'guests' | null>(null);
  const router = useRouter();

  // --- Autocomplete Destination ---
  const [cities, setCities] = useState<{ name: string; slug: string; count?: number }[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [sugIndex, setSugIndex] = useState(-1);

  useEffect(() => {
    fetch('/api/bons-plans/cities')
      .then((r) => (r.ok ? r.json() : { cities: [] }))
      .then((d) => setCities(Array.isArray(d?.cities) ? d.cities : []))
      .catch(() => {});
  }, []);

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const suggestions = useMemo(() => {
    const q = normalize(destination.trim());
    if (!q) return [] as typeof cities;
    const starts: typeof cities = [];
    const includes: typeof cities = [];
    for (const c of cities) {
      const n = normalize(c.name);
      if (n.startsWith(q)) starts.push(c);
      else if (n.includes(q)) includes.push(c);
    }
    return [...starts, ...includes].slice(0, 8);
  }, [destination, cities]);

  const selectCity = (name: string) => {
    setDestination(name);
    setShowSug(false);
    setSugIndex(-1);
  };

  const onDestinationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSugIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSugIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && sugIndex >= 0 && sugIndex < suggestions.length) {
      e.preventDefault();
      selectCity(suggestions[sugIndex].name);
    } else if (e.key === 'Escape') {
      setShowSug(false);
    }
  };

  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR';
  const formatDateRange = (ci: string, co: string): string => {
    if (!ci && !co) return t.datesChoose;
    const fmt = (d: string) =>
      new Date(d + 'T00:00:00').toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
    if (ci && co) return `${fmt(ci)} → ${fmt(co)}`;
    if (ci) return `${t.datesFrom} ${fmt(ci)}`;
    return `${t.datesUntil} ${fmt(co)}`;
  };

  const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'hotels', label: t.tabAccommodation, icon: Building2 },
    { key: 'restaurants', label: t.restaurantsLabel, icon: UtensilsCrossed },
    { key: 'attractions', label: t.tabActivities, icon: Mountain },
    { key: 'guides', label: t.tabGuides, icon: Briefcase },
  ];

  const todayISO = new Date().toISOString().slice(0, 10);
  const guestsLabel = `${adults} ${adults > 1 ? t.adultPlural : t.adultSingular}${
    children > 0 ? `, ${children} ${children > 1 ? t.childPlural : t.childSingular}` : ''
  }`;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOpenPopover(null);
    setShowSug(false);
    const q = destination.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    // L'API attend HOTEL / RESTAURANT / ATTRACTION / PROVIDER, pas les clés d'onglet.
    const TYPE_API: Record<Tab, string> = {
      hotels: 'HOTEL',
      restaurants: 'RESTAURANT',
      attractions: 'ATTRACTION',
      guides: 'PROVIDER',
    };
    if (tab) params.set('type', TYPE_API[tab]);
    // Si la destination correspond exactement à une ville connue, on filtre
    // précisément par ville (ex : "Hébergement" + "Ambositra" => hôtels à Ambositra).
    const matchedCity = cities.find((c) => normalize(c.name) === normalize(q));
    if (matchedCity) params.set('city', matchedCity.name);
    if (checkIn) params.set('checkin', checkIn);
    if (checkOut) params.set('checkout', checkOut);
    if (adults !== 2) params.set('adults', String(adults));
    if (children > 0) params.set('children', String(children));
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  };

  return (
    <section className="relative bg-[#F8FAFC]">
      {/* Bandeau bleu */}
      <div className="bg-[#003B95] px-4 sm:px-6 pb-12 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Tabs catégorie */}
          <div className="pt-4 sm:pt-6 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[12px] sm:text-[14px] font-semibold whitespace-nowrap border transition-all ${
                  tab === t.key
                    ? 'bg-transparent text-white border-white'
                    : 'bg-transparent text-white/70 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenu hero : grid 2 cols (texte 45% / image 55%) */}
          <div className="grid lg:grid-cols-[9fr_11fr] gap-5 sm:gap-8 lg:gap-12 items-stretch mt-5 sm:mt-10">
            {/* Texte — candidat LCP : transform-only (opacity:1), peint immédiatement */}
            <div className="hero-rise text-center lg:text-left flex flex-col justify-center py-3 sm:py-10">
              {/* Eyebrow */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[12px] text-white/90 font-medium mb-5 border border-white/15 mx-auto lg:mx-0 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                <span>{t.heroBadge}</span>
              </div>

              <h1
                className="text-white text-[28px] sm:text-[44px] lg:text-[56px] font-bold leading-[1.05] tracking-[-0.025em]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {t.heroMainTitle1}{' '}
                <span className="text-[#FF6B35]">{t.heroMainTitle2}</span>
              </h1>
              <p className="mt-2.5 sm:mt-5 text-[14px] sm:text-[18px] text-white/85 max-w-xl leading-relaxed mx-auto lg:mx-0">
                {t.heroMainSubtitle}
              </p>
            </div>

            {/* Photo immersive — candidat LCP : zoom CSS sur l'image (opacity:1), priority utile */}
            <div className="relative h-[200px] sm:h-[360px] lg:h-full lg:min-h-[460px] w-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)] bg-gradient-to-br from-[#003B95] via-[#0F172A] to-[#FF6B35]/40">
              <Image
                src="/images/highlights/hero-pool-madagascar.jpg"
                alt="Madagascar"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center hero-zoom"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search bar à cheval bleu/blanc (style Booking) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-10 relative z-10">
        <form
          onSubmit={handleSearch}
          style={{ animationDelay: '0.2s' }}
          className="hero-fade-rise relative z-20 grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-0 bg-white rounded-2xl border border-[#FF6B35]/60 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.02]"
        >
          {/* Destination + autocomplete */}
          <div className="relative col-span-2 md:col-span-1 border-b md:border-b-0 md:border-r border-gray-100">
            <label className="flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3.5 transition-colors hover:bg-gray-50/50">
              <MapPin className="w-5 h-5 text-[#FF6B35] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  {t.destinationLabel}
                </p>
                <input
                  type="text"
                  value={destination}
                  autoComplete="off"
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setShowSug(true);
                    setSugIndex(-1);
                  }}
                  onFocus={() => {
                    if (destination.trim()) setShowSug(true);
                  }}
                  onKeyDown={onDestinationKeyDown}
                  placeholder={t.destinationPlaceholder}
                  className="w-full outline-none text-[14px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal bg-transparent"
                />
              </div>
            </label>
            {showSug && suggestions.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowSug(false)}
                  aria-hidden="true"
                />
                <ul className="pop-in absolute top-full left-0 right-0 md:min-w-[280px] mt-2 z-40 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.15)] overflow-hidden max-h-72 overflow-y-auto py-1">
                  {suggestions.map((c, i) => (
                    <li key={c.slug}>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectCity(c.name);
                        }}
                        onMouseEnter={() => setSugIndex(i)}
                        className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-[14px] transition-colors ${
                          i === sugIndex ? 'bg-[#FFF7ED]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-[#FF6B35] shrink-0" />
                        <span className="font-medium text-[#0F172A] truncate">{c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Dates */}
          <div className="relative border-b md:border-b-0 border-r md:border-r border-gray-100">
            <button
              type="button"
              onClick={() => setOpenPopover(openPopover === 'dates' ? null : 'dates')}
              className="w-full flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-left hover:bg-[#FFF7ED]/40 transition-colors"
            >
              <Calendar className="w-5 h-5 text-[#64748B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{t.datesLabel}</p>
                <p
                  className={`text-[14px] font-semibold truncate ${
                    checkIn || checkOut ? 'text-[#0F172A]' : 'text-[#94A3B8]'
                  }`}
                >
                  {formatDateRange(checkIn, checkOut)}
                </p>
              </div>
            </button>
            {openPopover === 'dates' && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setOpenPopover(null)}
                  aria-hidden="true"
                />
                <div className="pop-in absolute top-full left-0 right-0 md:right-auto md:min-w-[300px] mt-2 z-40 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_12px_36px_rgba(15,23,42,0.15)] p-4">
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="hero-checkin"
                        className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5"
                      >
                        {t.arrival}
                      </label>
                      <input
                        id="hero-checkin"
                        type="date"
                        min={todayISO}
                        value={checkIn}
                        onChange={(e) => {
                          const v = e.target.value;
                          setCheckIn(v);
                          if (checkOut && v && v > checkOut) setCheckOut('');
                        }}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-[14px] text-[#0F172A] outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="hero-checkout"
                        className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider mb-1.5"
                      >
                        {t.departure}
                      </label>
                      <input
                        id="hero-checkout"
                        type="date"
                        min={checkIn || todayISO}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-md text-[14px] text-[#0F172A] outline-none focus:border-[#FF6B35] transition-colors"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckIn('');
                          setCheckOut('');
                        }}
                        className="text-[12px] text-[#64748B] hover:text-[#0F172A] font-medium"
                      >
                        {t.clearDates}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenPopover(null)}
                        className="px-3 py-1.5 rounded-md bg-[#FF6B35] hover:bg-[#F97316] text-white text-[12px] font-semibold transition-colors"
                      >
                        {t.validate}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Voyageurs */}
          <div className="relative border-b md:border-b-0 md:border-r border-gray-100">
            <button
              type="button"
              onClick={() => setOpenPopover(openPopover === 'guests' ? null : 'guests')}
              className="w-full flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3.5 text-left hover:bg-[#FFF7ED]/40 transition-colors"
            >
              <Users className="w-5 h-5 text-[#64748B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  {t.travelers}
                </p>
                <p className="text-[14px] font-semibold text-[#0F172A] truncate">{guestsLabel}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#64748B] transition-transform ${
                  openPopover === 'guests' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openPopover === 'guests' && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setOpenPopover(null)}
                  aria-hidden="true"
                />
                <div className="pop-in absolute top-full left-0 right-0 md:right-auto md:min-w-[300px] mt-2 z-40 bg-white border border-[#E2E8F0] rounded-xl shadow-[0_12px_36px_rgba(15,23,42,0.15)] p-4">
                  <GuestRow
                    label={t.adultsLabel}
                    sub={t.adultsAge}
                    value={adults}
                    min={1}
                    max={20}
                    onChange={setAdults}
                    decreaseLabel={t.decrease}
                    increaseLabel={t.increase}
                  />
                  <div className="h-px bg-[#E2E8F0] my-3" />
                  <GuestRow
                    label={t.childrenLabel}
                    sub={t.childrenAge}
                    value={children}
                    min={0}
                    max={10}
                    onChange={setChildren}
                    decreaseLabel={t.decrease}
                    increaseLabel={t.increase}
                  />
                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setOpenPopover(null)}
                      className="px-3 py-1.5 rounded-md bg-[#FF6B35] hover:bg-[#F97316] text-white text-[12px] font-semibold transition-colors"
                    >
                      {t.validate}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* CTA Rechercher */}
          <button
            type="submit"
            className="col-span-2 md:col-span-1 bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold px-6 py-3 sm:py-3.5 transition-all duration-200 hover:scale-[1.02] active:scale-100 hover:shadow-[0_8px_20px_-6px_rgba(255,107,53,0.55)] text-[14px] sm:text-[15px] flex items-center justify-center gap-2 whitespace-nowrap rounded-b-2xl md:rounded-b-none md:rounded-r-2xl"
          >
            <Search className="w-4 h-4" />
            {t.searchBtn}
          </button>
        </form>

        {/* Trust signals */}
        <div
          style={{ animationDelay: '0.35s' }}
          className="hero-fade mt-7 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-10 px-1 sm:px-2"
        >
          <TrustItem value="230+" label={t.trustVerified} />
          <TrustItem value="18" label={t.trustRegions} />
          <TrustItem value="4.7" suffix="★" label={t.averageRating} highlight />
        </div>
      </div>

    </section>
  );
}

function TrustItem({
  value,
  suffix,
  label,
  highlight,
}: {
  value: string;
  suffix?: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-0.5">
        <span className="text-[24px] sm:text-[30px] font-bold text-[#1E293B] tracking-[-0.03em] font-mono tabular-nums">
          {value}
        </span>
        {suffix && (
          <span
            className={`text-[18px] sm:text-[22px] font-bold ${
              highlight ? 'text-[#FF6B35]' : 'text-[#94A3B8]'
            }`}
          >
            {suffix}
          </span>
        )}
      </div>
      <p className="text-[12px] sm:text-[13px] text-[#475569] tracking-tight mt-1.5 leading-snug">{label}</p>
    </div>
  );
}

function GuestRow({
  label,
  sub,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  sub: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[14px] font-semibold text-[#0F172A]">{label}</p>
        <p className="text-[11px] text-[#94A3B8]">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${decreaseLabel} ${label.toLowerCase()}`}
          className="w-8 h-8 rounded-full border border-[#E2E8F0] text-[#FF6B35] font-bold text-[16px] flex items-center justify-center hover:border-[#FF6B35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <span className="w-6 text-center text-[14px] font-semibold text-[#0F172A] tabular-nums">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${increaseLabel} ${label.toLowerCase()}`}
          className="w-8 h-8 rounded-full border border-[#E2E8F0] text-[#FF6B35] font-bold text-[16px] flex items-center justify-center hover:border-[#FF6B35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
