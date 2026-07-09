'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Rocket, Search, RefreshCw, X, Check, Clock } from 'lucide-react';

interface Boost {
  id: string;
  establishmentId: string;
  establishmentName: string | null;
  type: string;
  priority: number;
  startDate: string;
  endDate: string;
  status: string;
  price: number;
  currency: string;
  isPaid: boolean;
  note: string | null;
}

interface EstResult {
  id: string;
  name: string;
  city: string;
  type: string;
  isFeatured: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  featured: 'Mise en avant (featured)',
  top_ranking: 'Haut de classement',
  homepage: 'Page d\'accueil (premium)',
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function BoostManager() {
  const [data, setData] = useState<{ items: Boost[]; activeCount: number; revenuePaid: number; revenuePending: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/boosts');
      const json = await res.json();
      if (json.success) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MiniStat label="Boosts actifs" value={data?.activeCount ?? 0} accent />
        <MiniStat label="Revenus encaissés" value={`${(data?.revenuePaid ?? 0).toLocaleString('fr-FR')} AR`} />
        <MiniStat label="En attente de paiement" value={`${(data?.revenuePending ?? 0).toLocaleString('fr-FR')} AR`} />
      </div>

      <CreateBoost onCreated={load} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold">Boosts</h4>
          <button onClick={load} className="inline-flex items-center gap-2 text-sm text-gray-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
        </div>
        {!data || data.items.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Aucun boost. Créez-en un ci-dessus.</p>
        ) : (
          <div className="space-y-2">
            {data.items.map((b) => (
              <BoostRow key={b.id} b={b} onChange={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateBoost({ onCreated }: { onCreated: () => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<EstResult[]>([]);
  const [selected, setSelected] = useState<EstResult | null>(null);
  const [type, setType] = useState('featured');
  const [durationDays, setDurationDays] = useState(15);
  const [price, setPrice] = useState(15000);
  const [isPaid, setIsPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<any>(null);

  const search = (value: string) => {
    setQ(value);
    setSelected(null);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/admin/crm/establishment-search?q=${encodeURIComponent(value)}`);
      const json = await res.json();
      if (json.success) setResults(json.data.items);
    }, 300);
  };

  const create = async () => {
    if (!selected) {
      setMsg('Sélectionnez un établissement');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/crm/boosts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ establishmentId: selected.id, type, durationDays, price, isPaid }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`✅ ${selected.name} boosté pour ${durationDays} jours.`);
        setSelected(null);
        setQ('');
        setResults([]);
        onCreated();
      } else setMsg(json.error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h4 className="font-bold text-sm mb-3 flex items-center gap-2"><Rocket className="w-4 h-4" /> Nouveau boost</h4>

      {/* Recherche établissement */}
      <div className="relative mb-3">
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={selected ? `${selected.name} — ${selected.city}` : q}
            onChange={(e) => search(e.target.value)}
            placeholder="Rechercher un établissement (nom ou ville)…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {selected && <button onClick={() => { setSelected(null); setQ(''); }} className="text-gray-400"><X className="w-4 h-4" /></button>}
        </div>
        {!selected && results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelected(r); setResults([]); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 dark:hover:bg-gray-800 flex items-center justify-between"
              >
                <span>{r.name} <span className="text-gray-400">— {r.city}</span></span>
                {r.isFeatured && <span className="text-xs text-orange-500">déjà en avant</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Offres prédéfinies */}
      <div className="mb-3">
        <span className="block text-xs text-gray-500 mb-1">Offres (Ariary)</span>
        <div className="flex flex-wrap gap-2">
          {OFFERS.map((o) => {
            const activeSel = price === o.price && durationDays === o.days && type === o.type;
            return (
              <button key={o.label} onClick={() => { setPrice(o.price); setDurationDays(o.days); setType(o.type); }}
                className={`text-left px-3 py-2 rounded-lg border text-xs ${activeSel ? 'border-orange-400 bg-orange-50' : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'}`}>
                <div className="font-bold">{o.label}</div>
                <div className="text-gray-500">{o.price.toLocaleString('fr-FR')} AR · {o.days} j</div>
                <div className="text-orange-500">{Math.round(o.price / o.days).toLocaleString('fr-FR')} AR/j</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Type de mise en avant</span>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent">
            <option value="featured">Mise en avant</option>
            <option value="top_ranking">Haut de classement</option>
            <option value="homepage">Page d&apos;accueil (premium)</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Durée (jours)</span>
          <input type="number" min={1} max={365} value={durationDays} onChange={(e) => setDurationDays(Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 365))} className="w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-500 mb-1">Prix (AR, 5 000 – 1 000 000)</span>
          <input type="number" min={5000} max={1000000} step={1000} value={price} onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)} className="w-full px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent" />
        </label>
      </div>

      <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-gray-600">
        Classement calculé : <strong className="text-orange-600">{Math.round(Math.min(Math.max(price, 5000), 1000000) / Math.max(durationDays, 1)).toLocaleString('fr-FR')} AR/jour</strong>.
        Plus le tarif journalier est élevé, plus la fiche passe devant. (Ex : 10 000 AR sur 15 j passe devant 10 000 AR sur 30 j.)
      </div>

      <div className="flex items-center gap-4 mt-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} /> Déjà payé
        </label>
        <button onClick={create} disabled={saving || !selected} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-50">
          {saving ? 'Création…' : 'Booster'}
        </button>
        {msg && <span className={`text-sm ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</span>}
      </div>
    </div>
  );
}

const OFFERS: { label: string; price: number; days: number; type: string }[] = [
  { label: 'Flash', price: 5000, days: 7, type: 'featured' },
  { label: 'Découverte', price: 15000, days: 15, type: 'featured' },
  { label: 'Visibilité', price: 30000, days: 30, type: 'featured' },
  { label: 'Booster+', price: 60000, days: 15, type: 'top_ranking' },
  { label: 'Premium', price: 150000, days: 30, type: 'homepage' },
  { label: 'VIP', price: 500000, days: 30, type: 'homepage' },
];

function BoostRow({ b, onChange }: { b: Boost; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const daysLeft = Math.ceil((new Date(b.endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  const markPaid = async () => {
    setBusy(true);
    await fetch(`/api/admin/crm/boosts/${b.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isPaid: true }),
    });
    onChange();
    setBusy(false);
  };

  const cancel = async () => {
    if (!confirm(`Annuler le boost de ${b.establishmentName} ?`)) return;
    setBusy(true);
    await fetch(`/api/admin/crm/boosts/${b.id}`, { method: 'DELETE' });
    onChange();
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{b.establishmentName || b.establishmentId}</div>
        <div className="text-xs text-gray-500">
          {TYPE_LABELS[b.type] || b.type} · {(b.priority || 0).toLocaleString('fr-FR')} AR/j
          {b.status === 'ACTIVE' && <span className="text-orange-500"> · <Clock className="w-3 h-3 inline" /> {daysLeft > 0 ? `${daysLeft} j restants` : 'expire'}</span>}
        </div>
      </div>
      <div className="text-right text-xs shrink-0">
        <div className="font-semibold">{b.price > 0 ? `${b.price.toLocaleString('fr-FR')} ${b.currency}` : 'Gratuit'}</div>
        <div className={b.isPaid ? 'text-green-600' : 'text-orange-500'}>{b.price > 0 ? (b.isPaid ? 'payé' : 'à encaisser') : ''}</div>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${STATUS_BADGE[b.status] || 'bg-gray-100'}`}>{b.status}</span>
      <div className="flex items-center gap-1 shrink-0">
        {!b.isPaid && b.price > 0 && b.status === 'ACTIVE' && (
          <button onClick={markPaid} disabled={busy} title="Marquer payé" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600"><Check className="w-4 h-4" /></button>
        )}
        {(b.status === 'ACTIVE' || b.status === 'SCHEDULED') && (
          <button onClick={cancel} disabled={busy} title="Annuler" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><X className="w-4 h-4" /></button>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
