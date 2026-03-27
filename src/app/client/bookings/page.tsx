'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Loader2, ArrowLeft, MapPin, Users, Hotel, UtensilsCrossed, Compass, AlertTriangle, Printer, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useCsrf } from '@/hooks/useCsrf';

interface Booking {
  id: string;
  reference: string;
  bookingType: string;
  checkIn: string;
  checkOut: string | null;
  guestCount: number;
  guestName: string;
  totalPrice: number | null;
  currency: string;
  status: string;
  specialRequests: string | null;
  cancelReason: string | null;
  createdAt: string;
  establishment: { name: string; city: string; type: string; coverImage: string | null };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  confirmed: { label: 'Confirmée', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  cancelled: { label: 'Annulée', color: 'text-red-400', bgColor: 'bg-red-500/10' },
  completed: { label: 'Terminée', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  no_show: { label: 'No Show', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
};

const TYPE_ICONS: Record<string, any> = {
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  attraction: Compass,
};

export default function ClientBookingsPage() {
  const router = useRouter();
  const { csrfToken } = useCsrf();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      params.set('limit', '50');
      const res = await fetch(`/api/bookings?${params}`, { credentials: 'include' });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Voulez-vous vraiment annuler cette réservation ?')) return;
    setCancelling(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'cancel', reason: 'Annulée par le client', csrfToken }),
      });
      if (res.ok) fetchBookings();
    } catch {
      // ignore
    } finally {
      setCancelling(null);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatPrice = (p: number | null, c: string) => p ? `${p.toLocaleString('fr-FR')} ${c}` : '';

  const handlePrint = (booking: Booking) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Réservation ${booking.reference}</title>
      <style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;padding:20px}
      h1{color:#f97316;font-size:24px}h2{font-size:18px;margin-top:20px}
      .info{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .label{color:#666;font-size:14px}.value{font-weight:600;font-size:14px}
      .header{text-align:center;border-bottom:2px solid #f97316;padding-bottom:16px;margin-bottom:20px}
      .ref{font-family:monospace;font-size:20px;color:#f97316}
      @media print{body{margin:0}}</style></head><body>
      <div class="header"><h2>Mada Spot</h2><p class="ref">${booking.reference}</p></div>
      <h2>${booking.establishment.name}</h2>
      <p style="color:#666">${booking.establishment.city}</p>
      <div class="info"><span class="label">Date</span><span class="value">${formatDate(booking.checkIn)}${booking.checkOut ? ' → ' + formatDate(booking.checkOut) : ''}</span></div>
      <div class="info"><span class="label">Nom</span><span class="value">${booking.guestName}</span></div>
      <div class="info"><span class="label">Personnes</span><span class="value">${booking.guestCount}</span></div>
      ${booking.totalPrice ? `<div class="info"><span class="label">Prix total</span><span class="value">${booking.totalPrice.toLocaleString('fr-FR')} ${booking.currency}</span></div>` : ''}
      ${booking.specialRequests ? `<div class="info"><span class="label">Demandes</span><span class="value">${booking.specialRequests}</span></div>` : ''}
      <p style="text-align:center;margin-top:30px;color:#999;font-size:12px">Généré depuis madaspot.com</p>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-[#2a2a36] pt-20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/client" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-300 text-sm mb-3">
            <ArrowLeft className="w-4 h-4" /> Mon espace
          </Link>
          <h1 className="text-2xl font-bold text-white">Mes Réservations</h1>
          <p className="text-sm text-gray-500 mt-1">Historique et suivi de vos réservations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'Toutes' },
            { value: 'pending', label: 'En attente' },
            { value: 'confirmed', label: 'Confirmées' },
            { value: 'completed', label: 'Terminées' },
            { value: 'cancelled', label: 'Annulées' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.value
                  ? 'bg-[#ff6b35] text-white'
                  : 'bg-[#1a1a24] border border-[#2a2a36] text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">Aucune réservation</p>
            <p className="text-sm text-gray-500 mt-1">Vos réservations apparaîtront ici</p>
            <Link
              href="/bons-plans/hotels"
              className="inline-block mt-4 px-6 py-2 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#e55a2b]"
            >
              Découvrir les hébergements
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
              const TypeIcon = TYPE_ICONS[booking.bookingType] || Calendar;

              return (
                <div key={booking.id} className="bg-[#1a1a24] rounded-xl border border-[#2a2a36] p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Status + Reference */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.bgColor} ${statusConf.color}`}>
                          {statusConf.label}
                        </span>
                        <span className="text-xs font-mono text-gray-500">{booking.reference}</span>
                      </div>

                      {/* Establishment */}
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon className="w-4 h-4 text-[#ff6b35]" />
                        <span className="font-semibold text-white">{booking.establishment.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                        <MapPin className="w-3.5 h-3.5" /> {booking.establishment.city}
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {formatDate(booking.checkIn)}
                          {booking.checkOut && ` → ${formatDate(booking.checkOut)}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          {booking.guestCount} pers.
                        </div>
                        {booking.totalPrice && (
                          <div className="font-semibold text-[#ff6b35]">
                            {formatPrice(booking.totalPrice, booking.currency)}
                          </div>
                        )}
                      </div>

                      {booking.specialRequests && (
                        <div className="mt-2 text-xs text-gray-500 italic">"{booking.specialRequests}"</div>
                      )}

                      {booking.cancelReason && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle className="w-3 h-3" /> {booking.cancelReason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {(booking.status === 'confirmed' || booking.status === 'completed') && (
                        <button
                          onClick={() => handlePrint(booking)}
                          className="px-3 py-1.5 border border-[#2a2a36] text-gray-300 rounded-lg text-sm hover:bg-[#2a2a36] flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                      )}
                      {booking.status === 'completed' && (
                        <Link
                          href={`/client/bookings/${booking.id}/review`}
                          className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/20 flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Laisser un avis
                        </Link>
                      )}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelling === booking.id}
                          className="px-3 py-1.5 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {cancelling === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Annuler'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
