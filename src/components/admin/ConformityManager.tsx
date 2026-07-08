'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, PencilLine, Mail, X, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';
import AdminFicheEditor from './AdminFicheEditor';

interface Item {
  id: string;
  name: string;
  type: string;
  city: string | null;
  moderationStatus: string;
  ownerEmail: string | null;
  score: number;
  conforme: boolean;
  failing: { key: string; label: string }[];
}

export default function ConformityManager() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nonConformeOnly, setNonConformeOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [notify, setNotify] = useState<{ id: string; name: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ nonConformeOnly: nonConformeOnly ? '1' : '0', type });
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/crm/conformity?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, [nonConformeOnly, type, search]);

  useEffect(() => {
    load();
  }, [load]);

  if (editing) {
    return <AdminFicheEditor id={editing} onBack={() => setEditing(null)} onSaved={load} />;
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Stat label="Fiches scannées" value={data?.totalScanned ?? 0} />
        <Stat label="Conformes" value={data?.conforme ?? 0} color="text-green-600" />
        <Stat label="Non conformes" value={data?.nonConforme ?? 0} color="text-red-500" accent />
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={nonConformeOnly} onChange={(e) => setNonConformeOnly(e.target.checked)} /> Non conformes uniquement
        </label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent">
          <option value="all">Tous types</option>
          <option value="HOTEL">Hôtels</option>
          <option value="RESTAURANT">Restaurants</option>
          <option value="ATTRACTION">Activités</option>
          <option value="PROVIDER">Prestataires</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un nom…" className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-transparent flex-1 min-w-[160px]" />
        <button onClick={load} className="inline-flex items-center gap-2 text-sm text-gray-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
      </div>

      {/* Liste */}
      {loading && !data ? (
        <p className="text-gray-400 text-center py-8">Analyse des fiches…</p>
      ) : !data || data.items.length === 0 ? (
        <p className="text-gray-400 text-center py-8 inline-flex items-center gap-2 justify-center w-full"><CheckCircle2 className="w-5 h-5 text-green-500" /> Aucune fiche non conforme 🎉</p>
      ) : (
        <div className="space-y-2">
          {data.items.map((it: Item) => (
            <div key={it.id} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{it.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${it.score >= 80 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'}`}>{it.score}%</span>
                </div>
                <div className="text-xs text-gray-500">{it.city || 'Ville ?'} · {it.type} · {it.ownerEmail || 'pas d\'e-mail'}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {it.failing.map((r) => (
                    <span key={r.key} className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">{r.label}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => setEditing(it.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold">
                  <PencilLine className="w-3.5 h-3.5" /> Corriger
                </button>
                <button onClick={() => setNotify({ id: it.id, name: it.name })} disabled={!it.ownerEmail} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold disabled:opacity-40">
                  <Mail className="w-3.5 h-3.5" /> Mail auto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notify && <NotifyModal id={notify.id} name={notify.name} onClose={() => setNotify(null)} onSent={() => { setNotify(null); load(); }} />}
    </div>
  );
}

function NotifyModal({ id, name, onClose, onSent }: { id: string; name: string; onClose: () => void; onSent: () => void }) {
  const [preview, setPreview] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/crm/conformity/notify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ establishmentId: id, preview: true }),
      });
      const json = await res.json();
      if (json.success) setPreview(json.data);
      else setErr(json.error);
    })();
  }, [id]);

  const send = async () => {
    setSending(true);
    setErr(null);
    const res = await fetch('/api/admin/crm/conformity/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ establishmentId: id }),
    });
    const json = await res.json();
    setSending(false);
    if (json.success) onSent();
    else setErr(json.error);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Mail auto — {name}</h3>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        {err && <p className="text-red-500 text-sm mb-3"><AlertTriangle className="w-4 h-4 inline mr-1" />{err}</p>}
        {!preview && !err && <p className="text-gray-400 text-sm">Génération du mail…</p>}
        {preview && (
          <>
            <p className="text-xs text-gray-500 mb-1">À : <strong>{preview.to}</strong></p>
            <p className="text-sm font-semibold mb-3">{preview.subject}</p>
            <div className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
              <p className="mb-2 text-gray-500">Éléments manquants signalés :</p>
              <ul className="list-disc pl-5 space-y-1">
                {preview.failing?.map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div className="flex gap-2">
              <button onClick={send} disabled={sending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
                <Send className="w-4 h-4" /> {sending ? 'Envoi…' : 'Envoyer le mail'}
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color, accent }: { label: string; value: number; color?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className={`text-2xl font-extrabold ${color || ''}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
