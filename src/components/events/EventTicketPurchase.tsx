'use client';

// Mada Spot — Billetterie : sélecteur de billets sur la page événement.
// Compteur de stock quasi temps réel (polling léger), bouton à double action
// « Acheter via le Web » / « Commander par WhatsApp ». Ne s'affiche que si
// l'événement propose des billets — les événements sans billetterie sont
// totalement inchangés (le composant retourne null).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Minus, Plus, Loader2, ShieldCheck, MessageCircle, Radio } from 'lucide-react';

interface TicketTypeDTO {
  id: string;
  name: string;
  priceMga: string;
  remainingQuantity: number;
  maxPerOrder: number;
  soldOut: boolean;
  salesClosed: boolean;
}

interface EventTicketingDTO {
  title: string;
  ticketTypes: TicketTypeDTO[];
}

const STOCK_POLL_MS = 20_000;

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

// Numéro WhatsApp Business de la plateforme (chiffres uniquement, format
// international sans « + »). Inline à la compilation par Next.
const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export default function EventTicketPurchase({ slug }: { slug: string }) {
  const router = useRouter();
  const [data, setData] = useState<EventTicketingDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [redirecting, setRedirecting] = useState(false);

  // -- Chargement + polling du stock ---------------------------------------
  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch(`/api/ticketing/events/${encodeURIComponent(slug)}`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData({ title: json.data.title, ticketTypes: json.data.ticketTypes });
      }
    } catch {
      /* réseau instable : on retentera au prochain tick */
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void fetchTypes();
    const id = setInterval(fetchTypes, STOCK_POLL_MS);
    return () => clearInterval(id);
  }, [fetchTypes]);

  // Purge du panier si un type devient épuisé/clôturé entre deux rafraîchis.
  useEffect(() => {
    if (!data) return;
    setCart((prev) => {
      let changed = false;
      const next: Record<string, number> = {};
      for (const [id, qty] of Object.entries(prev)) {
        const t = data.ticketTypes.find((x) => x.id === id);
        if (!t || t.soldOut || t.salesClosed) {
          changed = true;
          continue;
        }
        const capped = Math.min(qty, t.maxPerOrder, t.remainingQuantity);
        if (capped !== qty) changed = true;
        if (capped > 0) next[id] = capped;
      }
      return changed ? next : prev;
    });
  }, [data]);

  const setQty = useCallback(
    (t: TicketTypeDTO, delta: number) => {
      setCart((prev) => {
        const current = prev[t.id] ?? 0;
        const max = Math.min(t.maxPerOrder, t.remainingQuantity);
        const value = Math.max(0, Math.min(max, current + delta));
        const copy = { ...prev };
        if (value === 0) delete copy[t.id];
        else copy[t.id] = value;
        return copy;
      });
    },
    []
  );

  const items = useMemo(
    () => Object.entries(cart).filter(([, q]) => q > 0),
    [cart]
  );
  const totalTickets = useMemo(() => items.reduce((s, [, q]) => s + q, 0), [items]);
  const total = useMemo(() => {
    if (!data) return 0;
    return data.ticketTypes.reduce((sum, t) => sum + (cart[t.id] ?? 0) * Number(t.priceMga), 0);
  }, [data, cart]);

  const cartParam = useMemo(() => items.map(([id, q]) => `${id}:${q}`).join(','), [items]);

  // -- Actions --------------------------------------------------------------
  const buyOnWeb = useCallback(() => {
    if (totalTickets === 0) return;
    setRedirecting(true);
    router.push(`/checkout?event=${encodeURIComponent(slug)}&t=${encodeURIComponent(cartParam)}`);
  }, [totalTickets, router, slug, cartParam]);

  const orderOnWhatsApp = useCallback(() => {
    if (totalTickets === 0 || !WHATSAPP_NUMBER || !data) return;
    const lines = items.map(([id, q]) => {
      const t = data.ticketTypes.find((x) => x.id === id);
      return `- ${q} × ${t?.name ?? id} (${fmtMga((t ? Number(t.priceMga) : 0) * q)})`;
    });
    const msg =
      `Bonjour MadaSpot, je souhaite commander pour « ${data.title} » :\n` +
      `${lines.join('\n')}\n` +
      `Total : ${fmtMga(total)}\n` +
      `Mon nom : `;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [totalTickets, data, items, total]);

  // -- Rendu ----------------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6 flex justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  // Pas de billetterie pour cet événement → rien afficher.
  if (!data || data.ticketTypes.length === 0) return null;

  const allSoldOut = data.ticketTypes.every((t) => t.soldOut || t.salesClosed);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] flex items-center gap-2">
          <Ticket className="w-4 h-4" /> Billetterie
        </p>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#10B981]">
          <Radio className="w-3 h-3 animate-pulse" /> Stock en direct
        </span>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {data.ticketTypes.map((t) => {
          const qty = cart[t.id] ?? 0;
          const disabled = t.soldOut || t.salesClosed;
          const max = Math.min(t.maxPerOrder, t.remainingQuantity);
          return (
            <div key={t.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[#0F172A] truncate">{t.name}</p>
                <p className="text-[13px] text-[#64748B]">
                  {fmtMga(t.priceMga)}
                  {disabled ? (
                    <span className="ml-2 text-[#DC2626] font-medium">
                      {t.soldOut ? 'Épuisé' : 'Ventes closes'}
                    </span>
                  ) : t.remainingQuantity <= 10 ? (
                    <span className="ml-2 text-[#EA580C]">Plus que {t.remainingQuantity}</span>
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

      {allSoldOut ? (
        <p className="mt-4 text-center text-[13px] text-[#DC2626] font-medium">
          Tous les billets sont épuisés pour cet événement.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F1F5F9]">
            <span className="text-[13px] text-[#64748B]">
              {totalTickets} billet{totalTickets > 1 ? 's' : ''}
            </span>
            <span className="text-[18px] font-bold text-[#0F172A] tabular-nums">{fmtMga(total)}</span>
          </div>

          {/* Bouton à double action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={buyOnWeb}
              disabled={totalTickets === 0 || redirecting}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] disabled:bg-[#FDBA9B] disabled:cursor-not-allowed text-white font-semibold text-[14px] transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)]"
            >
              {redirecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Acheter via le Web
            </button>
            <button
              type="button"
              onClick={orderOnWhatsApp}
              disabled={totalTickets === 0 || !WHATSAPP_NUMBER}
              title={!WHATSAPP_NUMBER ? 'Commande WhatsApp indisponible' : undefined}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg bg-[#25D366] hover:bg-[#1EBE5A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[14px] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Commander par WhatsApp
            </button>
          </div>
          <p className="text-[11px] text-[#94A3B8] text-center mt-3">
            Paiement Mobile Money · Réservation garantie 15 minutes
          </p>
        </>
      )}
    </div>
  );
}
