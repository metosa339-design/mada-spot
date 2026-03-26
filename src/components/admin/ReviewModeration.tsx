'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  MessageSquare,
  Building2,
  RefreshCw,
  AlertTriangle,
  ShieldX,
} from 'lucide-react';

interface EstablishmentReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  authorName: string | null;
  authorEmail: string | null;
  isPublished: boolean;
  isVerified: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  ownerResponse: string | null;
  createdAt: string;
  establishment: {
    name: string;
    type: string;
    city: string;
  };
}

interface Stats {
  estTotal: number;
  estHidden: number;
}

export default function ReviewModeration() {
  const [status, setStatus] = useState('all');
  const [estReviews, setEstReviews] = useState<EstablishmentReview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'establishment', status });
      const res = await fetch(`/api/admin/reviews?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEstReviews(data.establishmentReviews || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (reviewId: string, action: string) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, reviewType: 'establishment', action }),
      });
      if (res.ok) {
        await fetchReviews();
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setActionLoading(null);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Avis établissements', value: stats.estTotal, color: '#10b981', icon: Building2 },
            { label: 'Masqués', value: stats.estHidden, color: '#f59e0b', icon: EyeOff },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-green-400">Avis des établissements</span>
        </div>

        <div className="flex-1" />

        {/* Status filters */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'published', label: 'Publiés' },
            { value: 'hidden', label: 'Masqués' },
            { value: 'flagged', label: 'Signalés' },
          ].map(s => (
            <button key={s.value} onClick={() => setStatus(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${status === s.value ? 'bg-[#ff6b35] text-white' : 'bg-[#080810] border border-[#1e1e2e] text-gray-400'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <button onClick={fetchReviews} className="p-2 rounded-xl bg-[#0c0c16] border border-[#1e1e2e] hover:border-[#ff6b35]/30">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
      ) : (
        <div className="space-y-3">
          {estReviews.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucun avis trouvé</p>
            </div>
          ) : estReviews.map(r => (
            <div key={r.id} className={`bg-[#0c0c16] border rounded-xl p-5 ${!r.isPublished ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-[#1e1e2e]'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(r.rating)}
                    {r.title && <span className="text-sm font-medium text-white">{r.title}</span>}
                    {r.isVerified && (
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-semibold rounded-full">Vérifié</span>
                    )}
                    {!r.isPublished && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Masqué
                      </span>
                    )}
                    {r.isFlagged && (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Signalé
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{r.comment}</p>
                  {r.isFlagged && r.flagReason && (
                    <div className="mb-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                      <p className="text-[10px] text-red-400 font-medium">Raison : {r.flagReason}</p>
                    </div>
                  )}
                  {r.ownerResponse && (
                    <div className="ml-4 mt-2 pl-3 border-l-2 border-green-500/30">
                      <p className="text-xs text-green-400 mb-0.5">Réponse du propriétaire :</p>
                      <p className="text-xs text-gray-400">{r.ownerResponse}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
                    <span>Pour : <strong className="text-gray-300">{r.establishment.name}</strong></span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#080810]">{r.establishment.type}</span>
                    <span>{r.establishment.city}</span>
                    <span>Par : {r.authorName || 'Anonyme'}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 ml-4 flex-shrink-0">
                  {r.isFlagged && (
                    <button onClick={() => handleAction(r.id, 'dismiss_flag')} disabled={actionLoading === r.id}
                      className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20" title="Rejeter le signalement">
                      {actionLoading === r.id ? <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> : <ShieldX className="w-4 h-4 text-orange-400" />}
                    </button>
                  )}
                  {r.isPublished ? (
                    <button onClick={() => handleAction(r.id, 'unpublish')} disabled={actionLoading === r.id}
                      className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20" title="Masquer">
                      {actionLoading === r.id ? <Loader2 className="w-4 h-4 animate-spin text-yellow-400" /> : <EyeOff className="w-4 h-4 text-yellow-400" />}
                    </button>
                  ) : (
                    <button onClick={() => handleAction(r.id, 'publish')} disabled={actionLoading === r.id}
                      className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20" title="Publier">
                      {actionLoading === r.id ? <Loader2 className="w-4 h-4 animate-spin text-green-400" /> : <Eye className="w-4 h-4 text-green-400" />}
                    </button>
                  )}
                  {deleteConfirm === r.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleAction(r.id, 'delete')} className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-medium">Oui</button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-2 rounded-lg bg-[#080810] border border-[#1e1e2e] text-gray-400 text-[10px]">Non</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(r.id)} className="p-2 rounded-lg bg-[#080810] hover:bg-red-500/10 border border-[#1e1e2e]" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
