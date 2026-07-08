'use client';

import { useState } from 'react';
import { Search, User, Mail, Phone, Building2, Star, CalendarDays, MessageSquare, StickyNote, Bell, Megaphone } from 'lucide-react';

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
  const [email, setEmail] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErr(null);
    setData(null);
    try {
      const res = await fetch(`/api/admin/crm/contact?email=${encodeURIComponent(email.trim())}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setErr(json.error);
    } catch {
      setErr('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <form onSubmit={search} className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email du contact (prestataire ou prospect)…"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <button className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold">Voir la fiche</button>
      </form>

      {loading && <p className="text-gray-400 text-center py-8">Chargement…</p>}
      {err && <p className="text-red-500 text-center py-8">{err}</p>}

      {data && (
        <div className="space-y-6">
          {/* En-tête */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-start justify-between">
              <div>
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

          {/* Timeline */}
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
      )}
    </div>
  );
}
