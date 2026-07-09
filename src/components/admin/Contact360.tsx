'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, User, Mail, Phone, Building2, Star, CalendarDays, MessageSquare, StickyNote, Bell, Megaphone,
  ChevronLeft, RefreshCw, MapPin, ShieldCheck, Rocket, PencilLine, ExternalLink, AlertTriangle, CheckCircle2, ImageIcon,
} from 'lucide-react';
import AdminFicheEditor from './AdminFicheEditor';

const ICONS: Record<string, any> = {
  account: User, prospect: Search, conversation: MessageSquare, booking: CalendarDays,
  review: Star, note: StickyNote, followup: Bell, campaign: Megaphone,
};

const MOD_BADGE: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending_review: 'bg-orange-100 text-orange-700',
  rejected: 'bg-red-100 text-red-600',
};

export default function Contact360() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingFiche, setEditingFiche] = useState<string | null>(null);
  // Filtres de la liste remontés ici pour survivre à l'ouverture d'un contact
  const [listFilters, setListFilters] = useState({ kind: 'all', service: 'all', sortBy: 'id', search: '' });

  const doSearch = useCallback(async (target: string) => {
    const q = target.trim();
    if (!q) return;
    setLoading(true);
    setErr(null);
    setData(null);
    try {
      const res = await fetch(`/api/admin/crm/contact?email=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setErr(json.error);
    } catch {
      setErr('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let preset: string | null = null;
    try {
      preset = sessionStorage.getItem('crm360email');
      if (preset) sessionStorage.removeItem('crm360email');
    } catch { /* ignore */ }
    if (preset) doSearch(preset);
  }, [doSearch]);

  if (editingFiche) {
    return <AdminFicheEditor id={editingFiche} onBack={() => setEditingFiche(null)} onSaved={() => { if (data?.email) doSearch(data.email); setEditingFiche(null); }} />;
  }

  if (data || loading || err) {
    return (
      <div className="max-w-4xl">
        <button onClick={() => { setData(null); setErr(null); }} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4"><ChevronLeft className="w-4 h-4" /> Liste des contacts</button>
        {loading && <p className="text-gray-400 text-center py-8">Chargement…</p>}
        {err && <p className="text-red-500 text-center py-8">{err}</p>}
        {data && <Detail data={data} onEditFiche={setEditingFiche} />}
      </div>
    );
  }

  return <ContactList onOpen={(email) => doSearch(email)} filters={listFilters} setFilters={setListFilters} />;
}

function ContactList({ onOpen, filters, setFilters }: { onOpen: (email: string) => void; filters: { kind: string; service: string; sortBy: string; search: string }; setFilters: (fn: (f: any) => any) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; withId: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { kind, service, sortBy, search } = filters;
  const setKind = (v: string) => setFilters((f) => ({ ...f, kind: v }));
  const setService = (v: string) => setFilters((f) => ({ ...f, service: v }));
  const setSortBy = (v: string) => setFilters((f) => ({ ...f, sortBy: v }));
  const setSearch = (v: string) => setFilters((f) => ({ ...f, search: v }));
  const [backfilling, setBackfilling] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      const json = await res.json();
      if (json.success) { setItems(json.data.items); setMeta({ total: json.data.total, withId: json.data.withId }); }
    } finally { setLoading(false); }
  }, [kind, search]);

  useEffect(() => { load(); }, [load]);

  const backfill = async () => {
    setBackfilling(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/crm/refcode-backfill', { method: 'POST' });
      const json = await res.json();
      setMsg(json.success ? `${json.data.assigned} ID attribués.` : json.error);
      load();
    } finally { setBackfilling(false); }
  };

  const services = Array.from(new Set(items.map((i) => i.service).filter(Boolean))).sort();
  const cities = Array.from(new Set(items.map((i) => i.city).filter(Boolean)));

  let view = items;
  if (service !== 'all') view = view.filter((i) => i.service === service);
  view = [...view].sort((a, b) => {
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
    if (sortBy === 'city') return (a.city || 'zzz').localeCompare(b.city || 'zzz', 'fr', { sensitivity: 'base' });
    if (sortBy === 'service') return (a.service || '').localeCompare(b.service || '', 'fr', { sensitivity: 'base' });
    const na = a.refCode ? parseInt(a.refCode.replace(/\D/g, ''), 10) : Infinity;
    const nb = b.refCode ? parseInt(b.refCode.replace(/\D/g, ''), 10) : Infinity;
    return na - nb;
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (ID, nom, email, ville)…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-transparent">
          <option value="all">Tous</option>
          <option value="clients">Clients</option>
          <option value="prospects">Prospects</option>
        </select>
        <select value={service} onChange={(e) => setService(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-transparent">
          <option value="all">Tous services</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-transparent">
          <option value="id">Tri : ID</option>
          <option value="name">Tri : Nom A-Z</option>
          <option value="city">Tri : Ville</option>
          <option value="service">Tri : Service</option>
        </select>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      {meta && meta.withId < meta.total && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm">
          <span className="text-orange-800">{meta.total - meta.withId} contact(s) sans ID.</span>
          <button onClick={backfill} disabled={backfilling} className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-semibold disabled:opacity-50">
            {backfilling ? 'Attribution…' : 'Générer les ID manquants (ID001…)'}
          </button>
          {msg && <span className="text-green-600 text-xs">{msg}</span>}
        </div>
      )}

      <p className="text-xs text-gray-400 mb-2">{view.length} contact(s){service !== 'all' ? ` · service : ${service}` : ''}{cities.length ? ` · ${cities.length} ville(s)` : ''}</p>

      {loading && items.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Chargement…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-3">ID</th><th className="py-2 pr-3">Nom</th><th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Ville</th><th className="py-2 pr-3">Service</th>
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r.id} onClick={() => r.email && onOpen(r.email)} className="border-b border-gray-100 dark:border-gray-800 hover:bg-orange-50/40 dark:hover:bg-gray-800/50 cursor-pointer">
                  <td className="py-2 pr-3"><span className="font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 text-xs">{r.refCode || '—'}</span></td>
                  <td className="py-2 pr-3 font-medium">{r.name || '—'}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.email || '—'}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.city || '—'}</td>
                  <td className="py-2 pr-3"><span className={`text-xs px-2 py-0.5 rounded-full ${r.kind === 'prospect' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.service || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {view.length === 0 && <p className="text-gray-400 text-center py-8">Aucun contact.</p>}
        </div>
      )}
    </div>
  );
}

function Detail({ data, onEditFiche }: { data: any; onEditFiche: (id: string) => void }) {
  const typeUrl = (t: string) => (t === 'HOTEL' ? 'hotels' : t === 'RESTAURANT' ? 'restaurants' : t === 'ATTRACTION' ? 'attractions' : 'prestataires');
  return (
    <div className="space-y-5">
      {/* En-tête profil */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            {data.refCode && <span className="inline-block text-xs font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 mb-1">{data.refCode}</span>}
            <h3 className="text-lg font-bold">
              {(data.user?.firstName || data.prospect?.firstName || '') + ' ' + (data.user?.lastName || data.prospect?.lastName || '')}
              {!data.user?.firstName && !data.prospect?.firstName && data.email}
            </h3>
            <div className="text-sm text-gray-500 space-y-0.5 mt-1">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {data.email}</div>
              {(data.user?.phone || data.prospect?.phone) && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {data.user?.phone || data.prospect?.phone}</div>}
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {data.user && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Compte {data.user.userType || 'client'}</span>}
              {data.prospect && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Prospect {data.prospect.status}</span>}
              {data.verification && (data.verification.verified > 0
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Vérifié ({data.verification.verified})</span>
                : data.verification.pending > 0 ? <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{data.verification.pending} doc(s) en attente</span> : null)}
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="text-3xl font-extrabold text-orange-500">{data.score}</div>
            <div className="text-xs text-gray-400">score /100</div>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 text-center">
          {Object.entries(data.counts).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-gray-50 dark:bg-gray-800 py-2">
              <div className="text-sm font-bold">{v as number}</div>
              <div className="text-[10px] text-gray-400">{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Établissements (fiches) */}
      {data.establishments?.map((e: any) => (
        <div key={e.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="font-bold truncate">{e.name}</span>
              {e.city && <span className="text-xs text-gray-400 inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{e.city}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`https://madaspot.com/${typeUrl(e.type)}/${e.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 inline-flex items-center gap-1">Voir <ExternalLink className="w-3 h-3" /></a>
              <button onClick={() => onEditFiche(e.id)} className="text-xs px-2.5 py-1 rounded-lg bg-orange-500 text-white font-semibold inline-flex items-center gap-1"><PencilLine className="w-3 h-3" /> Modifier</button>
            </div>
          </div>

          {/* Badges statut */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full ${MOD_BADGE[e.moderationStatus] || 'bg-gray-100 text-gray-600'}`}>{e.moderationStatus === 'approved' ? 'En ligne' : e.moderationStatus === 'pending_review' ? 'En attente' : 'Refusée'}</span>
            {e.isFeatured && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 inline-flex items-center gap-1"><Rocket className="w-3 h-3" /> Boostée</span>}
            {typeof e.trustScore === 'number' && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Trust {e.trustScore}</span>}
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 inline-flex items-center gap-1"><Star className="w-3 h-3" /> {e.rating?.toFixed?.(1) ?? e.rating} ({e.reviewCount})</span>
          </div>

          {/* Conformité */}
          <div className={`rounded-lg p-3 mb-3 ${e.conformity.conforme ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
            <div className="flex items-center gap-2 text-sm font-semibold mb-1">
              {e.conformity.conforme ? <><CheckCircle2 className="w-4 h-4 text-green-600" /> Fiche conforme ({e.conformity.score}%)</> : <><AlertTriangle className="w-4 h-4 text-red-500" /> Non conforme ({e.conformity.score}%)</>}
            </div>
            {!e.conformity.conforme && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {e.conformity.failing.map((f: any) => <span key={f.key} className="text-xs px-2 py-0.5 rounded bg-white text-red-600 border border-red-200">{f.label}</span>)}
              </div>
            )}
          </div>

          {/* Photos */}
          {(e.coverImage || e.images?.length > 0) ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {e.coverImage && <img src={e.coverImage} alt="" className="h-24 w-32 object-cover rounded-lg shrink-0" />}
              {e.images?.map((url: string, i: number) => <img key={i} src={url} alt="" className="h-24 w-32 object-cover rounded-lg shrink-0" />)}
            </div>
          ) : (
            <p className="text-xs text-gray-400 inline-flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Aucune photo</p>
          )}
        </div>
      ))}

      {/* Avis reçus */}
      {data.reviewsList?.length > 0 && (
        <Section title={`Avis reçus (${data.reviewsList.length})`}>
          <div className="space-y-2">
            {data.reviewsList.map((r: any, i: number) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.authorName || 'Anonyme'}</span>
                  <span className="text-yellow-600 text-xs">{'★'.repeat(r.rating)}<span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span></span>
                </div>
                {r.comment && <p className="text-xs text-gray-600 mt-1">{r.comment}</p>}
                {r.ownerResponse && <p className="text-xs text-gray-500 mt-1 pl-3 border-l-2 border-orange-200"><strong>Réponse :</strong> {r.ownerResponse}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Réservations */}
      {data.bookingsList?.length > 0 && (
        <Section title={`Réservations (${data.bookingsList.length})`}>
          <div className="space-y-1.5">
            {data.bookingsList.map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-800 py-1.5">
                <span className="font-mono text-xs">{b.reference}</span>
                <span className="text-gray-600">{b.guestName}</span>
                <span className="text-gray-400 text-xs">{new Date(b.checkIn).toLocaleDateString('fr-FR')}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Historique */}
      <Section title="Historique">
        {data.timeline.length === 0 ? <p className="text-sm text-gray-400">Aucune interaction.</p> : (
          <div className="space-y-3">
            {data.timeline.map((t: any, i: number) => {
              const Icon = ICONS[t.type] || MessageSquare;
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-orange-500" /></div>
                  <div className="flex-1 min-w-0 pb-2 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{t.title}</span>
                      <span className="text-xs text-gray-400 shrink-0">{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {t.detail && <p className="text-xs text-gray-500 truncate">{t.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-bold mb-3">{title}</h4>
      {children}
    </div>
  );
}
