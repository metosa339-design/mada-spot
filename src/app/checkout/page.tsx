'use client';

// Mada Spot — Guichet / Achat Express (spec §4, Interface 1, Onglet 3).
// Formulaire ultra-simplifié (Nom + Numéro Mobile Money), timer de réservation
// 15 min, écran d'attente PUSH USSD avec polling temps réel du statut.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Smartphone,
  Ticket,
  Minus,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  createOrderSchema,
  malagasyPhoneSchema,
  type OrderItemInput,
} from '@/lib/validations/ticketing';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface TicketTypeDTO {
  id: string;
  name: string;
  priceMga: string;
  remainingQuantity: number;
  maxPerOrder: number;
  soldOut: boolean;
  salesClosed: boolean;
}

interface EventDTO {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  location: string | null;
  city: string;
  coverImage: string | null;
  ticketTypes: TicketTypeDTO[];
}

type PaymentMethod = 'MVOLA' | 'ORANGE_MONEY' | 'AIRTEL_MONEY';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'MVOLA', label: 'MVola', hint: 'Telma' },
  { value: 'ORANGE_MONEY', label: 'Orange Money', hint: 'Orange' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money', hint: 'Airtel' },
];

const fmtMga = (n: number) => new Intl.NumberFormat('fr-MG').format(Math.round(n)) + ' Ar';

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <CheckoutInner />
    </Suspense>
  );
}

function CenteredSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
    </div>
  );
}

function CheckoutInner() {
  const params = useSearchParams();
  const eventSlug = params.get('event') || '';

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Panier : ticketTypeId -> quantité
  const [cart, setCart] = useState<Record<string, number>>({});
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('MVOLA');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Phase : formulaire → attente USSD → résultat
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  // Clé d'idempotence stable pour toute la session de paiement (anti double-débit).
  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current && typeof crypto !== 'undefined' && crypto.randomUUID) {
    idempotencyKeyRef.current = `chk_${crypto.randomUUID()}`;
  }

  // -- Chargement de l'événement -------------------------------------------
  useEffect(() => {
    if (!eventSlug) {
      setLoading(false);
      setLoadError('Aucun événement sélectionné.');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ticketing/events/${encodeURIComponent(eventSlug)}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setLoadError(json.error || 'Événement introuvable.');
        } else {
          setEvent(json.data as EventDTO);
          // Pré-sélection éventuelle via ?t=typeId:qty,typeId:qty
          const preset = params.get('t');
          if (preset) {
            const next: Record<string, number> = {};
            for (const chunk of preset.split(',')) {
              const [id, qty] = chunk.split(':');
              const n = parseInt(qty || '1', 10);
              if (id && Number.isFinite(n) && n > 0) next[id] = n;
            }
            setCart(next);
          }
        }
      } catch {
        if (!cancelled) setLoadError('Connexion impossible. Vérifiez votre réseau.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventSlug, params]);

  // -- Panier ---------------------------------------------------------------
  const setQty = useCallback(
    (t: TicketTypeDTO, delta: number) => {
      setCart((prev) => {
        const current = prev[t.id] ?? 0;
        const max = Math.min(t.maxPerOrder, t.remainingQuantity);
        const next = Math.max(0, Math.min(max, current + delta));
        const copy = { ...prev };
        if (next === 0) delete copy[t.id];
        else copy[t.id] = next;
        return copy;
      });
    },
    []
  );

  const items: OrderItemInput[] = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })),
    [cart]
  );

  const total = useMemo(() => {
    if (!event) return 0;
    return event.ticketTypes.reduce((sum, t) => sum + (cart[t.id] ?? 0) * Number(t.priceMga), 0);
  }, [event, cart]);

  const totalTickets = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  // -- Soumission -----------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    if (!event) return;
    setSubmitError(null);
    setFieldErrors({});

    const payload = {
      eventId: event.id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      paymentMethod: method,
      channelSource: 'WEB' as const,
      items,
      idempotencyKey: idempotencyKeyRef.current || undefined,
    };

    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? 'form';
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/ticketing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSubmitError(json.error || 'La commande a échoué. Réessayez.');
        setSubmitting(false);
        return;
      }
      setOrderId(json.data.orderId);
      setStatus('PENDING');
      setExpiresAt(new Date(json.data.expiresAt).getTime());
    } catch {
      setSubmitError('Connexion impossible. Vérifiez votre réseau.');
      setSubmitting(false);
    }
  }, [event, clientName, clientPhone, method, items]);

  // -- Polling du statut (écran d'attente USSD) -----------------------------
  useEffect(() => {
    if (!orderId || !status || ['PAID', 'FAILED', 'EXPIRED', 'REFUNDED'].includes(status)) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/ticketing/orders/${orderId}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && res.ok && json.success) {
          setStatus(json.data.status as OrderStatus);
        }
      } catch {
        /* réseau instable : on retentera au prochain tick */
      }
    };
    const interval = setInterval(poll, 3000);
    poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, status]);

  // ------------------------------------------------------------------------
  // Rendu
  // ------------------------------------------------------------------------
  return (
    <div
      className="min-h-screen bg-[#F8FAFC]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link
          href={event ? `/evenements/${event.slug}` : '/evenements'}
          className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </Link>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
          </div>
        ) : loadError ? (
          <ErrorCard message={loadError} />
        ) : orderId && status ? (
          <PaymentWaiting
            status={status}
            method={method}
            phone={clientPhone}
            total={total}
            expiresAt={expiresAt}
            orderId={orderId}
            eventSlug={event?.slug ?? ''}
            onExpire={() => setStatus('EXPIRED')}
          />
        ) : event ? (
          <CheckoutForm
            event={event}
            cart={cart}
            setQty={setQty}
            total={total}
            totalTickets={totalTickets}
            clientName={clientName}
            setClientName={setClientName}
            clientPhone={clientPhone}
            setClientPhone={setClientPhone}
            method={method}
            setMethod={setMethod}
            fieldErrors={fieldErrors}
            submitError={submitError}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        ) : null}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Formulaire
