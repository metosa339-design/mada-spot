'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import dynamic from 'next/dynamic';
import {
  Search, Loader2, Building2, Plus, Edit3, CheckCircle, XCircle, Trash2,
  Hotel, UtensilsCrossed, Compass, Star,
} from 'lucide-react';

const EstablishmentEditor = dynamic(() => import('@/components/admin/EstablishmentEditor'), {
  loading: () => <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>,
});

export default function EstablishmentModerationList() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (filter) params.set('status', filter);
      if (typeFilter) params.set('type', typeFilter);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/establishments?${params}`);
      const data = await res.json();
      setEstablishments(data.establishments || []);
      setTotal(data.total || 0);
      setPendingCount(data.pendingCount || 0);
    } catch {}
    setLoading(false);
  }, [filter, typeFilter, searchQuery]);

  useEffect(() => { fetchEstablishments(); }, [fetchEstablishments]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await fetch('/api/admin/establishments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, moderationStatus: status }),
      });
      fetchEstablishments();
    } catch {}
    setActionLoading(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/establishments/${id}`, { method: 'DELETE' });
      fetchEstablishments();
    } catch {}
    setActionLoading(null);
    setDeleteConfirm(null);
  };

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    setActionLoading(id);
    try {
      await fetch('/api/admin/establishments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFeatured: !currentlyFeatured }),
      });
      fetchEstablishments();
    } catch {}
    setActionLoading(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeIcons: Record<string, any> = { HOTEL: Hotel, RESTAURANT: UtensilsCrossed, ATTRACTION: Compass };
  const typeColors: Record<string, string> = { HOTEL: '#3b82f6', RESTAURANT: '#f97316', ATTRACTION: '#10b981' };

  if (showEditor) {
    return (
      <EstablishmentEditor
        establishmentId={editingId}
        onClose={() => { setShowEditor(false); setEditingId(null); fetchEstablishments(); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-2">
        <span className="text-xs text-gray-500">Total : <strong className="text-white">{total}</strong></span>
        {pendingCount > 0 && (
          <span className="text-xs px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400">
            {pendingCount} en attente
          </span>
        )}
        <div className="flex-1" />
        <button onClick={() => { setEditingId(null); setShowEditor(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] text-white rounded-xl text-sm font-medium hover:bg-[#e55a2b] transition-colors">
          <Plus className="w-4 h-4" /> Nouvel Etablissement
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher par nom, ville..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#ff6b35] focus:outline-none" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white focus:border-[#ff6b35] focus:outline-none">
          <option value="">Tous types</option>
          <option value="HOTEL">Hotels</option>
          <option value="RESTAURANT">Restaurants</option>
          <option value="ATTRACTION">Attractions</option>
        </select>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Tous' },
          { value: 'pending_review', label: 'En attente' },
          { value: 'approved', label: 'Approuves' },
          { value: 'rejected', label: 'Refuses' },
        ].map((s) => (
          <button key={s.value} onClick={() => setFilter(s.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === s.value
                ? 'bg-[#ff6b35] text-white'
                : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
      ) : establishments.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-500/30 mx-auto mb-3" />
          <p className="text-gray-500">Aucun etablissement trouve</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {establishments.map((est: any) => {
            const TypeIcon = typeIcons[est.type] || Building2;
            const color = typeColors[est.type] || '#6b7280';
            return (
              <div key={est.id} className="flex items-center gap-4 p-4 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl hover:border-[#2e2e3e] transition-colors">
                {est.coverImage ? (
                  <div className="relative w-16 h-16 rounded-xl flex-shrink-0">
                    <Image src={getImageUrl(est.coverImage)} alt={est.name || 'Etablissement'} fill sizes="64px" className="rounded-xl object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[#080810] flex items-center justify-center flex-shrink-0">
                    <TypeIcon className="w-6 h-6" style={{ color }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{est.name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>{est.type}</span>
                    {est.isFeatured && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">Featured</span>}
                    {est.moderationStatus === 'pending_review' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 font-medium">En attente</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{est.city}{est.district ? `, ${est.district}` : ''}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {est.rating > 0 && <span className="text-[10px] text-yellow-400">★ {est.rating.toFixed(1)}</span>}
                    {est.dataSource && <span className="text-[10px] text-gray-600">Source : {est.dataSource}</span>}
                    {est.submitter && <span className="text-[10px] text-blue-400">Par : {est.submitter.firstName} {est.submitter.lastName}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {/* Featured toggle */}
                  <button onClick={() => handleToggleFeatured(est.id, est.isFeatured)}
                    disabled={actionLoading === est.id}
                    className={`p-2.5 border rounded-xl transition-colors ${
                      est.isFeatured
                        ? 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'
                        : 'bg-[#080810] border-[#1e1e2e] hover:bg-yellow-500/10 hover:border-yellow-500/20'
                    }`}
                    title={est.isFeatured ? 'Retirer de la Une' : 'Mettre en Une'}>
                    <Star className={`w-4 h-4 ${est.isFeatured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} />
                  </button>
                  {/* Edit button */}
                  <button onClick={() => { setEditingId(est.id); setShowEditor(true); }}
                    className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors" title="Modifier">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                  </button>
                  {/* Approve/Reject for pending */}
                  {est.moderationStatus === 'pending_review' && (
                    <>
                      <button onClick={() => handleAction(est.id, 'approved')} disabled={actionLoading === est.id}
                        className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors" title="Approuver">
                        {actionLoading === est.id ? <Loader2 className="w-4 h-4 animate-spin text-green-400" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                      </button>
                      <button onClick={() => handleAction(est.id, 'rejected')} disabled={actionLoading === est.id}
                        className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors" title="Rejeter">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </button>
                    </>
                  )}
                  {/* Delete button */}
                  {deleteConfirm === est.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(est.id)} className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">Oui</button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl text-gray-400 text-xs">Non</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(est.id)}
                      className="p-2.5 bg-[#080810] border border-[#1e1e2e] rounded-xl hover:bg-red-500/10 hover:border-red-500/20 transition-colors" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
