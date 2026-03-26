'use client';

import { useState, useEffect } from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import EventCard from '@/components/events/EventCard';

interface EstablishmentEventsProps {
  establishmentId: string;
  city: string;
}

export default function EstablishmentEvents({ establishmentId, city }: EstablishmentEventsProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCity, setIsFromCity] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // First try establishment-specific events
        const res = await fetch(`/api/events?establishmentId=${establishmentId}&limit=3`);
        const data = await res.json();
        if (data.events?.length > 0) {
          setEvents(data.events);
          return;
        }
        // Fallback to city events
        const cityRes = await fetch(`/api/events?city=${encodeURIComponent(city)}&limit=3`);
        const cityData = await cityRes.json();
        if (cityData.events?.length > 0) {
          setEvents(cityData.events);
          setIsFromCity(true);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [establishmentId, city]);

  if (loading || events.length === 0) return null;

  return (
    <section className="bg-[#1a1a24] rounded-2xl p-6 md:p-8 border border-[#2a2a36]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-pink-400" />
          <h2 className="text-xl font-bold text-white">
            {isFromCity ? `Evenements a ${city}` : 'Evenements'}
          </h2>
        </div>
        <Link
          href={`/evenements${isFromCity ? `?city=${encodeURIComponent(city)}` : ''}`}
          className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 transition-colors"
        >
          Voir tout <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
