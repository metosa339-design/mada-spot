'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Loader2, Sparkles, ArrowRight, PartyPopper, Rocket } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import EventCalendar from '@/components/events/EventCalendar';
import EventCard from '@/components/events/EventCard';
import EventFilters from '@/components/events/EventFilters';
import EventHeroSlider from '@/components/events/EventHeroSlider';
import { useTrans } from '@/i18n';

interface EventData {
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
  badge?: string | null;
  eventType?: string;
  ctaLabel?: string | null;
  ctaLink?: string | null;
  isPinned?: boolean;
  isPromotion?: boolean;
  priorityScore?: number;
  establishment?: {
    id: string;
    name: string;
    slug: string;
    coverImage?: string | null;
  } | null;
}

export default function EvenementsPage() {
  const t = useTrans('events');
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [events, setEvents] = useState<EventData[]>([]);
  const [pinnedEvents, setPinnedEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filters, setFilters] = useState({ category: '', city: '' });
  const [animationKey, setAnimationKey] = useState(0);

  // Fetch all events for the month
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('month', String(currentMonth));
      params.set('year', String(currentYear));
      params.set('limit', '100');
      if (filters.category) params.set('category', filters.category);
      if (filters.city) params.set('city', filters.city);

      const res = await fetch(`/api/events?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear, filters.category, filters.city]);

  // Fetch pinned/featured events
  const fetchPinnedEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events?pinned=true&limit=10');
      const data = await res.json();
      if (data.success) {
        setPinnedEvents(data.events);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchPinnedEvents();
  }, [fetchPinnedEvents]);

  const handleMonthChange = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedDay(null);
    setAnimationKey((k) => k + 1);
  };

  const handleSetFilter = (key: 'category' | 'city', value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setSelectedDay(null);
  };

  const handleDaySelect = (date: Date | null) => {
    setSelectedDay(date);
    setAnimationKey((k) => k + 1);
  };

  // Events filtered by selected day (with date range support) + sorted by priority
  const displayEvents = useMemo(() => {
    let filtered = events;

    if (selectedDay) {
      filtered = events.filter((e) => {
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : start;
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
        const selDay = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate());
        return selDay >= startDay && selDay <= endDay;
      });
    }

    // Sort by priorityScore (desc), then pinned, then startDate
    return [...filtered].sort((a, b) => {
      const pa = a.priorityScore || 0;
      const pb = b.priorityScore || 0;
      if (pa !== pb) return pb - pa;
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events, selectedDay]);

  // Separate VIP events (priorityScore >= 5) from standard
  const vipEvents = useMemo(() => displayEvents.filter((e) => (e.priorityScore || 0) >= 5), [displayEvents]);
  const standardEvents = useMemo(() => displayEvents.filter((e) => (e.priorityScore || 0) < 5), [displayEvents]);

  // Find next weekend with events for empty state
  const nextWeekendWithEvents = useMemo(() => {
    if (displayEvents.length > 0 || !selectedDay) return null;
    // Look forward up to 14 days for events
    for (let i = 1; i <= 14; i++) {
      const futureDay = addDays(selectedDay, i);
      const hasEvents = events.some((e) => {
        const start = new Date(e.startDate);
        const end = e.endDate ? new Date(e.endDate) : start;
        return futureDay >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
               futureDay <= new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
      });
      if (hasEvents) return futureDay;
    }
    return null;
  }, [displayEvents, selectedDay, events]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#FFF7ED] border border-[#FF6B35]/25 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-1">Agenda</p>
              <h1 className="text-[24px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[#0F172A]">
                {t.heroTitle}
              </h1>
              <p className="text-[#64748B] text-[13px] mt-1">
                {t.heroSubtitleAlt}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Slider - Pinned/Featured events */}
        {pinnedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <EventHeroSlider events={pinnedEvents} />
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-6"
        >
          <EventFilters filters={filters} setFilter={handleSetFilter} />
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
            <p className="text-[#64748B] text-[13px]">{t.loadingEvents}</p>
          </div>
        )}

        {/* Main content */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT - Calendar */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="sticky top-28 space-y-4"
              >
                <EventCalendar
                  events={events}
                  onMonthChange={handleMonthChange}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  onDaySelect={handleDaySelect}
                  selectedDay={selectedDay}
                />

                {/* Quick stats */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
                    <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#FF6B35]">{t.thisMonth}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-3 text-center border border-[#E2E8F0]">
                      <div className="text-[20px] font-semibold font-mono text-[#0F172A]">
                        {events.length}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-[#64748B] mt-1">{t.statEvents}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-[#E2E8F0]">
                      <div className="text-[20px] font-semibold font-mono text-[#0F172A]">
                        {events.filter((e) => e.badge).length}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-[#64748B] mt-1">{t.statFeatured}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center border border-[#E2E8F0]">
                      <div className="text-[20px] font-semibold font-mono text-[#0F172A]">
                        {events.filter((e) => e.eventType === 'PROMOTION' || e.isPromotion).length}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.1em] text-[#64748B] mt-1">{t.statPromos}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT - Event Cards */}
            <div className="lg:col-span-8">
              {/* Section title with animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between mb-5"
              >
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={selectedDay?.toDateString() || 'all'}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="text-[18px] font-semibold tracking-[-0.01em] text-[#0F172A]"
                  >
                    {selectedDay
                      ? format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })
                      : t.monthEvents}
                  </motion.h2>
                </AnimatePresence>
                {selectedDay && (
                  <button
                    onClick={() => handleDaySelect(null)}
                    className="text-[12px] text-[#FF6B35] hover:text-[#F97316] transition-colors px-3 py-1.5 rounded-lg border border-[#FF6B35]/25 hover:border-[#FF6B35]/40"
                  >
                    {t.seeWholeMonth}
                  </button>
                )}
              </motion.div>

              {/* Event cards with staggered animation */}
              <AnimatePresence mode="wait">
                {displayEvents.length > 0 ? (
                  <motion.div
                    key={`events-${animationKey}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* VIP Events - Full width */}
                    {vipEvents.length > 0 && (
                      <div className="space-y-4 mb-6">
                        {vipEvents.map((event, index) => (
                          <EventCard key={event.id} event={event} index={index} isVip />
                        ))}
                      </div>
                    )}

                    {/* Standard Events - Grid */}
                    {standardEvents.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {standardEvents.map((event, index) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            index={index + vipEvents.length}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Elegant Empty State */
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="text-center py-16 bg-white rounded-xl border border-[#E2E8F0]"
                  >
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#FFF7ED] border border-[#FF6B35]/25 flex items-center justify-center">
                        <PartyPopper className="w-7 h-7 text-[#FF6B35]" />
                      </div>

                      <p className="text-[#0F172A] font-semibold text-[16px] mb-2">
                        {selectedDay
                          ? t.noEventThisDay
                          : t.noEventThisMonth}
                      </p>

                      <p className="text-[#64748B] text-[13px] max-w-md mx-auto mb-6 leading-relaxed">
                        {selectedDay
                          ? t.noEventThisDayDesc
                          : t.noEventThisMonthDesc}
                      </p>

                      {nextWeekendWithEvents && (
                        <button
                          onClick={() => handleDaySelect(nextWeekendWithEvents)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-[13px] font-medium text-[#0F172A] transition-colors group"
                        >
                          <Rocket className="w-3.5 h-3.5 text-[#FF6B35]" />
                          {t.seeDay} {format(nextWeekendWithEvents, 'EEEE d MMMM', { locale: fr })}
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      {!nextWeekendWithEvents && selectedDay && (
                        <button
                          onClick={() => handleDaySelect(null)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg text-[13px] font-medium text-[#0F172A] transition-colors group"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
                          {t.seeAllMonthEvents}
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
