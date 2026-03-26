'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image-url';
import {
  Loader2, Building2, CheckCircle, XCircle, Ghost, ArrowRightLeft,
  ArrowUpCircle, FileText, Eye, EyeOff, Trash2, ShieldX,
  Star, MessageSquare, AlertTriangle, RefreshCw,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface VerificationDoc {
  id: string;
  userId: string;
  documentType: string;
  documentUrl: string;
  status: string;
  note: string | null;
}

interface PendingEstablishment {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  district: string | null;
  region: string | null;
  coverImage: string | null;
  phone: string | null;
  email: string | null;
  moderationStatus: string;
  moderationNote: string | null;
  dataSource: string | null;
  createdAt: string;
  isClaimed: boolean;
  submitter: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  verificationDocuments: VerificationDoc[];
}

interface GhostEstablishment {
  id: string;
  name: string;
  slug: string;
  type: string;
  city: string;
  district: string | null;
  region: string | null;
  coverImage: string | null;
  viewCount: number;
  rating: number;
  createdAt: string;
  submitter: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  reviewCount: number;
  viewsCount: number;
  messageCount: number;
}

interface FlaggedReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  authorName: string | null;
  authorEmail: string | null;
  isPublished: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  establishment: { name: string; type: string; city: string };
}

// ============================================================
// Sub-tabs
// ============================================================
const TABS = [
  { id: 'validation', label: 'Validation Fiches', icon: Building2 },
  { id: 'ghosts', label: 'Lieux Fantomes', icon: Ghost },
  { id: 'audit', label: 'Audit Avis & Photos', icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ModerationPipeline() {
  const [activeTab, setActiveTab] = useState<TabId>('validation');

  return (
    <div className="space-y-6">
      {/* Sub-tab nav */}
      <div className="flex gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/20'
                  : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'validation' && <ValidationFiches />}
      {activeTab === 'ghosts' && <GhostManagement />}
      {activeTab === 'audit' && <AuditReviewsPhotos />}
    </div>
  );
}

// ============================================================
// TAB 1: Validation Fiches
// ============================================================
function ValidationFiches() {
  const [establishments, setEstablishments] = useState<PendingEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/pipeline', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEstablishments(data.establishments || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await fetch('/api/admin/establishments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, moderationStatus: status, moderationNote: moderationNote[id] || '' }),
      });
      fetchData();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const docTypeLabels: Record<string, string> = {
    nif: 'NIF',
    stat: 'STAT',
    business_license: 'Licence commerciale',
    id_card: 'Piece d\'identite',
  };

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>;
  }

  if (establishments.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
        <p className="text-gray-500">Aucune fiche en attente de validation</p>
        <p className="text-xs text-gray-600 mt-1">Toutes les soumissions ont ete traitees</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">{establishments.length} fiche{establishments.length > 1 ? 's' : ''} en attente</p>
      {establishments.map((est) => (
        <div key={est.id} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            {est.coverImage ? (
              <div className="relative w-16 h-16 rounded-xl flex-shrink-0">
                <Image src={getImageUrl(est.coverImage)} alt={est.name} fill sizes="64px" className="rounded-xl object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#080810] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-gray-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{est.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-500/10 text-yellow-400">
                  En attente
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{est.city}{est.district ? `, ${est.district}` : ''}{est.region ? ` — ${est.region}` : ''}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                {est.phone && <span>{est.phone}</span>}
                {est.email && <span>{est.email}</span>}
                {est.dataSource && <span>Source: {est.dataSource}</span>}
              </div>
            </div>
            <p className="text-[10px] text-gray-600 flex-shrink-0">
              {new Date(est.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Submitter */}
          {est.submitter && (
            <div className="p-3 bg-[#080810] rounded-lg">
              <p className="text-xs text-gray-400">
                Soumis par: <strong className="text-gray-300">{est.submitter.firstName} {est.submitter.lastName}</strong>
                <span className="ml-2 text-gray-600">{est.submitter.email}</span>
              </p>
            </div>
          )}

          {/* Verification Documents */}
          {est.verificationDocuments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Documents de verification ({est.verificationDocuments.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {est.verificationDocuments.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      doc.status === 'VERIFIED'
                        ? 'bg-green-500/5 border-green-500/20'
                        : doc.status === 'REJECTED'
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-[#080810] border-[#1e1e2e] hover:border-[#ff6b35]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{docTypeLabels[doc.documentType] || doc.documentType}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        doc.status === 'VERIFIED' ? 'bg-green-500/10 text-green-400' :
                        doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {doc.status === 'VERIFIED' ? 'Verifie' : doc.status === 'REJECTED' ? 'Refuse' : 'En attente'}
                      </span>
                    </div>
                    {expandedDoc === doc.id && (
                      <div className="mt-2 pt-2 border-t border-[#1e1e2e]">
                        <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#ff6b35] hover:underline">
                          Voir le document
                        </a>
                        {doc.note && <p className="text-[10px] text-gray-500 mt-1">{doc.note}</p>}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note + Actions */}
          <div className="space-y-3">
            <textarea
              value={moderationNote[est.id] || ''}
              onChange={(e) => setModerationNote(prev => ({ ...prev, [est.id]: e.target.value }))}
              placeholder="Note de moderation (optionnel)..."
              className="w-full p-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50 resize-none h-16"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(est.id, 'approved')}
                disabled={actionLoading === est.id}
                className="flex-1 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === est.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approuver
              </button>
              <button
                onClick={() => handleAction(est.id, 'rejected')}
                disabled={actionLoading === est.id}
                className="flex-1 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rejeter
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 2: Ghost Management
// ============================================================
function GhostManagement() {
  const [ghosts, setGhosts] = useState<GhostEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [mergeSearch, setMergeSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchGhosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/moderation/ghost', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGhosts(data.ghosts || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGhosts(); }, [fetchGhosts]);

  const handlePromote = async (ghostId: string) => {
    setActionLoading(ghostId);
    try {
      await fetch('/api/admin/moderation/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'promote', ghostId }),
      });
      fetchGhosts();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleMerge = async (ghostId: string, targetId: string) => {
    setActionLoading(ghostId);
    try {
      await fetch('/api/admin/moderation/ghost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'merge', ghostId, targetId }),
      });
      setMergeTarget(null);
      setMergeSearch('');
      setSearchResults([]);
      fetchGhosts();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const searchEstablishments = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/establishments?search=${encodeURIComponent(query)}&limit=5&status=approved`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.establishments || []);
      }
    } catch { /* ignore */ }
    setSearching(false);
  };

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>;
  }

  if (ghosts.length === 0) {
    return (
      <div className="text-center py-16">
        <Ghost className="w-12 h-12 mx-auto mb-3 text-gray-500/30" />
        <p className="text-gray-500">Aucun lieu fantome</p>
        <p className="text-xs text-gray-600 mt-1">Tous les lieux communautaires ont ete traites</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">{ghosts.length} lieu{ghosts.length > 1 ? 'x' : ''} fantome{ghosts.length > 1 ? 's' : ''}</p>
      {ghosts.map((ghost) => (
        <div key={ghost.id} className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            {ghost.coverImage ? (
              <div className="relative w-14 h-14 rounded-xl flex-shrink-0">
                <Image src={getImageUrl(ghost.coverImage)} alt={ghost.name} fill sizes="56px" className="rounded-xl object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#080810] flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                <Ghost className="w-5 h-5 text-purple-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{ghost.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-500/10 text-purple-400">Fantome</span>
              </div>
              <p className="text-xs text-gray-500">{ghost.city}{ghost.district ? `, ${ghost.district}` : ''}</p>
            </div>
            <div className="flex gap-3 text-[10px] text-gray-500 flex-shrink-0">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{ghost.viewsCount}</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" />{ghost.reviewCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{ghost.messageCount}</span>
            </div>
          </div>

          {/* Submitter */}
          {ghost.submitter && (
            <p className="text-xs text-gray-500">
              Cree par: <strong className="text-gray-400">{ghost.submitter.firstName} {ghost.submitter.lastName}</strong>
              <span className="ml-2 text-gray-600">{ghost.submitter.email}</span>
            </p>
          )}

          {/* Merge UI */}
          {mergeTarget === ghost.id && (
            <div className="p-4 bg-[#080810] border border-[#1e1e2e] rounded-xl space-y-3">
              <p className="text-xs font-medium text-gray-400">Fusionner vers un etablissement existant :</p>
              <div className="relative">
                <input
                  type="text"
                  value={mergeSearch}
                  onChange={(e) => { setMergeSearch(e.target.value); searchEstablishments(e.target.value); }}
                  placeholder="Rechercher l'etablissement cible..."
                  className="w-full p-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35]/50"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />}
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-1.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {searchResults.filter((r: any) => r.id !== ghost.id).map((result: any) => (
                    <button
                      key={result.id}
                      onClick={() => handleMerge(ghost.id, result.id)}
                      disabled={actionLoading === ghost.id}
                      className="w-full flex items-center gap-3 p-3 bg-[#0c0c16] border border-[#1e1e2e] rounded-lg hover:border-green-500/30 transition-colors text-left"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        <p className="text-[10px] text-gray-500">{result.city} — {result.type}</p>
                      </div>
                      {actionLoading === ghost.id && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => { setMergeTarget(null); setMergeSearch(''); setSearchResults([]); }}
                className="text-xs text-gray-500 hover:text-white"
              >
                Annuler
              </button>
            </div>
          )}

          {/* Actions */}
          {mergeTarget !== ghost.id && (
            <div className="flex gap-2">
              <button
                onClick={() => handlePromote(ghost.id)}
                disabled={actionLoading === ghost.id}
                className="flex-1 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium rounded-xl hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading === ghost.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                Promouvoir
              </button>
              <button
                onClick={() => setMergeTarget(ghost.id)}
                className="flex-1 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Fusionner
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TAB 3: Audit Reviews & Photos
// ============================================================
function AuditReviewsPhotos() {
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'flagged' | 'hidden'>('flagged');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?type=establishment&status=${filter}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.establishmentReviews || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (reviewId: string, action: string) => {
    setActionLoading(reviewId);
    try {
      await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reviewId, reviewType: 'establishment', action }),
      });
      fetchReviews();
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {([
            { key: 'flagged' as const, label: 'Signales', icon: AlertTriangle, color: '#ef4444' },
            { key: 'hidden' as const, label: 'Masques', icon: EyeOff, color: '#f59e0b' },
          ]).map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? 'text-white border'
                  : 'bg-[#080810] border border-[#1e1e2e] text-gray-400 hover:text-white'
              }`}
              style={filter === key ? { backgroundColor: `${color}15`, borderColor: `${color}30`, color } : {}}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button onClick={fetchReviews} className="p-2 rounded-xl bg-[#0c0c16] border border-[#1e1e2e] hover:border-[#ff6b35]/30">
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
          <p className="text-gray-500">Aucun avis {filter === 'flagged' ? 'signale' : 'masque'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`bg-[#0c0c16] border rounded-xl p-5 ${r.isFlagged ? 'border-red-500/20' : 'border-[#1e1e2e]'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {renderStars(r.rating)}
                    {r.title && <span className="text-sm font-medium">{r.title}</span>}
                    {r.isFlagged && (
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Signale
                      </span>
                    )}
                    {!r.isPublished && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-semibold rounded-full">Masque</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{r.comment}</p>
                  {r.flagReason && (
                    <div className="mb-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                      <p className="text-[10px] text-red-400">Raison : {r.flagReason}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <span>Pour : <strong className="text-gray-300">{r.establishment.name}</strong></span>
                    <span>{r.establishment.city}</span>
                    <span>Par : {r.authorName || 'Anonyme'}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 ml-4 flex-shrink-0">
                  {r.isFlagged && (
                    <button onClick={() => handleAction(r.id, 'dismiss_flag')} disabled={actionLoading === r.id}
                      className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20" title="Deflaguer">
                      {actionLoading === r.id ? <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> : <ShieldX className="w-4 h-4 text-orange-400" />}
                    </button>
                  )}
                  {r.isPublished ? (
                    <button onClick={() => handleAction(r.id, 'unpublish')} disabled={actionLoading === r.id}
                      className="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20" title="Masquer">
                      <EyeOff className="w-4 h-4 text-yellow-400" />
                    </button>
                  ) : (
                    <button onClick={() => handleAction(r.id, 'publish')} disabled={actionLoading === r.id}
                      className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20" title="Publier">
                      <Eye className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                  <button onClick={() => handleAction(r.id, 'delete')} disabled={actionLoading === r.id}
                    className="p-2 rounded-lg bg-[#080810] hover:bg-red-500/10 border border-[#1e1e2e]" title="Supprimer">
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
