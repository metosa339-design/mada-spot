'use client';

// Mada Spot — Organisateur : trésorerie & demandes de virement.

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Wallet, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { malagasyPhoneSchema } from '@/lib/validations/ticketing';

interface PayoutRow {
  id: string;
  amount: string;
  status: string;
  mobileMoneyNumber: string;
  provider: string;
  processedAt: string | null;
  createdAt: string;
}
interface Balance {
  available: string;
  organizerNet: string;
  paidOut: string;
  minPayout: string;
}

type Provider = 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY';
const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'MVOLA', label: 'MVola' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
];

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'En attente', cls: 'bg-[#FFF7ED] text-[#9A3412]' },
  APPROVED: { label: 'Approuvé', cls: 'bg-[#EFF6FF] text-[#1D4ED8]' },
  EXECUTED: { label: 'Versé', cls: 'bg-[#ECFDF5] text-[#047857]' },
  REJECTED: { label: 'Rejeté', cls: 'bg-[#FEF2F2] text-[#B91C1C]' },
};

export default function OrganizerPayoutsPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [requests, setRequests] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState<Provider>('MVOLA');
  const [number, setNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/organizer/payouts', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setBalance(json.data.balance);
        setRequests(json.data.requests);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async () => {
    setError(null);
    setSuccess(null);
    const amt = parseInt(amount, 10);
    if (!Number.isFinite(amt) || amt < 1) {
      setError('Montant invalide.');
      return;
    }
    if (!malagasyPhoneSchema.safeParse(number).success) {
      setError('Numéro Mobile Money invalide.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/organizer/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, provider, mobileMoneyNumber: number }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Demande impossible.');
        return;
      }
      setSuccess('Demande de virement enregistrée. Elle sera traitée par la plateforme.');
      setAmount('');
      setNumber('');
      await load();
    } catch {
      setError('Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  }, [amount, provider, number, load]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  const available = balance ? Number(balance.available) : 0;
  const minPayout = balance ? Number(balance.minPayout) : 0;
  const canRequest = available >= minPayout;

  return (
    <div className="space-y-4">
      {/* Solde */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-[12px] text-[#64748B]">Solde disponible</p>
        <p className="text-[28px] font-bold text-[#0F172A] tabular-nums mt-0.5">
          {fmtMga(available)}
        </p>
        {balance && (
          <p className="text-[11px] text-[#94A3B8] mt-1">
            Net cumulé {fmtMga(balance.organizerNet)} · déjà demandé {fmtMga(balance.paidOut)} · minimum de
            retrait {fmtMga(minPayout)}
          </p>
        )}
      </div>

      {/* Formulaire de demande */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h2 className="text-[14px] font-semibold text-[#0F172A] mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[#FF6B35]" /> Demander un virement
        </h2>

        {!canRequest && (
          <div className="flex items-start gap-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#92400E]">
              Le solde disponible doit atteindre {fmtMga(minPayout)} pour demander un virement.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Montant (Ar)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              placeholder={String(Math.max(minPayout, 0))}
              disabled={!canRequest}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35] disabled:bg-[#F8FAFC]"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Opérateur</label>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => {
                const active = provider === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    disabled={!canRequest}
                    onClick={() => setProvider(p.value)}
                    className={`rounded-lg border p-2.5 text-center text-[13px] font-medium transition-all disabled:opacity-50 ${
                      active ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#0F172A]' : 'border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 mx-auto mb-1 ${active ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Numéro Mobile Money</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              type="tel"
              inputMode="tel"
              placeholder="034 12 345 67"
              disabled={!canRequest}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35] disabled:bg-[#F8FAFC]"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] p-3">
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#B91C1C]">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] p-3">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <p className="text-[13px] text-[#047857]">{success}</p>
            </div>
          )}

          <button
            onClick={submit}
            disabled={!canRequest || submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] disabled:opacity-50 text-white font-semibold text-[14px] transition-all"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            Envoyer la demande
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h2 className="text-[14px] font-semibold text-[#0F172A] mb-3">Historique des virements</h2>
        {requests.length === 0 ? (
          <p className="text-[13px] text-[#64748B]">Aucune demande pour le moment.</p>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {requests.map((r) => {
              const meta = STATUS_META[r.status] || { label: r.status, cls: 'bg-[#F1F5F9] text-[#64748B]' };
              return (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#0F172A] tabular-nums">{fmtMga(r.amount)}</p>
                    <p className="text-[12px] text-[#64748B]">
                      {PROVIDERS.find((p) => p.value === r.provider)?.label ?? r.provider} · {r.mobileMoneyNumber} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString('fr-MG', { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
