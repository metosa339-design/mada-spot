'use client';

import { useMemo } from 'react';

interface OpenStatusResult {
  isOpen: boolean;
  statusText: string;
  statusColor: string;
  nextChange: string | null;
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

export function useOpenStatus(
  openingHours: Record<string, { open: string; close: string; closed?: boolean }> | null | undefined
): OpenStatusResult | null {
  return useMemo(() => {
    if (!openingHours || Object.keys(openingHours).length === 0) return null;

    const now = getMadagascarTime();
    const today = getDayName(now);
    const hours = openingHours[today];

    if (!hours || hours.closed) {
      const nextOpen = getNextOpenTime(openingHours, now.getDay());
      return {
        isOpen: false,
        statusText: "Fermé aujourd'hui",
        statusColor: 'text-red-500',
        nextChange: nextOpen,
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
        statusText: `Ouvre à ${hours.open}`,
        statusColor: 'text-amber-500',
        nextChange: null,
      };
    } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minutesLeft = closeMinutes - currentMinutes;
      if (minutesLeft <= 60) {
        return {
          isOpen: true,
          statusText: `Ferme bientôt (${hours.close})`,
          statusColor: 'text-amber-500',
          nextChange: null,
        };
      }
      return {
        isOpen: true,
        statusText: `Ouvert jusqu'à ${hours.close}`,
        statusColor: 'text-green-500',
        nextChange: null,
      };
    } else {
      const nextOpen = getNextOpenTime(openingHours, now.getDay());
      return {
        isOpen: false,
        statusText: 'Fermé',
        statusColor: 'text-red-500',
        nextChange: nextOpen,
      };
    }
  }, [openingHours]);
}