// ----------------------------------------------------------------------------

function CheckoutForm(props: {
  event: EventDTO;
  cart: Record<string, number>;
  setQty: (t: TicketTypeDTO, delta: number) => void;
  total: number;
  totalTickets: number;
  clientName: string;
  setClientName: (v: string) => void;
  clientPhone: string;
  setClientPhone: (v: string) => void;
  method: PaymentMethod;
  setMethod: (m: PaymentMethod) => void;
  fieldErrors: Record<string, string>;
  submitError: string | null;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const {
    event,
    cart,
    setQty,
    total,
    totalTickets,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    method,
    setMethod,
    fieldErrors,
    submitError,
    submitting,
    onSubmit,
  } = props;

  const phoneValid = malagasyPhoneSchema.safeParse(clientPhone).success;
  const canSubmit = totalTickets > 0 && clientName.trim().length >= 2 && phoneValid && !submitting;

  return (
    <div className="space-y-5">
      {/* En-tête événement */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-[11px] uppercase tracking-wider text-[#FF6B35] font-semibold mb-1">
          Guichet express
        </p>
        <h1 className="text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A]">
          {event.title}
        </h1>
        <p className="text-[13px] text-[#64748B] mt-1">
          {new Date(event.startDate).toLocaleString('fr-MG', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
          {event.location ? ` · ${event.location}` : ''} · {event.city}
        </p>
      </div>

      {/* Sélecteur de billets */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h2 className="text-[14px] font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-[#FF6B35]" /> Vos billets
        </h2>
        {event.ticketTypes.length === 0 ? (
          <p className="text-[13px] text-[#64748B]">Aucun billet en vente pour cet événement.</p>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {event.ticketTypes.map((t) => {
              const qty = cart[t.id] ?? 0;
              const disabled = t.soldOut || t.salesClosed;
              const max = Math.min(t.maxPerOrder, t.remainingQuantity);
              return (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[#0F172A] truncate">{t.name}</p>
                    <p className="text-[13px] text-[#64748B]">
                      {fmtMga(Number(t.priceMga))}
                      {disabled ? (
                        <span className="ml-2 text-[#DC2626] font-medium">
                          {t.soldOut ? 'Épuisé' : 'Ventes closes'}
                        </span>
                      ) : t.remainingQuantity <= 10 ? (
                        <span className="ml-2 text-[#EA580C]">
                          Plus que {t.remainingQuantity}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      aria-label="Retirer un billet"
                      onClick={() => setQty(t, -1)}
                      disabled={disabled || qty === 0}
                      className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-[14px] font-semibold text-[#0F172A] tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Ajouter un billet"
                      onClick={() => setQty(t, +1)}
                      disabled={disabled || qty >= max}
                      className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#0F172A] disabled:opacity-40 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {fieldErrors.items && (
          <p className="text-[12px] text-[#DC2626] mt-2">{fieldErrors.items}</p>
        )}
      </div>

      {/* Coordonnées */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        <h2 className="text-[14px] font-semibold text-[#0F172A]">Vos coordonnées</h2>
        <div>
          <label htmlFor="name" className="block text-[13px] font-medium text-[#334155] mb-1.5">
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Rakoto Andrianina"
            autoComplete="name"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] text-[#0F172A] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all"
          />
          {fieldErrors.clientName && (
            <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.clientName}</p>
          )}
        </div>
        <div>
          <label htmlFor="phone" className="block text-[13px] font-medium text-[#334155] mb-1.5">
            Numéro Mobile Money
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="034 12 345 67"
            autoComplete="tel"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] text-[#0F172A] outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all"
          />
          {fieldErrors.clientPhone && (
            <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.clientPhone}</p>
          )}
        </div>
      </div>

      {/* Méthode de paiement */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <h2 className="text-[14px] font-semibold text-[#0F172A] mb-3">Mode de paiement</h2>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((m) => {
            const active = method === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={`rounded-lg border p-3 text-center transition-all ${
                  active
                    ? 'border-[#FF6B35] bg-[#FFF7ED] ring-2 ring-[#FF6B35]/15'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <Smartphone
                  className={`w-5 h-5 mx-auto mb-1 ${active ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}`}
                />
                <span className="block text-[13px] font-medium text-[#0F172A]">{m.label}</span>
                <span className="block text-[11px] text-[#94A3B8]">{m.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Récapitulatif + CTA */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] text-[#64748B]">
            {totalTickets} billet{totalTickets > 1 ? 's' : ''}
          </span>
          <span className="text-[20px] font-bold text-[#0F172A] tabular-nums">{fmtMga(total)}</span>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#B91C1C]">{submitError}</p>
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] disabled:bg-[#FDBA9B] disabled:cursor-not-allowed text-white font-semibold text-[14px] transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Traitement…
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" /> Payer {fmtMga(total)}
            </>
          )}
        </button>
        <p className="text-[11px] text-[#94A3B8] text-center mt-3 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" /> Réservation garantie 15 minutes après validation
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Écran d'attente PUSH USSD + résultat
// ----------------------------------------------------------------------------

function PaymentWaiting(props: {
  status: OrderStatus;
  method: PaymentMethod;
  phone: string;
  total: number;
  expiresAt: number | null;
  orderId: string;
  eventSlug: string;
  onExpire: () => void;
}) {
  const { status, method, phone, total, expiresAt, orderId, eventSlug, onExpire } = props;
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;

  // Compte à rebours de la réservation.
  const [remaining, setRemaining] = useState<number>(() =>
    expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 0
  );
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const secs = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0 && (status === 'PENDING' || status === 'PROCESSING')) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, status, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  if (status === 'PAID') {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#10B981]/25 flex items-center justify-center mx-auto mb-4 animate-[pulse_1.2s_ease-in-out_2]">
          <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-1">
          Paiement confirmé
        </h1>
        <p className="text-[14px] text-[#64748B] mb-6">
          Vos billets sont prêts. Vous les recevrez par WhatsApp/SMS et ils sont disponibles ici.
        </p>
        <Link
          href={`/mes-billets?order=${orderId}`}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold text-[14px] transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
        >
          <Ticket className="w-4 h-4" /> Voir mes billets
        </Link>
      </div>
    );
  }

  if (status === 'FAILED' || status === 'EXPIRED' || status === 'REFUNDED') {
    const label =
      status === 'EXPIRED'
        ? 'Réservation expirée'
        : status === 'REFUNDED'
        ? 'Commande remboursée'
        : 'Paiement échoué';
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FEF2F2] border border-[#DC2626]/25 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-[#DC2626]" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-1">{label}</h1>
        <p className="text-[14px] text-[#64748B] mb-6">
          {status === 'EXPIRED'
            ? 'Le délai de 15 minutes est dépassé et les places ont été libérées.'
            : 'Aucun montant n’a été débité. Vous pouvez réessayer.'}
        </p>
        <Link
          href={eventSlug ? `/evenements/${eventSlug}` : '/evenements'}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold text-[14px] transition-all"
        >
          Réessayer
        </Link>
      </div>
    );
  }

  // PENDING / PROCESSING → attente du PUSH USSD.
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
      <div className="relative w-20 h-20 mx-auto mb-5">
        <span className="absolute inset-0 rounded-full bg-[#FF6B35]/15 animate-ping" />
        <span className="absolute inset-2 rounded-full bg-[#FF6B35]/10" />
        <span className="absolute inset-0 flex items-center justify-center">
          <Smartphone className="w-8 h-8 text-[#FF6B35]" />
        </span>
      </div>
      <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-2">
        Confirmez sur votre téléphone
      </h1>
      <p className="text-[14px] text-[#64748B] leading-relaxed mb-5">
        Une demande <span className="font-semibold text-[#0F172A]">{methodLabel}</span> de{' '}
        <span className="font-semibold text-[#0F172A]">{fmtMga(total)}</span> a été envoyée au{' '}
        <span className="font-semibold text-[#0F172A]">{phone}</span>. Saisissez votre code secret
        pour valider.
      </p>

      <div className="inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 mb-6">
        <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
        <span className="text-[13px] text-[#64748B]">
          {status === 'PROCESSING' ? 'Paiement en cours de validation…' : 'En attente de confirmation…'}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[13px] text-[#64748B]">
        <Clock className="w-3.5 h-3.5" />
        <span>
          Réservation valable encore{' '}
          <span className="font-semibold text-[#0F172A] tabular-nums">
            {mm}:{ss}
          </span>
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
      <div className="w-14 h-14 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/20 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
      </div>
      <h1 className="text-[18px] font-semibold text-[#0F172A] mb-2">Oups…</h1>
      <p className="text-[14px] text-[#64748B] mb-6">{message}</p>
      <Link
        href="/evenements"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] transition-all"
      >
        Voir les événements
      </Link>
    </div>
  );
}
