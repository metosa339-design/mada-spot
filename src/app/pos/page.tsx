'use client';

// Mada Spot — Guichet POS (Cash-to-Digital) : vente en espèces par un vendeur.
// Réservé aux rôles POS_VENDOR / ADMIN.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Store,
  Minus,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Banknote,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { malagasyPhoneSchema } from '@/lib/validations/ticketing';

interface TicketTypeDTO {
  id: string;
  name: string;
  priceMga: string;
  remainingQuantity: number;
  maxPerOrder: number;
  soldOut: boolean;
  salesClosed: boolean;
}
interface PosEvent {
  id: string;
  title: string;
  startDate: string;
  city: string;
  ticketTypes: TicketTypeDTO[];
}
interface SaleResult {
  totalAmount: string;
  posCommission: string;
  tickets: { securityCode: string; category: string }[];
}

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

export default function PosPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [events, setEvents] = useState<PosEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [eventId, setEventId] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaleResult | null>(null);
  const idemRef = useRef('');

  const newIdem = () => {
    idemRef.current =
      typeof crypto !== 'undefined' && crypto.randomUUID ? `pos_${crypto.randomUUID()}` : `pos_${Date.now()}`;
  };
  if (!idemRef.current) newIdem();

  // Auth + chargement des événements
  useEffect(() => {
    (async () => {
      try {
        const sess = await fetch('/api/auth/session', { cache: 'no-store' });
        const sjson = await sess.json();
        if (!sjson.success || !sjson.user) {
          router.replace('/login?redirect=/pos');
          return;
        }
        if (!['POS_VENDOR', 'ADMIN'].includes(sjson.user.role)) {
          router.replace('/');
          return;
        }
        setAuthed(true);
        const res = await fetch('/api/pos/events', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json.success) setEvents(json.data);
      } catch {
        router.replace('/login?redirect=/pos');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const event = useMemo(() => events.find((e) => e.id === eventId) || null, [events, eventId]);

  const setQty = useCallback(
    (t: TicketTypeDTO, delta: number) => {
      setCart((prev) => {
        const max = Math.min(t.maxPerOrder, t.remainingQuantity);
        const value = Math.max(0, Math.min(max, (prev[t.id] ?? 0) + delta));
        const copy = { ...prev };
        if (value === 0) delete copy[t.id];
        else copy[t.id] = value;
        return copy;
      });
    },
    []
  );

  const items = useMemo(() => Object.entries(cart).filter(([, q]) => q > 0), [cart]);
  const total = useMemo(
    () => (event ? event.ticketTypes.reduce((s, t) => s + (cart[t.id] ?? 0) * Number(t.priceMga), 0) : 0),
    [event, cart]
  );
  const totalTickets = items.reduce((s, [, q]) => s + q, 0);
  const phoneValid = malagasyPhoneSchema.safeParse(phone).success;
  const canSell = event && totalTickets > 0 && name.trim().length >= 2 && phoneValid && !submitting;

  const sell = useCallback(async () => {
    if (!event) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/pos/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          clientName: name.trim(),
          clientPhone: phone.trim(),
          items: items.map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })),
          idempotencyKey: idemRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Vente impossible.');
        return;
      }
      setResult(json.data);
    } catch {
      setError('Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  }, [event, name, phone, items]);

  const reset = useCallback(() => {
    setResult(null);
    setCart({});
    setName('');
    setPhone('');
    setError(null);
    newIdem();
  }, []);

  if (loading || !authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Accueil
        </Link>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-5 flex items-center gap-2">
          <Store className="w-5 h-5 text-[#FF6B35]" /> Guichet de vente
        </h1>

        {result ? (
          <SaleReceipt result={result} onNew={reset} />
        ) : (
          <div className="space-y-4">
            {/* Sélection événement */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Événement</label>
              <select
                value={eventId}
                onChange={(e) => {
                  setEventId(e.target.value);
                  setCart({});
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35] bg-white"
              >
                <option value="">— Choisir un événement —</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} · {new Date(e.startDate).toLocaleDateString('fr-MG')}
                  </option>
                ))}
              </select>
              {events.length === 0 && (
                <p className="text-[12px] text-[#64748B] mt-2">Aucun événement en vente actuellement.</p>
              )}
            </div>

            {/* Billets */}
            {event && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <p className="text-[13px] font-medium text-[#0F172A] mb-2">Billets</p>
                <div className="divide-y divide-[#F1F5F9]">
                  {event.ticketTypes.map((t) => {
                    const qty = cart[t.id] ?? 0;
                    const disabled = t.soldOut || t.salesClosed;
                    const max = Math.min(t.maxPerOrder, t.remainingQuantity);
                    return (
                      <div key={t.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-[14px] font-medium text-[#0F172A]">{t.name}</p>
                          <p className="text-[13px] text-[#64748B]">
                            {fmtMga(t.priceMga)}
                            {disabled && <span className="ml-2 text-[#DC2626]">{t.soldOut ? 'Épuisé' : 'Clos'}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setQty(t, -1)} disabled={disabled || qty === 0} className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center text-[15px] font-semibold tabular-nums">{qty}</span>
                          <button onClick={() => setQty(t, +1)} disabled={disabled || qty >= max} className="w-9 h-9 rounded-lg border border-[#E2E8F0] flex items-center justify-center disabled:opacity-40">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Client */}
            {event && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Nom du client</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom complet" className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35]" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#334155] mb-1.5">Téléphone (pour recevoir les billets)</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="034 12 345 67" className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35]" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] p-3">
                <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <p className="text-[13px] text-[#B91C1C]">{error}</p>
              </div>
            )}

            {event && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-[#64748B]">{totalTickets} billet(s) · espèces</span>
                  <span className="text-[20px] font-bold text-[#0F172A] tabular-nums">{fmtMga(total)}</span>
                </div>
                <button
                  onClick={sell}
                  disabled={!canSell}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] disabled:bg-[#FDBA9B] disabled:cursor-not-allowed text-white font-semibold text-[14px] transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                  Encaisser {fmtMga(total)}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SaleReceipt({ result, onNew }: { result: SaleResult; onNew: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border border-[#10B981]/25 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-7 h-7 text-[#10B981]" />
        </div>
        <h2 className="text-[20px] font-semibold text-[#0F172A]">Vente encaissée</h2>
        <p className="text-[14px] text-[#64748B] mt-1">
          {fmtMga(result.totalAmount)} · votre commission : {fmtMga(result.posCommission)}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
        <p className="text-[13px] font-medium text-[#0F172A] mb-3">
          Codes à remettre au client ({result.tickets.length})
        </p>
        <div className="space-y-2">
          {result.tickets.map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5">
              <span className="text-[13px] text-[#64748B]">{t.category}</span>
              <span className="text-[22px] font-bold tracking-[0.15em] text-[#0F172A] tabular-nums">{t.securityCode}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#94A3B8] mt-3">
          Les billets (QR + code) ont aussi été envoyés au client par WhatsApp/SMS.
        </p>
      </div>

      <button onClick={onNew} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold text-[14px] transition-all">
        <RotateCcw className="w-4 h-4" /> Nouvelle vente
      </button>
    </div>
  );
}
