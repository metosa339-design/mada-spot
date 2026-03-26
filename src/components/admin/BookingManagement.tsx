'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Check,
  X,
  Loader2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  UserX,
  Hotel,
  UtensilsCrossed,
  Compass,
  Search,
} from 'lucide-react';

interface Booking {
  id: string;
  reference: string;
  bookingType: string;
  checkIn: string;
  checkOut: string | null;
  guestCount: number;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  status: string;
  specialRequests: string | null;
  createdAt: string;
  establishment: { name: string; city: string; type: string };
  user: { id: string; email: string | null; phone: string | null; name: string | null };
}

interface Stats {
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  total: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle },
  completed: { label: 'Terminé', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-700', icon: UserX },
};

const TYPE_ICONS: Record<string, any> = {
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  attraction: Compass,
};

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/admin/bookings?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (bookingId: string, action: string, reason?: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId, action, reason }),
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.reference.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.establishment.name.toLowerCase().includes(q) ||
      (b.guestEmail && b.guestEmail.toLowerCase().includes(q))
    );
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-gray-50' },
            { label: 'En attente', value: stats.pending, color: 'bg-yellow-50' },
            { label: 'Confirmées', value: stats.confirmed, color: 'bg-green-50' },
            { label: 'Annulées', value: stats.cancelled, color: 'bg-red-50' },
            { label: 'Terminées', value: stats.completed, color: 'bg-blue-50' },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-xl p-4 text-center`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par référence, nom, établissement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="cancelled">Annulé</option>
          <option value="completed">Terminé</option>
          <option value="no_show">No Show</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Tous types</option>
          <option value="hotel">Hôtel</option>
          <option value="restaurant">Restaurant</option>
          <option value="attraction">Attraction</option>
        </select>
        <button onClick={fetchBookings} className="p-2 hover:bg-gray-100 rounded-lg" title="Rafraîchir" aria-label="Rafraîchir les réservations">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune réservation trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const statusConf = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const TypeIcon = TYPE_ICONS[booking.bookingType] || Calendar;
            const isLoading = actionLoading === booking.id;

            return (
              <div key={booking.id} className="bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-sm font-medium text-blue-600">{booking.reference}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConf.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConf.label}
                      </span>
                    </div>
                    <div className="font-medium">{booking.establishment.name}</div>
                    <div className="text-sm text-gray-500">{booking.establishment.city}</div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>Client : <strong>{booking.guestName}</strong></span>
                      <span>{formatDate(booking.checkIn)}{booking.checkOut ? ` → ${formatDate(booking.checkOut)}` : ''}</span>
                      <span>{booking.guestCount} pers.</span>
                    </div>
                    {booking.specialRequests && (
                      <div className="mt-2 text-xs text-gray-500 italic">"{booking.specialRequests}"</div>
                    )}
                    {booking.guestEmail && <div className="text-xs text-gray-400 mt-1">{booking.guestEmail} {booking.guestPhone ? `· ${booking.guestPhone}` : ''}</div>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(booking.id, 'confirm')}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                        >
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Confirmer
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, 'cancel', 'Refusée par admin')}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          Refuser
                        </button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleAction(booking.id, 'complete')}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Terminer
                        </button>
                        <button
                          onClick={() => handleAction(booking.id, 'no_show')}
                          disabled={isLoading}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50"
                        >
                          <UserX className="w-3 h-3" />
                          No Show
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
