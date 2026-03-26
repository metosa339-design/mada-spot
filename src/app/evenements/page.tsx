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
    <div className="min-h-screen bg-[#070710]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 flex items-center justify-center border border-orange-500/10">
              <Calendar className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Événements à Madagascar
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                Festivals, promotions, événements culturels et plus encore
              </p>
            </div>
          </div>
        </motion.div>

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
            <div className="relative">
              <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
              <div className="absolute inset-0 w-10 h-10 rounded-full bg-orange-500/20 animate-ping" />
            </div>
            <p className="text-gray-500 text-sm">Chargement des événements...</p>
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
                <div className="bg-[#0a0a14] rounded-2xl border border-[#1a1a2a] p-4 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] to-purple-500/[0.03] pointer-events-none" />
                  <div className="relative flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-semibold text-white">Ce mois-ci</span>
                  </div>
                  <div className="relative grid grid-cols-3 gap-2">
                    <div className="bg-[#070710] rounded-xl p-3 text-center border border-[#1a1a2a]">
                      <div className="text-xl font-black bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                        {events.length}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5 font-medium">Événements</div>
                    </div>
                    <div className="bg-[#070710] rounded-xl p-3 text-center border border-[#1a1a2a]">
                      <div className="text-xl font-black text-purple-400">
                        {events.filter((e) => e.badge).length}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5 font-medium">En vedette</div>
                    </div>
                    <div className="bg-[#070710] rounded-xl p-3 text-center border border-[#1a1a2a]">
                      <div className="text-xl font-black text-emerald-400">
                        {events.filter((e) => e.eventType === 'PROMOTION' || e.isPromotion).length}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5 font-medium">Promos</div>
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
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-lg font-bold text-white"
                  >
                    {selectedDay
                      ? format(selectedDay, "EEEE d MMMM yyyy", { locale: fr })
                      : 'Événements du mois'}
                  </motion.h2>
                </AnimatePresence>
                {selectedDay && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleDaySelect(null)}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors px-3 py-1.5 rounded-full border border-orange-500/20 hover:border-orange-500/40"
                  >
                    Voir tout le mois
                  </motion.button>
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
                    className="text-center py-16 bg-[#0a0a14] rounded-2xl border border-[#1a1a2a] relative overflow-hidden"
                  >
                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />

                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/10 flex items-center justify-center"
                      >
                        <PartyPopper className="w-10 h-10 text-gray-600" />
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-300 font-semibold text-lg mb-2"
                      >
                        {selectedDay
                          ? "Pas d'événement ce jour"
                          : 'Aucun événement ce mois-ci'}
                      </motion.p>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-500 text-sm max-w-md mx-auto mb-6"
                      >
                        {selectedDay
                          ? "Pas d'événement aujourd'hui, mais découvrez nos pépites pour les jours suivants !"
                          : 'Changez de mois pour explorer d\'autres événements passionnants.'}
                      </motion.p>

                      {/* Suggest next day with events */}
                      {nextWeekendWithEvents && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          onClick={() => handleDaySelect(nextWeekendWithEvents)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff6b35]/20 to-[#7c3aed]/20 border border-orange-500/20 rounded-xl text-sm font-medium text-orange-400 hover:text-orange-300 hover:border-orange-500/40 transition-all group"
                        >
                          <Rocket className="w-4 h-4" />
                          Voir le {format(nextWeekendWithEvents, 'EEEE d MMMM', { locale: fr })}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      )}

                      {!nextWeekendWithEvents && selectedDay && (
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          onClick={() => handleDaySelect(null)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#ff6b35]/20 to-[#7c3aed]/20 border border-orange-500/20 rounded-xl text-sm font-medium text-orange-400 hover:text-orange-300 hover:border-orange-500/40 transition-all group"
                        >
                          <Calendar className="w-4 h-4" />
                          Voir tous les événements du mois
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
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
