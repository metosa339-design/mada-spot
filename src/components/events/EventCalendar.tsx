'use client';

import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | null;
  category: string;
  eventType?: string;
  isPinned?: boolean;
  priorityScore?: number;
}

interface EventCalendarProps {
  events: CalendarEvent[];
  onMonthChange: (year: number, month: number) => void;
  currentYear: number;
  currentMonth: number;
  onDaySelect?: (date: Date) => void;
  selectedDay?: Date | null;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// Badge colors by eventType
const EVENT_TYPE_DOT: Record<string, { color: string; glow: string }> = {
  EVENT: { color: 'bg-emerald-400', glow: 'shadow-emerald-400/50' },
  PROMOTION: { color: 'bg-orange-400', glow: 'shadow-orange-400/50' },
  ADVERTISEMENT: { color: 'bg-purple-400', glow: 'shadow-purple-400/50' },
};

export default function EventCalendar({
  events,
  onMonthChange,
  currentYear,
  currentMonth,
  onDaySelect,
  selectedDay,
}: EventCalendarProps) {
  const [direction, setDirection] = useState(0);
  const currentDate = new Date(currentYear, currentMonth - 1, 1);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentYear, currentMonth]);

  // Map events to days - support date ranges
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const start = new Date(event.startDate);
      const end = event.endDate ? new Date(event.endDate) : start;

      // For each day in the calendar range, check if event spans it
      calendarDays.forEach((day) => {
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

        const eventStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const eventEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

        if (dayStart <= eventEnd && dayEnd >= eventStart) {
          const dateKey = day.toDateString();
          const existing = map.get(dateKey) || [];
          if (!existing.find((e) => e.id === event.id)) {
            existing.push(event);
          }
          map.set(dateKey, existing);
        }
      });
    });
    return map;
  }, [events, calendarDays]);

  const handlePrevMonth = () => {
    setDirection(-1);
    if (currentMonth === 1) {
      onMonthChange(currentYear - 1, 12);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setDirection(1);
    if (currentMonth === 12) {
      onMonthChange(currentYear + 1, 1);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: fr });

  // Get unique event types for a given day
  const getDayEventTypes = (dayEvents: CalendarEvent[]): string[] => {
    const types = new Set<string>();
    dayEvents.forEach((e) => types.add(e.eventType || 'EVENT'));
    return Array.from(types);
  };

  // Check if day has high-priority (VIP) events
  const hasVipEvents = (dayEvents: CalendarEvent[]): boolean => {
    return dayEvents.some((e) => (e.priorityScore || 0) >= 5 || e.isPinned);
  };

  return (
    <div className="relative bg-[#0a0a14] rounded-2xl border border-[#1a1a2a] p-4 sm:p-5 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-5">
        <button
          onClick={handlePrevMonth}
          aria-label="Mois précédent"
          className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h3
            key={monthLabel}
            initial={{ y: direction > 0 ? 20 : -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction > 0 ? -20 : 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-lg font-bold text-white capitalize"
          >
            {monthLabel}
          </motion.h3>
        </AnimatePresence>
        <button
          onClick={handleNextMonth}
          aria-label="Mois suivant"
          className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day names */}
      <div className="relative grid grid-cols-7 gap-1 mb-2">
        {DAY_NAMES.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-gray-600 uppercase tracking-wider py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells with animation */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative grid grid-cols-7 gap-1"
        >
          {calendarDays.map((day, index) => {
            const dateKey = day.toDateString();
            const dayEvents = eventsByDay.get(dateKey) || [];
            const hasEvents = dayEvents.length > 0;
            const inCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;
            const eventTypes = getDayEventTypes(dayEvents);
            const isVip = hasVipEvents(dayEvents);

            return (
              <motion.button
                key={dateKey}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.008, duration: 0.2 }}
                onClick={() => {
                  if (onDaySelect) {
                    onDaySelect(isSelected ? null as unknown as Date : day);
                  }
                }}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-xl
                  text-sm transition-all duration-300 group
                  ${!inCurrentMonth ? 'text-gray-800 opacity-40' : 'text-gray-400'}
                  ${isSelected
                    ? 'bg-gradient-to-br from-[#ff6b35] via-[#ff3d7f] to-[#7c3aed] text-white shadow-lg shadow-orange-500/20 scale-110 z-10'
                    : isCurrentDay
                      ? 'bg-gradient-to-br from-orange-500/15 to-purple-500/15 ring-1 ring-orange-500/40 text-orange-300'
                      : hasEvents
                        ? 'hover:bg-white/[0.06] cursor-pointer hover:scale-105'
                        : 'cursor-default'
                  }
                `}
              >
                {/* VIP fire indicator */}
                {isVip && !isSelected && inCurrentMonth && (
                  <Flame className="absolute -top-1 -right-1 w-3 h-3 text-orange-400 animate-pulse" />
                )}

                <span
                  className={`
                    relative z-10 font-medium
                    ${isSelected ? 'text-white font-bold text-base' : ''}
                    ${isCurrentDay && !isSelected ? 'text-orange-400 font-bold' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {/* Event type badges - colored dots */}
                {hasEvents && inCurrentMonth && (
                  <div className="flex gap-[3px] mt-0.5">
                    {eventTypes.slice(0, 3).map((type) => {
                      const dot = EVENT_TYPE_DOT[type] || EVENT_TYPE_DOT.EVENT;
                      return (
                        <span
                          key={type}
                          className={`w-[5px] h-[5px] rounded-full ${dot.color} ${
                            isSelected ? 'bg-white shadow-sm shadow-white/50' : `shadow-sm ${dot.glow}`
                          }`}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Event count badge */}
                {dayEvents.length > 2 && inCurrentMonth && !isSelected && (
                  <span className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-orange-500/80 text-[7px] font-bold text-white flex items-center justify-center">
                    {dayEvents.length}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="relative mt-4 pt-3 border-t border-[#1a1a2a] flex items-center justify-center gap-4">
        {[
          { type: 'EVENT', label: 'Event', color: 'bg-emerald-400' },
          { type: 'PROMOTION', label: 'Promo', color: 'bg-orange-400' },
          { type: 'ADVERTISEMENT', label: 'Pub', color: 'bg-purple-400' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
