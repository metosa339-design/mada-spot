'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Phone, Mail, AlertTriangle, AlertCircle, RefreshCw, Building2 } from 'lucide-react';

interface SlowProvider {
  establishmentId: string;
  establishmentName: string;
  city: string;
  type: string;
  phone: string | null;
  email: string | null;
  ownerName: string | null;
  totalRelanced: number;
  totalExpired: number;
  totalRelancesSent: number;
  pendingBookings: number;
  lastBookingDate: string | null;
  severity: 'critical' | 'warning' | 'info';
}

interface Stats {
  totalSlowProviders: number;
  totalExpired: number;
  totalPending: number;
  period: string;
}

export default function SlowProviders() {
  const [providers, setProviders] = useState<SlowProvider[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/slow-providers?days=${period}`);
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers);
        setStats(data.stats);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
            <AlertCircle className="w-3 h-3" /> Critique
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
            <AlertTriangle className="w-3 h-3" /> Lent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            <Clock className="w-3 h-3" /> Relancé
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Prestataires Lents
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Prestataires avec des réservations non répondues ou expirées
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="bg-[#1a1a24] text-gray-300 text-sm rounded-lg border border-gray-700 px-3 py-2 focus:border-orange-500 focus:outline-none"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-[#1a1a24] border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-orange-500 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#1a1a24] rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">Prestataires concernés</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalSlowProviders}</p>
          </div>
          <div className="bg-[#1a1a24] rounded-xl border border-red-900/30 p-4">
            <p className="text-gray-400 text-sm">Réservations expirées</p>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.totalExpired}</p>
          </div>
          <div className="bg-[#1a1a24] rounded-xl border border-orange-900/30 p-4">
            <p className="text-gray-400 text-sm">En attente actuellement</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{stats.totalPending}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun prestataire lent sur cette période</p>
        </div>
      ) : (
        <div className="bg-[#1a1a24] rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">Établissement</th>
                  <th className="text-left px-4 py-3 font-medium">Propriétaire</th>
                  <th className="text-center px-4 py-3 font-medium">Sévérité</th>
                  <th className="text-center px-4 py-3 font-medium">Expirées</th>
                  <th className="text-center px-4 py-3 font-medium">En attente</th>
                  <th className="text-center px-4 py-3 font-medium">Relances</th>
                  <th className="text-right px-4 py-3 font-medium">Contact</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr
                    key={provider.establishmentId}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{provider.establishmentName}</p>
                        <p className="text-gray-500 text-xs">
                          {provider.city} — {provider.type}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {provider.ownerName || (
                        <span className="text-gray-600 italic">Non revendiqué</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getSeverityBadge(provider.severity)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={provider.totalExpired > 0 ? 'text-red-400 font-bold' : 'text-gray-500'}>
                        {provider.totalExpired}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={provider.pendingBookings > 0 ? 'text-orange-400 font-bold' : 'text-gray-500'}>
                        {provider.pendingBookings}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {provider.totalRelancesSent}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {provider.phone && (
                          <a
                            href={`tel:${provider.phone}`}
                            className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                            title={`Appeler ${provider.phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {provider.email && (
                          <a
                            href={`mailto:${provider.email}?subject=Réservations en attente — ${provider.establishmentName}`}
                            className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                            title={`Email ${provider.email}`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {!provider.phone && !provider.email && (
                          <span className="text-gray-600 text-xs">N/A</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
