'use client';

// Mada Spot — Espace Billet & Porte-Monnaie PWA (spec §4, Interface 1, Onglet 4).
// Carte billet sécurisée (QR + code SMS à 6 chiffres en très grand), sauvegarde
// hors-ligne (Dexie/IndexedDB), module de revente sécurisé en 1 clic.

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Ticket as TicketIcon,
  Loader2,
  Download,
  CheckCircle2,
  WifiOff,
  Tag,
  ShieldCheck,
  Search,
  CalendarDays,
  MapPin,
} from 'lucide-react';
import {
  saveTickets,
  getSavedByOrder,
  getAllSaved,
  isOrderSaved,
  updateSavedTicket,
  type SavedTicket,
} from '@/lib/ticketing/wallet-db';

// ----------------------------------------------------------------------------
// Types d'affichage
// ----------------------------------------------------------------------------

interface DisplayEvent {
  title: string;
  startDate: string;
  location: string | null;
  city: string;
  slug?: string;
}

interface DisplayTicket {
  id: string;
  qrHash: string;
  securityCode: string;
  category: string;
  priceMga: string;
  isForResale: boolean;
  isScanned: boolean;
}

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------

export default function MyTicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
        </div>
      }
    >
      <MyTicketsInner />
    </Suspense>
  );
}

