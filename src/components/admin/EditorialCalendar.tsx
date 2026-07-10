'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, BookOpen, CalendarDays, Tag, Megaphone, Rocket, Facebook, X, Copy, Check, Loader2 } from 'lucide-react';

const TYPE_META: Record<string, { label: string; color: string; icon: any }> = {
  article: { label: 'Article', color: 'text-blue-600 bg-blue-50', icon: BookOpen },
  event: { label: 'Événement', color: 'text-purple-600 bg-purple-50', icon: CalendarDays },
  promotion: { label: 'Promotion', color: 'text-pink-600 bg-pink-50', icon: Tag },
  campaign: { label: 'Campagne', color: 'text-orange-600 bg-orange-50', icon: Megaphone },
  boost: { label: 'Boost', color: 'text-green-600 bg-green-50', icon: Rocket },
};

export default function EditorialCalendar() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<Set<string>>(new Set(Object.keys(TYPE_META)));
  const [fb, setFb] = useState<{ item: any; loading: boolean; result: any } | null>(null);

  const publishFb = async (item: any) => {
    setFb({ item, loading: true, result: null });
    try {
      const res = await fetch('/api/admin/crm/facebook-post', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          city: item.city,
          dateLabel: new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
          imageUrl: item.image,
          link: item.link,
        }),
      });
      const json = await res.json();
      setFb({ item, loading: false, result: json.success ? json.data : { posted: false, text: '', reason: json.error } });
    } catch {
      setFb({ item, loading: false, result: { posted: false, text: '', reason: 'Erreur réseau' } });
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/calendar');
      const json = await res.json();
      if (json.success) setItems(json.data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (t: string) => {
    setTypes((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const filtered = items.filter((i) => types.has(i.type));
  const groups: Record<string, any[]> = {};
  for (const i of filtered) {
    const day = new Date(i.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    (groups[day] = groups[day] || []).push(i);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(TYPE_META).map(([k, m]) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`text-xs px-2.5 py-1 rounded-full border ${types.has(k) ? m.color + ' border-transparent' : 'text-gray-400 border-gray-200'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 text-sm text-gray-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-8">Chargement…</p>
      ) : Object.keys(groups).length === 0 ? (
        <p className="text-gray-400 text-center py-8">Rien de planifié sur la période.</p>
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([day, list]) => (
            <div key={day}>
              <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{day}</h4>
              <div className="space-y-1.5">
                {list.map((i, idx) => {
                  const m = TYPE_META[i.type];
                  const Icon = m.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${m.color}`}><Icon className="w-4 h-4" /></span>
                      <span className="flex-1 text-sm truncate">{i.title}</span>
                      {i.status && <span className="text-xs text-gray-400">{i.status}</span>}
                      {['article', 'event', 'promotion'].includes(i.type) && (
                        <button onClick={() => publishFb(i)} title="Publier sur Facebook" className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[#1877F2] text-gray-900 font-medium shrink-0">
                          <Facebook className="w-3.5 h-3.5" /> Publier
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {fb && <FbModal state={fb} onClose={() => setFb(null)} />}
    </div>
  );
}

function FbModal({ state, onClose }: { state: { item: any; loading: boolean; result: any }; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const r = state.result;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold inline-flex items-center gap-2"><Facebook className="w-4 h-4 text-[#1877F2]" /> Publication Facebook</h3>
          <button onClick={onClose} className="text-gray-400"><X className="w-5 h-5" /></button>
        </div>
        {state.loading ? (
          <p className="text-gray-400 text-sm inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Publication…</p>
        ) : r?.posted ? (
          <p className="text-green-600 text-sm">✅ Publié sur la page Facebook !</p>
        ) : (
          <>
            <p className="text-xs text-orange-600 mb-2">⚠ Publication auto indisponible ({r?.reason || 'jeton FB à reconnecter'}). Copiez le texte ci-dessous et collez-le sur Facebook :</p>
            <textarea readOnly value={r?.text || ''} rows={10} className="w-full text-sm border border-gray-200 rounded-lg p-2 font-mono bg-gray-50" />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(r?.text || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-gray-900 text-sm font-semibold"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copié' : 'Copier le texte'}
              </button>
              {state.item?.image && <a href={state.item.image} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Ouvrir l&apos;image</a>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
