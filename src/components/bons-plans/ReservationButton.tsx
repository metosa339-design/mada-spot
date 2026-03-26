'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar, Loader2 } from 'lucide-react';

interface ReservationButtonProps {
  establishmentId: string;
  establishmentName: string;
  type: 'hotel' | 'restaurant';
}

export default function ReservationButton({
  establishmentId,
  type,
}: ReservationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReservation = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Vérifier la session
      const sessionRes = await fetch('/api/auth/session');

      if (!sessionRes.ok) {
        const redirect = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirect}`);
        return;
      }

      // Rediriger vers la page de réservation
      router.push(`/client/bookings?establish=${establishmentId}&type=${type}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleReservation}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            <Calendar className="w-5 h-5" />
            Réserver
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </>
        )}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
