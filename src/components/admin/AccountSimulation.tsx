'use client';

import { useState, useCallback } from 'react';
import {
  Search, Loader2, User, Eye, Mail, Phone, Calendar,
  Shield, Star, MessageSquare, CalendarDays, ExternalLink,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface UserResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
  userType: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

interface UserDetail extends UserResult {
  isBanned: boolean;
  lastLoginAt: string | null;
  loyaltyPoints: number;
  _count: {
    bookings: number;
    sentMessages: number;
    receivedMessages: number;
    establishmentReviews: number;
  };
}

const TYPE_COLORS: Record<string, string> = {
  HOTEL: '#3b82f6',
  RESTAURANT: '#f97316',
  ATTRACTION: '#10b981',
  PROVIDER: '#8b5cf6',
};

// ============================================================
// Main Component
// ============================================================
export default function AccountSimulation() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [impersonateLoading, setImpersonateLoading] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/impersonate?search=${encodeURIComponent(query)}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      }
    } catch { /* ignore */ }
    setSearching(false);
  }, []);

  const fetchDetail = async (userId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/impersonate?userId=${userId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data.user || null);
      }
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const handleImpersonate = async () => {
    if (!selectedUser) return;
    setImpersonateLoading(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: selectedUser.id }),
      });
      if (res.ok) {
        const data = await res.json();
        // Open the user's dashboard in a new tab
        window.open(data.dashboardUrl, '_blank');
      }
    } catch { /* ignore */ }
    setImpersonateLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); searchUsers(e.target.value); }}
          placeholder="Rechercher un utilisateur (nom, email, telephone)..."
          className="w-full pl-12 pr-4 py-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
        />
        {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-gray-500" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results list */}
        <div className="lg:col-span-2 space-y-2">
          {results.length === 0 && search.length >= 2 && !searching && (
            <div className="text-center py-12 text-gray-500">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun utilisateur trouve</p>
            </div>
          )}
          {results.map(user => (
            <button
              key={user.id}
              onClick={() => fetchDetail(user.id)}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all ${
                selectedUser?.id === user.id
                  ? 'bg-[#ff6b35]/5 border-[#ff6b35]/20'
                  : 'bg-[#0c0c16] border-[#1e1e2e] hover:border-[#2e2e3e]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff1493] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{user.firstName} {user.lastName}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[#1e1e2e] text-gray-400">
                    {user.role}
                  </span>
                  {user.userType && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `${TYPE_COLORS[user.userType] || '#6b7280'}20`, color: TYPE_COLORS[user.userType] || '#6b7280' }}>
                      {user.userType}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-500">
                  {user.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>}
                  {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                </div>
              </div>
              {!user.isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 flex-shrink-0">Inactif</span>
              )}
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5">
          {detailLoading ? (
            <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
          ) : !selectedUser ? (
            <div className="text-center py-12 text-gray-500">
              <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Selectionnez un utilisateur</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Avatar + name */}
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff1493] flex items-center justify-center text-white text-lg font-bold mx-auto">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <h4 className="text-base font-bold mt-2">{selectedUser.firstName} {selectedUser.lastName}</h4>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1e2e] text-gray-400">{selectedUser.role}</span>
                  {selectedUser.userType && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${TYPE_COLORS[selectedUser.userType] || '#6b7280'}20`, color: TYPE_COLORS[selectedUser.userType] || '#6b7280' }}>
                      {selectedUser.userType}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badges */}
              <div className="flex justify-center gap-2">
                {!selectedUser.isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Inactif</span>
                )}
                {selectedUser.isBanned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Banni</span>
                )}
                {selectedUser.isActive && !selectedUser.isBanned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Actif</span>
                )}
              </div>

              {/* Contact info */}
              <div className="space-y-2 p-3 bg-[#080810] rounded-lg">
                {selectedUser.email && (
                  <p className="text-xs text-gray-400 flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{selectedUser.email}</p>
                )}
                {selectedUser.phone && (
                  <p className="text-xs text-gray-400 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{selectedUser.phone}</p>
                )}
                <p className="text-xs text-gray-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Inscrit le {new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}
                </p>
                {selectedUser.lastLoginAt && (
                  <p className="text-xs text-gray-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    Dernier login: {new Date(selectedUser.lastLoginAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Reservations', value: selectedUser._count.bookings, icon: CalendarDays, color: '#f59e0b' },
                  { label: 'Avis', value: selectedUser._count.establishmentReviews, icon: Star, color: '#eab308' },
                  { label: 'Msg envoyes', value: selectedUser._count.sentMessages, icon: MessageSquare, color: '#3b82f6' },
                  { label: 'Points fidelite', value: selectedUser.loyaltyPoints, icon: Star, color: '#8b5cf6' },
                ].map(stat => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="p-2.5 bg-[#080810] rounded-lg text-center">
                      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                      <p className="text-sm font-bold">{stat.value}</p>
                      <p className="text-[9px] text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Impersonate button */}
              <button
                onClick={handleImpersonate}
                disabled={impersonateLoading}
                className="w-full py-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 text-[#ff6b35] text-sm font-medium rounded-xl hover:bg-[#ff6b35]/20 transition-colors flex items-center justify-center gap-2"
              >
                {impersonateLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                Voir en tant que...
              </button>
              <p className="text-[9px] text-gray-600 text-center">L&apos;action sera enregistree dans l&apos;audit log</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
