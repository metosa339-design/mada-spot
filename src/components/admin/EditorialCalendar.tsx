'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, BookOpen, CalendarDays, Tag, Megaphone, Rocket } from 'lucide-react';

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
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
