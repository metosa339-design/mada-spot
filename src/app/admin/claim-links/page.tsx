'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link2, Download, Loader2, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react';

interface Recipient {
  establishmentId: string;
  name: string;
  type: string;
  city: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  claimUrl: string;
  whatsappLink: string | null;
}

interface GenResult {
  success: boolean;
  summary: {
    matched: number;
    linksReady: number;
    created: number;
    reused: number;
    byEmail: number;
    byPhoneOnly: number;
    whatsappEligible: number;
    skippedNoContact: number;
    unclaimedNoContactTotal: number;
    expiresAt: string;
  };
  recipients: Recipient[];
  csv: string;
}

const TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'PROVIDER', label: 'Prestataires' },
  { value: 'HOTEL', label: 'Hôtels' },
  { value: 'RESTAURANT', label: 'Restaurants' },
  { value: 'ATTRACTION', label: 'Attractions' },
];

function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function ClaimLinksPage() {
  const router = useRouter();
  const [type, setType] = useState('PROVIDER');
  const [city, setCity] = useState('');
  const [limit, setLimit] = useState(100);
  const [expiresDays, setExpiresDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GenResult | null>(null);

  const generate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const filters: Record<string, unknown> = { limit };
      if (type) filters.type = type;
      if (city.trim()) filters.city = city.trim();
      const res = await fetch('/api/admin/claims/generate-links', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, expiresDays }),
      });
      if (res.status === 401) { router.push('/admin/login'); return; }
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || 'Erreur lors de la génération'); return; }
      setResult(data);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    download('liens_revendication.csv', result.csv);
  };

  const downloadWhatsapp = () => {
    if (!result) return;
    const rows = result.recipients.filter((r) => r.whatsappLink);
    const csv = ['etablissement,numero,lien_whatsapp', ...rows.map((r) =>
      [r.name, r.whatsapp || '', r.whatsappLink || ''].map((v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',')
    )].join('\n');
    download('liens_whatsapp.csv', csv);
  };

  const s = result?.summary;

  return (
    <div className="min-h-screen bg-[#12121a]">
      <header className="bg-[#1a1a24] border-b border-[#2a2a36] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button onClick={() => router.push('/admin/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <Link2 className="w-6 h-6 text-orange-500" />
              <h1 className="text-xl font-bold text-white">Liens de revendication</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-400 text-sm mb-6 max-w-2xl">
          Génère un lien de revendication unique par fiche <strong className="text-gray-200">non revendiquée</strong> (email et/ou téléphone),
          pour la campagne « revendiquez votre fiche ». Idempotent : relancer réutilise les liens encore valides.
        </p>

        {/* Filtres */}
        <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-[#12121a] border border-[#2a2a36] rounded-lg text-sm text-white outline-none focus:border-orange-500">
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Ville (optionnel)</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Nosy Be"
                className="w-full px-3 py-2 bg-[#12121a] border border-[#2a2a36] rounded-lg text-sm text-white outline-none focus:border-orange-500 placeholder:text-gray-600" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Limite</label>
              <input type="number" value={limit} min={1} max={1000} onChange={(e) => setLimit(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-[#12121a] border border-[#2a2a36] rounded-lg text-sm text-white outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Expiration (jours)</label>
              <input type="number" value={expiresDays} min={1} max={90} onChange={(e) => setExpiresDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 bg-[#12121a] border border-[#2a2a36] rounded-lg text-sm text-white outline-none focus:border-orange-500" />
            </div>
          </div>
          <button onClick={generate} disabled={loading}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            Générer les liens
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-6">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {s && (
          <>
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4">
              <CheckCircle className="w-4 h-4" /> {s.linksReady} lien(s) prêt(s) — créés {s.created}, réutilisés {s.reused}.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Liens prêts', value: s.linksReady, color: 'text-orange-400' },
                { label: 'Par email', value: s.byEmail, color: 'text-white' },
                { label: 'Par téléphone', value: s.byPhoneOnly, color: 'text-white' },
                { label: 'Fiches sans contact (base)', value: s.unclaimedNoContactTotal, color: 'text-gray-400' },
              ].map((c) => (
                <div key={c.label} className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <button onClick={downloadCsv}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Mail className="w-4 h-4" /> Télécharger le CSV (email / Brevo)
              </button>
              {s.whatsappEligible > 0 && (
                <button onClick={downloadWhatsapp}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-lg hover:brightness-95 transition-all">
                  <Phone className="w-4 h-4" /> Liens WhatsApp ({s.whatsappEligible})
                </button>
              )}
            </div>

            <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#2a2a36] text-xs text-gray-400">
                Aperçu ({Math.min(result!.recipients.length, 15)} sur {result!.recipients.length})
              </div>
              <div className="divide-y divide-[#2a2a36] max-h-96 overflow-y-auto">
                {result!.recipients.slice(0, 15).map((r) => (
                  <div key={r.establishmentId} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white truncate">{r.name}</div>
                      <div className="text-xs text-gray-500 truncate">{r.city || '—'} · {r.email || r.whatsapp || '—'}</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-[#12121a] border border-[#2a2a36] text-gray-400 shrink-0">
                      {r.email ? 'email' : 'tél'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
