'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingDown, Users, Building2, CheckCircle2, Activity } from 'lucide-react';

interface FunnelStage {
  key: string;
  label: string;
  count: number;
  ofPrevious: number | null;
}

interface FunnelData {
  generatedAt: string;
  accounts: { usersTotal: number; prosTotal: number };
  fiches: { approved: number; pending: number; rejected: number; total: number };
  owners: { withFiche: number; validated: number; active: number };
  prospects: {
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    converted: number;
    conversionRate: number;
  };
  funnel: FunnelStage[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouveau',
  CONTACTED: 'Contacté',
  ENGAGED: 'Engagé',
  QUALIFIED: 'Qualifié',
  CONVERTED: 'Converti',
  UNRESPONSIVE: 'Sans réponse',
  UNSUBSCRIBED: 'Désinscrit',
  REJECTED: 'Rejeté',
};

const SOURCE_LABELS: Record<string, string> = {
  NEWSLETTER: 'Newsletter',
  CONTACT_FORM: 'Formulaire',
  CSV_IMPORT: 'Import CSV',
  MESSENGER: 'Messenger',
  MANUAL: 'Manuel',
  EVENT: 'Événement',
  REFERRAL: 'Parrainage',
  OTHER: 'Autre',
};

export default function FunnelDashboard() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/crm/funnel');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erreur');
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) {
    return <div className="py-16 text-center text-gray-500">Chargement de l&apos;entonnoir…</div>;
  }
  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-orange-500 text-gray-900 text-sm font-semibold">Réessayer</button>
      </div>
    );
  }
  if (!data) return null;

  const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-8">
      {/* En-tête + refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Généré le {new Date(data.generatedAt).toLocaleString('fr-FR')}
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      {/* Cartes clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Comptes pro" value={data.accounts.prosTotal} sub={`${data.accounts.usersTotal} comptes au total`} />
        <StatCard icon={Building2} label="Fiches en ligne" value={data.fiches.approved} sub={`${data.fiches.pending} en attente de validation`} accent />
        <StatCard icon={CheckCircle2} label="Pros avec fiche validée" value={data.owners.validated} sub={`${data.owners.withFiche} ont créé une fiche`} />
        <StatCard icon={Activity} label="Pros actifs" value={data.owners.active} sub="réservation ou avis reçu" />
      </div>

      {/* Entonnoir */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-700 mb-4">Entonnoir d&apos;acquisition</h4>
        <div className="space-y-2">
          {data.funnel.map((stage) => (
            <div key={stage.key} className="flex items-center gap-3">
              <div className="w-48 text-sm text-gray-600 dark:text-gray-700 shrink-0">{stage.label}</div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-9 relative">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 flex items-center px-3 rounded-lg transition-all"
                  style={{ width: `${Math.max((stage.count / maxCount) * 100, 6)}%` }}
                >
                  <span className="text-gray-900 text-sm font-bold">{stage.count}</span>
                </div>
              </div>
              <div className="w-20 text-right text-xs shrink-0">
                {stage.ofPrevious !== null ? (
                  <span className={stage.ofPrevious < 50 ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                    {stage.ofPrevious < 50 && <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                    {stage.ofPrevious}%
                  </span>
                ) : (
                  <span className="text-gray-700">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Le % à droite = taux de passage depuis l&apos;étape précédente. En rouge = déperdition &gt; 50 % (là où on perd le plus de monde).
        </p>
      </div>

      {/* Prospects par statut + par source */}
      <div className="grid md:grid-cols-2 gap-6">
        <Breakdown title="Prospects par statut" map={data.prospects.byStatus} labels={STATUS_LABELS} />
        <Breakdown title="Prospects par source" map={data.prospects.bySource} labels={SOURCE_LABELS} />
      </div>

      {/* Fiches par statut de modération */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-700 mb-3">Fiches par statut de modération</h4>
        <div className="grid grid-cols-3 gap-4">
          <MiniStat label="Approuvées" value={data.fiches.approved} color="text-green-600" />
          <MiniStat label="En attente" value={data.fiches.pending} color="text-orange-500" />
          <MiniStat label="Refusées" value={data.fiches.rejected} color="text-red-500" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Breakdown({ title, map, labels }: { title: string; map: Record<string, number>; labels: Record<string, string> }) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <div>
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-700 mb-3">{title}</h4>
      {entries.length === 0 ? (
        <p className="text-xs text-gray-400">Aucun prospect enregistré.</p>
      ) : (
        <div className="space-y-1.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="w-28 text-xs text-gray-600 dark:text-gray-700 shrink-0">{labels[k] || k}</div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded h-5 overflow-hidden">
                <div className="h-full bg-orange-400/70 rounded" style={{ width: `${(v / total) * 100}%` }} />
              </div>
              <div className="w-8 text-right text-xs font-semibold">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
