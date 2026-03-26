'use client';

import { memo, useMemo } from 'react';
import { Clock } from 'lucide-react';

interface OpenCloseBadgeProps {
  openingHours: Record<string, { open: string; close: string; closed?: boolean }>;
  variant?: 'badge' | 'card' | 'inline';
  showNextOpen?: boolean;
}

const dayLabels: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

function getMadagascarTime(): Date {
  // Get current time in Madagascar (UTC+3) regardless of user's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Indian/Antananarivo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '0';

  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

function getDayName(date: Date): string {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayNames[date.getDay()];
}

function getNextOpenTime(
  openingHours: Record<string, any>,
  currentDay: number
): string | null {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDay + i) % 7;
    const nextDay = dayNames[nextDayIndex];
    const hours = openingHours[nextDay];

    if (hours && !hours.closed) {
      if (i === 1) return `Demain à ${hours.open}`;
      return `${dayLabels[nextDay]} à ${hours.open}`;
    }
  }
  return null;
}

interface OpenStatus {
  isOpen: boolean;
  message: string;
  color: string;
  nextOpen?: string | null;
}

export default memo(function OpenCloseBadge({
  openingHours,
  variant = 'badge',
  showNextOpen = true,
}: OpenCloseBadgeProps) {
  const status = useMemo((): OpenStatus | null => {
    if (!openingHours || Object.keys(openingHours).length === 0) return null;

    const now = getMadagascarTime();
    const today = getDayName(now);
    const hours = openingHours[today];

    if (!hours || hours.closed) {
      const nextOpen = getNextOpenTime(openingHours, now.getDay());
      return {
        isOpen: false,
        message: "Fermé aujourd'hui",
        color: 'text-red-500',
        nextOpen,
      };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        message: `Ouvre à ${hours.open}`,
        color: 'text-amber-500',
      };
    } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minutesLeft = closeMinutes - currentMinutes;
      if (minutesLeft <= 60) {
        return {
          isOpen: true,
          message: `Ferme bientôt (${hours.close})`,
          color: 'text-amber-500',
        };
      }
      return {
        isOpen: true,
        message: `Ouvert jusqu'à ${hours.close}`,
        color: 'text-green-500',
      };
    } else {
      const nextOpen = getNextOpenTime(openingHours, now.getDay());
      return {
        isOpen: false,
        message: 'Fermé',
        color: 'text-red-500',
        nextOpen,
      };
    }
  }, [openingHours]);

  if (!status) return null;

  if (variant === 'inline') {
    return (
      <span className={`text-sm font-medium ${status.color}`}>
        {status.isOpen ? 'Ouvert' : 'Fermé'}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
        status.isOpen ? 'bg-green-500/10' : 'bg-red-500/10'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          status.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <span className={`text-sm font-medium ${status.color}`}>
          {status.message}
        </span>
      </div>
    );
  }

  // Default: badge
  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        status.isOpen
          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
          : 'bg-red-500/10 text-red-500 border border-red-500/20'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          status.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        {status.isOpen ? 'Ouvert' : 'Fermé'}
      </div>
      {showNextOpen && !status.isOpen && status.nextOpen && (
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {status.nextOpen}
        </span>
      )}
    </div>
  );
});
