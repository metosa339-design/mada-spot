'use client';

// Mada Spot — Organisateur : tableau de bord des performances.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  TrendingUp,
  Wallet,
  Ticket,
  Percent,
  Globe,
  MessageCircle,
  Store,
  CalendarDays,
} from 'lucide-react';

interface ChannelRow {
  channel: string;
  orders: number;
  amount: string;
}
interface DashboardData {
  grossPaid: string;
  organizerNet: string;
  platformFees: string;
  ordersPaid: number;
  ticketsSold: number;
  capacity: number;
  fillRate: number;
  eventsCount: number;
  channels: ChannelRow[];
  balance: { available: string; organizerNet: string; paidOut: string; minPayout: string };
}

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

const CHANNEL_META: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  WEB: { label: 'Web', icon: Globe, color: '#FF6B35' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  POS: { label: 'Guichets', icon: Store, color: '#6366F1' },
};

export default function OrganizerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/organizer/dashboard', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.success) setData(json.data);
        else setError(json.error || 'Chargement impossible.');
      } catch {
        setError('Connexion impossible.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[14px] text-[#64748B]">
        {error || 'Aucune donnée.'}
      </div>
    );
  }

  const totalChannelOrders = data.channels.reduce((s, c) => s + c.orders, 0) || 1;

  return (
    <div className="space-y-4">
      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={TrendingUp} label="CA brut" value={fmtMga(data.grossPaid)} accent />
        <Kpi icon={Wallet} label="Net organisateur" value={fmtMga(data.organizerNet)} />
        <Kpi icon={Ticket} label="Billets vendus" value={String(data.ticketsSold)} />
        <Kpi icon={Percent} label="Taux de remplissage" value={`${data.fillRate}%`} />
      </div>

      {/* Solde disponible */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 flex items-center justify-between">
        <div>
          <p className="text-[12px] text-[#64748B]">Solde disponible au retrait</p>
          <p className="text-[26px] font-bold text-[#0F172A] tabular-nums mt-0.5">
            {fmtMga(data.balance.available)}
          </p>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            Net {fmtMga(data.balance.organizerNet)} · déjà demandé {fmtMga(data.balance.paidOut)}
          </p>
        </div>
        <Link
          href="/organizer/payouts"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold text-[13px] transition-all"
        >
          <Wallet className="w-4 h-4" /> Demander un virement
        </Link>
      </div>

      {/* Répartition des canaux de vente */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h2 className="text-[14px] font-semibold text-[#0F172A] mb-4">Canaux de vente</h2>
        {data.channels.length === 0 ? (
          <p className="text-[13px] text-[#64748B]">Aucune vente pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {data.channels.map((c) => {
              const meta = CHANNEL_META[c.channel] || { label: c.channel, icon: Globe, color: '#94A3B8' };
              const Icon = meta.icon;
              const pct = Math.round((c.orders / totalChannelOrders) * 100);
              return (
                <div key={c.channel}>
                  <div className="flex items-center justify-between text-[13px] mb-1">
                    <span className="inline-flex items-center gap-1.5 text-[#334155] font-medium">
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                      {meta.label}
                    </span>
                    <span className="text-[#64748B]">
                      {c.orders} cmd · {fmtMga(c.amount)} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Résumé secondaire */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={CalendarDays} label="Événements" value={String(data.eventsCount)} small />
        <Kpi icon={Ticket} label="Commandes payées" value={String(data.ordersPaid)} small />
        <Kpi icon={Percent} label="Commission plateforme" value={fmtMga(data.platformFees)} small />
        <Kpi icon={Ticket} label="Capacité totale" value={String(data.capacity)} small />
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
  small,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            accent ? 'bg-[#FFF7ED]' : 'bg-[#F8FAFC]'
          }`}
        >
          <Icon className={`w-4 h-4 ${accent ? 'text-[#FF6B35]' : 'text-[#64748B]'}`} />
        </div>
      </div>
      <p className={`font-bold text-[#0F172A] tabular-nums ${small ? 'text-[16px]' : 'text-[20px]'}`}>
        {value}
      </p>
      <p className="text-[12px] text-[#64748B] mt-0.5">{label}</p>
    </div>
  );
}