function MyTicketsInner() {
  const params = useSearchParams();
  const orderId = params.get('order') || '';

  const [loading, setLoading] = useState(true);
  const [offlineSource, setOfflineSource] = useState(false);
  const [event, setEvent] = useState<DisplayEvent | null>(null);
  const [tickets, setTickets] = useState<DisplayTicket[]>([]);
  const [holderName, setHolderName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resaleBusy, setResaleBusy] = useState<string | null>(null);

  // Liste des commandes déjà enregistrées (quand aucun ?order n'est fourni).
  const [savedOrders, setSavedOrders] = useState<
    { orderId: string; eventTitle: string; count: number }[]
  >([]);
  const [manualOrderId, setManualOrderId] = useState('');

  // -- Chargement ----------------------------------------------------------
  const load = useCallback(async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/ticketing/orders/${encodeURIComponent(id)}/tickets`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (res.ok && json.success && json.data.status === 'PAID') {
        setEvent(json.data.event);
        setHolderName(json.data.clientName);
        setTickets(json.data.tickets);
        setStatus('PAID');
        setOfflineSource(false);
        setSaved(await isOrderSaved(id));
        return;
      }
      if (res.ok && json.success) {
        setStatus(json.data.status);
        // Commande non payée : tentative de repli hors-ligne quand même.
      }
      await loadOffline(id);
    } catch {
      await loadOffline(id);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOffline = useCallback(async (id: string) => {
    try {
      const local = await getSavedByOrder(id);
      if (local.length > 0) {
        const first = local[0];
        setEvent({
          title: first.eventTitle,
          startDate: first.eventStartDate,
          location: first.eventLocation,
          city: first.eventCity,
        });
        setHolderName(first.holderName);
        setTickets(
          local.map((t) => ({
            id: t.id,
            qrHash: t.qrHash,
            securityCode: t.securityCode,
            category: t.category,
            priceMga: t.priceMga,
            isForResale: t.isForResale,
            isScanned: t.isScanned,
          }))
        );
        setStatus('PAID');
        setOfflineSource(true);
        setSaved(true);
      } else if (!event) {
        setMessage('Billets indisponibles hors-ligne. Reconnectez-vous ou enregistrez-les d’abord.');
      }
    } catch {
      setMessage('Impossible de charger les billets.');
    }
  }, [event]);

  useEffect(() => {
    if (orderId) {
      void load(orderId);
    } else {
      // Aucune commande ciblée : on liste les commandes enregistrées.
      (async () => {
        try {
          const all = await getAllSaved();
          const byOrder = new Map<string, { eventTitle: string; count: number }>();
          for (const t of all) {
            const cur = byOrder.get(t.orderId);
            if (cur) cur.count += 1;
            else byOrder.set(t.orderId, { eventTitle: t.eventTitle, count: 1 });
          }
          setSavedOrders([...byOrder.entries()].map(([id, v]) => ({ orderId: id, ...v })));
        } catch {
          /* IndexedDB indisponible */
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [orderId, load]);

  // -- Sauvegarde hors-ligne ----------------------------------------------
  const handleSaveOffline = useCallback(async () => {
    if (!event || tickets.length === 0) return;
    setSavingOffline(true);
    try {
      const now = new Date().toISOString();
      const records: SavedTicket[] = tickets.map((t) => ({
        id: t.id,
        orderId,
        qrHash: t.qrHash,
        securityCode: t.securityCode,
        category: t.category,
        priceMga: t.priceMga,
        isForResale: t.isForResale,
        isScanned: t.isScanned,
        eventTitle: event.title,
        eventStartDate: event.startDate,
        eventLocation: event.location,
        eventCity: event.city,
        holderName,
        savedAt: now,
      }));
      await saveTickets(records);
      setSaved(true);
      setMessage('Billets enregistrés : accessibles même sans connexion.');
    } catch {
      setMessage('Sauvegarde hors-ligne impossible sur cet appareil.');
    } finally {
      setSavingOffline(false);
    }
  }, [event, tickets, orderId, holderName]);

  // -- Revente -------------------------------------------------------------
  const toggleResale = useCallback(
    async (ticket: DisplayTicket) => {
      if (ticket.isScanned) return;
      setResaleBusy(ticket.id);
      const next = !ticket.isForResale;
      try {
        const res = await fetch(`/api/ticketing/tickets/${ticket.id}/resale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, forResale: next }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setMessage(json.error || 'Action impossible.');
          return;
        }
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, isForResale: next } : t))
        );
        if (saved) await updateSavedTicket(ticket.id, { isForResale: next });
        setMessage(
          next
            ? 'Billet mis en revente au prix officiel.'
            : 'Revente annulée.'
        );
      } catch {
        setMessage('Connexion requise pour la revente.');
      } finally {
        setResaleBusy(null);
      }
    },
    [orderId, saved]
  );

  // ------------------------------------------------------------------------
  // Rendu
  // ------------------------------------------------------------------------
  const eventDate = useMemo(
    () =>
      event
        ? new Date(event.startDate).toLocaleString('fr-MG', { dateStyle: 'long', timeStyle: 'short' })
        : '',
    [event]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Accueil
        </Link>

        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-1 flex items-center gap-2">
          <TicketIcon className="w-5 h-5 text-[#FF6B35]" /> Mes billets
        </h1>

        {loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex justify-center mt-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
          </div>
        ) : !orderId ? (
          <SavedOrdersList
            savedOrders={savedOrders}
            manualOrderId={manualOrderId}
            setManualOrderId={setManualOrderId}
          />
        ) : !event || tickets.length === 0 ? (
          <NotAvailable status={status} message={message} />
        ) : (
          <div className="mt-4 space-y-4">
            {offlineSource && (
              <div className="flex items-center gap-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2 text-[13px] text-[#92400E]">
                <WifiOff className="w-4 h-4" /> Mode hors-ligne — billets enregistrés sur cet appareil.
              </div>
            )}

            {/* En-tête événement */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
              <h2 className="text-[18px] font-semibold text-[#0F172A]">{event.title}</h2>
              <p className="text-[13px] text-[#64748B] mt-1 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> {eventDate}
              </p>
              <p className="text-[13px] text-[#64748B] mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {event.location ? `${event.location} · ` : ''}
                {event.city}
              </p>
              <p className="text-[13px] text-[#64748B] mt-2">Au nom de {holderName}</p>
            </div>

            {/* Sauvegarde hors-ligne */}
            {!offlineSource && (
              <button
                onClick={handleSaveOffline}
                disabled={savingOffline || saved}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] disabled:opacity-60 text-[14px] font-medium text-[#0F172A] transition-all"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" /> Enregistré hors-ligne
                  </>
                ) : savingOffline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#FF6B35]" /> Enregistrer en mode hors-ligne
                  </>
                )}
              </button>
            )}

            {/* Cartes billets */}
            {tickets.map((t, i) => (
              <TicketCard
                key={t.id}
                index={i + 1}
                total={tickets.length}
                ticket={t}
                resaleBusy={resaleBusy === t.id}
                onToggleResale={() => toggleResale(t)}
              />
            ))}

            {message && (
              <p className="text-[12px] text-[#64748B] text-center bg-white border border-[#E2E8F0] rounded-lg py-2 px-3">
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Carte billet
// ----------------------------------------------------------------------------

function TicketCard({
  index,
  total,
  ticket,
  resaleBusy,
  onToggleResale,
}: {
  index: number;
  total: number;
  ticket: DisplayTicket;
  resaleBusy: boolean;
  onToggleResale: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-[#0F172A] text-white">
        <span className="text-[13px] font-medium">{ticket.category}</span>
        <span className="text-[12px] text-white/60">
          Billet {index}/{total}
        </span>
      </div>

      <div className="p-5">
        {ticket.isScanned ? (
          <div className="rounded-lg bg-[#FEF2F2] border border-[#FECACA] p-3 mb-4 text-center text-[13px] text-[#B91C1C] font-medium">
            Billet déjà utilisé (contrôlé à l’entrée)
          </div>
        ) : ticket.isForResale ? (
          <div className="rounded-lg bg-[#FFF7ED] border border-[#FED7AA] p-3 mb-4 text-center text-[13px] text-[#9A3412] font-medium flex items-center justify-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> En vente au prix officiel ({fmtMga(ticket.priceMga)})
          </div>
        ) : null}

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <TicketQr value={ticket.qrHash} dimmed={ticket.isScanned} />
        </div>

        {/* Code de contrôle à 6 chiffres, en très grand */}
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wider text-[#94A3B8] mb-1">Code de contrôle</p>
          <p className="text-[40px] leading-none font-bold tracking-[0.15em] text-[#0F172A] tabular-nums">
            {ticket.securityCode}
          </p>
        </div>

        {/* Revente */}
        {!ticket.isScanned && (
          <button
            onClick={onToggleResale}
            disabled={resaleBusy}
            className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all disabled:opacity-60 ${
              ticket.isForResale
                ? 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEE2E2]'
                : 'bg-[#FFF7ED] text-[#9A3412] border border-[#FED7AA] hover:bg-[#FFEDD5]'
            }`}
          >
            {resaleBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : ticket.isForResale ? (
              'Retirer de la revente'
            ) : (
              <>
                <Tag className="w-3.5 h-3.5" /> Revendre au prix officiel
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TicketQr({ value, dimmed }: { value: string; dimmed?: boolean }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { errorCorrectionLevel: 'M', margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div
      className={`w-[220px] h-[220px] rounded-xl border border-[#E2E8F0] flex items-center justify-center bg-white ${
        dimmed ? 'opacity-40' : ''
      }`}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="QR Code du billet" width={220} height={220} className="rounded-lg" />
      ) : (
        <Loader2 className="w-5 h-5 animate-spin text-[#94A3B8]" />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Vues secondaires
// ----------------------------------------------------------------------------

function SavedOrdersList({
  savedOrders,
  manualOrderId,
  setManualOrderId,
}: {
  savedOrders: { orderId: string; eventTitle: string; count: number }[];
  manualOrderId: string;
  setManualOrderId: (v: string) => void;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        <p className="text-[13px] font-medium text-[#0F172A] mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#FF6B35]" /> Retrouver une commande
        </p>
        <p className="text-[12px] text-[#64748B] mb-3">
          Collez le lien reçu par WhatsApp/SMS ou l’identifiant de votre commande.
        </p>
        <div className="flex gap-2">
          <input
            value={manualOrderId}
            onChange={(e) => setManualOrderId(e.target.value.trim())}
            placeholder="Identifiant de commande"
            className="flex-1 px-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35]"
          />
          <Link
            href={manualOrderId ? `/mes-billets?order=${encodeURIComponent(manualOrderId)}` : '#'}
            aria-disabled={!manualOrderId}
            className={`px-5 py-2.5 rounded-lg bg-[#FF6B35] text-white font-semibold text-[14px] transition-all ${
              manualOrderId ? 'hover:bg-[#F97316]' : 'opacity-40 pointer-events-none'
            }`}
          >
            Ouvrir
          </Link>
        </div>
      </div>

      {savedOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
          <p className="text-[13px] font-medium text-[#0F172A] mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Enregistrés sur cet appareil
          </p>
          <div className="divide-y divide-[#F1F5F9]">
            {savedOrders.map((o) => (
              <Link
                key={o.orderId}
                href={`/mes-billets?order=${encodeURIComponent(o.orderId)}`}
                className="flex items-center justify-between py-3 group"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#0F172A] truncate group-hover:text-[#FF6B35] transition-colors">
                    {o.eventTitle}
                  </p>
                  <p className="text-[12px] text-[#64748B]">
                    {o.count} billet{o.count > 1 ? 's' : ''}
                  </p>
                </div>
                <ArrowLeft className="w-4 h-4 text-[#CBD5E1] rotate-180 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotAvailable({ status, message }: { status: string | null; message: string | null }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center mt-4">
      <div className="w-14 h-14 rounded-xl bg-[#FFF7ED] border border-[#FF6B35]/25 flex items-center justify-center mx-auto mb-4">
        <TicketIcon className="w-6 h-6 text-[#FF6B35]" />
      </div>
      <h2 className="text-[18px] font-semibold text-[#0F172A] mb-2">
        {status && status !== 'PAID' ? 'Paiement non finalisé' : 'Aucun billet à afficher'}
      </h2>
      <p className="text-[14px] text-[#64748B] mb-6">
        {message ||
          (status === 'PENDING'
            ? 'Votre paiement est en attente de confirmation.'
            : 'Cette commande ne contient pas encore de billets disponibles.')}
      </p>
      <Link
        href="/evenements"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] transition-all"
      >
        Découvrir les événements
      </Link>
    </div>
  );
}
