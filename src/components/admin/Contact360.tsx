'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, Mail, Phone, Building2, Star, CalendarDays, MessageSquare, StickyNote, Bell, Megaphone, ChevronLeft, RefreshCw } from 'lucide-react';

const ICONS: Record<string, any> = {
  account: User,
  prospect: Search,
  conversation: MessageSquare,
  booking: CalendarDays,
  review: Star,
  note: StickyNote,
  followup: Bell,
  campaign: Megaphone,
};

export default function Contact360() {
  const [data, setData] = useState<any>(null); // fiche détaillée
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  // Ouverture depuis la boîte de réception (clic « Fiche 360° »)
  useEffect(() => {
    let preset: string | null = null;
    try {
      preset = sessionStorage.getItem('crm360email');
      if (preset) sessionStorage.removeItem('crm360email');
    } catch { /* ignore */ }
    if (preset) doSearch(preset);
  }, [doSearch]);

  // Vue détail
  if (data || loading || err) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => { setData(null); setErr(null); }} className="inline-flex items-center gap-1 text-sm text-gray-500 mb-4"><ChevronLeft className="w-4 h-4" /> Liste des contacts</button>
        {loading && <p className="text-gray-400 text-center py-8">Chargement…</p>}
        {err && <p className="text-red-500 text-center py-8">{err}</p>}
        {data && <Detail data={data} />}
      </div>
    );
  }

  // Vue liste
  return <ContactList onOpen={(email) => doSearch(email)} />;
}

function ContactList({ onOpen }: { onOpen: (email: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; withId: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState('all');
  const [search, setSearch] = useState('');
  const [backfilling, setBackfilling] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ kind });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/crm/contacts?${params}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data.items);
        setMeta({ total: json.data.total, withId: json.data.withId });
      }
    } finally {
      setLoading(false);
    }
  }, [kind, search]);

  useEffect(() => {
    load();
  }, [load]);

  const backfill = async () => {
    setBackfilling(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/crm/refcode-backfill', { method: 'POST' });
      const json = await res.json();
      setMsg(json.success ? `${json.data.assigned} ID attribués.` : json.error);
      load();
    } finally {
      setBackfilling(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (ID, nom, email, ville)…" className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-transparent">
          <option value="all">Tous</option>
          <option value="clients">Clients</option>
          <option value="prospects">Prospects</option>
        </select>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>

      {meta && meta.withId < meta.total && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm">
          <span className="text-orange-800">{meta.total - meta.withId} contact(s) sans ID lisible.</span>
          <button onClick={backfill} disabled={backfilling} className="px-3 py-1 rounded-lg bg-orange-500 text-white text-xs font-semibold disabled:opacity-50">
            {backfilling ? 'Attribution…' : 'Générer les ID manquants (ID001…)'}
          </button>
          {msg && <span className="text-green-600 text-xs">{msg}</span>}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="text-gray-400 text-center py-8">Chargement…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="py-2 pr-3">ID</th>
                <th className="py-2 pr-3">Nom</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Ville</th>
                <th className="py-2 pr-3">Service</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => r.email && onOpen(r.email)}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-orange-50/40 dark:hover:bg-gray-800/50 cursor-pointer"
                >
                  <td className="py-2 pr-3">
                    <span className="font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 text-xs">{r.refCode || '—'}</span>
                  </td>
                  <td className="py-2 pr-3 font-medium">{r.name || '—'}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.email || '—'}</td>
                  <td className="py-2 pr-3 text-gray-500">{r.city || '—'}</td>
                  <td className="py-2 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.kind === 'prospect' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.service || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-gray-400 text-center py-8">Aucun contact.</p>}
        </div>
      )}
    </div>
  );
}

function Detail({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            {data.refCode && (
              <span className="inline-block text-xs font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 mb-1">{data.refCode}</span>
            )}
            <h3 className="text-lg font-bold">
              {(data.user?.firstName || data.prospect?.firstName || '') + ' ' + (data.user?.lastName || data.prospect?.lastName || '')}
              {!data.user?.firstName && !data.prospect?.firstName && data.email}
            </h3>
            <div className="text-sm text-gray-500 space-y-0.5 mt-1">
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {data.email}</div>
              {(data.user?.phone || data.prospect?.phone) && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {data.user?.phone || data.prospect?.phone}</div>}
              {data.prospect?.company && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> {data.prospect.company}</div>}
            </div>
            <div className="flex gap-2 mt-2">
              {data.user && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Compte {data.user.userType || 'client'}</span>}
              {data.prospect && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Prospect {data.prospect.status}</span>}
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

      <div>
        <h4 className="text-sm font-bold mb-3">Historique</h4>
        {data.timeline.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune interaction.</p>
        ) : (
          <div className="space-y-3">
            {data.timeline.map((t: any, i: number) => {
              const Icon = ICONS[t.type] || MessageSquare;
              return (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-orange-500" />
                  </div>
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
      </div>
    </div>
  );
}
