'use client';

// Mada Spot — Organisateur : gestion des événements et de leurs types de billets.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Ticket,
  Save,
  X,
  Power,
  ExternalLink,
} from 'lucide-react';

interface OrganizerEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  city: string;
  status: string;
  ticketTypeCount: number;
  capacity: number;
  sold: number;
  fillRate: number;
  grossPaid: string;
}

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/organizer/events', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setEvents(json.data);
      else setError(json.error || 'Chargement impossible.');
    } catch {
      setError('Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center text-[14px] text-[#64748B]">
        {error}
      </div>
    );
  }
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
        <Ticket className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
        <p className="text-[14px] text-[#64748B]">
          Aucun événement à gérer. Les événements que vous soumettez apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
          <button
            onClick={() => setExpanded((cur) => (cur === ev.id ? null : ev.id))}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#0F172A] truncate">{ev.title}</p>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                {new Date(ev.startDate).toLocaleDateString('fr-MG', { dateStyle: 'medium' })} · {ev.city}
                {' · '}
                {ev.sold}/{ev.capacity} vendus ({ev.fillRate}%) · {fmtMga(ev.grossPaid)}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[12px] text-[#94A3B8] hidden sm:inline">
                {ev.ticketTypeCount} type{ev.ticketTypeCount > 1 ? 's' : ''}
              </span>
              {expanded === ev.id ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </div>
          </button>

          {expanded === ev.id && (
            <div className="border-t border-[#F1F5F9] p-4 bg-[#FCFDFE]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium text-[#0F172A]">Types de billets</p>
                <Link
                  href={`/evenements/${ev.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-[12px] text-[#FF6B35] hover:underline"
                >
                  Voir la page <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <TicketTypesManager eventId={ev.id} onChanged={reload} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Gestionnaire de types de billets d'un événement
// ----------------------------------------------------------------------------

interface TicketTypeRow {
  id: string;
  name: string;
  priceMga: string;
  totalQuantity: number;
  remainingQuantity: number;
  maxPerOrder: number;
  salesEnd: string | null;
  isActive: boolean;
  sold: number;
}

function TicketTypesManager({ eventId, onChanged }: { eventId: string; onChanged: () => void }) {
  const [types, setTypes] = useState<TicketTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Formulaire de création
  const [nName, setNName] = useState('');
  const [nPrice, setNPrice] = useState('');
  const [nQty, setNQty] = useState('');
  const [nMax, setNMax] = useState('10');

  // Champs d'édition
  const [eName, setEName] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eQty, setEQty] = useState('');
  const [eMax, setEMax] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/ticket-types`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setTypes(json.data);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async () => {
    const price = parseInt(nPrice, 10);
    const qty = parseInt(nQty, 10);
    const max = parseInt(nMax, 10) || 10;
    if (!nName.trim() || !Number.isFinite(price) || !Number.isFinite(qty) || qty < 1) {
      setMsg('Renseignez un nom, un prix et une quantité valides.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/organizer/events/${eventId}/ticket-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nName.trim(), priceMga: price, totalQuantity: qty, maxPerOrder: max }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMsg(json.error || 'Création impossible.');
        return;
      }
      setNName('');
      setNPrice('');
      setNQty('');
      setNMax('10');
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  }, [eventId, nName, nPrice, nQty, nMax, load, onChanged]);

  const startEdit = (t: TicketTypeRow) => {
    setEditId(t.id);
    setEName(t.name);
    setEPrice(String(Math.round(Number(t.priceMga))));
    setEQty(String(t.totalQuantity));
    setEMax(String(t.maxPerOrder));
    setMsg(null);
  };

  const saveEdit = useCallback(
    async (id: string) => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/organizer/ticket-types/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: eName.trim(),
            priceMga: parseInt(ePrice, 10),
            totalQuantity: parseInt(eQty, 10),
            maxPerOrder: parseInt(eMax, 10),
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setMsg(json.error || 'Modification impossible.');
          return;
        }
        setEditId(null);
        await load();
        onChanged();
      } finally {
        setBusy(false);
      }
    },
    [eName, ePrice, eQty, eMax, load, onChanged]
  );

  const toggleActive = useCallback(
    async (t: TicketTypeRow) => {
      setBusy(true);
      try {
        await fetch(`/api/organizer/ticket-types/${t.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !t.isActive }),
        });
        await load();
      } finally {
        setBusy(false);
      }
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      setBusy(true);
      setMsg(null);
      try {
        const res = await fetch(`/api/organizer/ticket-types/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setMsg(json.error || 'Suppression impossible.');
          return;
        }
        await load();
        onChanged();
      } finally {
        setBusy(false);
      }
    },
    [load, onChanged]
  );

  return (
    <div>
      {loading ? (
        <div className="py-6 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
        </div>
      ) : types.length === 0 ? (
        <p className="text-[13px] text-[#64748B] mb-3">Aucun type de billet. Créez-en un ci-dessous.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {types.map((t) => (
            <div key={t.id} className="rounded-lg border border-[#E2E8F0] bg-white p-3">
              {editId === t.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Nom" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
                    <input value={ePrice} onChange={(e) => setEPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Prix (Ar)" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
                    <input value={eQty} onChange={(e) => setEQty(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Quantité" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
                    <input value={eMax} onChange={(e) => setEMax(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Max/cmd" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(t.id)} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[12px] font-medium disabled:opacity-50">
                      <Save className="w-3.5 h-3.5" /> Enregistrer
                    </button>
                    <button onClick={() => setEditId(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#64748B] text-[12px] font-medium">
                      <X className="w-3.5 h-3.5" /> Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#0F172A] truncate">
                      {t.name}
                      {!t.isActive && <span className="ml-2 text-[11px] text-[#DC2626]">inactif</span>}
                    </p>
                    <p className="text-[12px] text-[#64748B]">
                      {fmtMga(t.priceMga)} · {t.sold} vendus / {t.totalQuantity} · reste {t.remainingQuantity} · max {t.maxPerOrder}/cmd
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(t)} disabled={busy} title={t.isActive ? 'Désactiver' : 'Activer'} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${t.isActive ? 'text-[#10B981] hover:bg-[#ECFDF5]' : 'text-[#94A3B8] hover:bg-[#F8FAFC]'}`}>
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => startEdit(t)} className="px-2.5 h-8 rounded-lg text-[12px] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC]">
                      Modifier
                    </button>
                    <button onClick={() => remove(t.id)} disabled={busy} title="Supprimer" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#DC2626] hover:bg-[#FEF2F2]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Formulaire de création */}
      <div className="rounded-lg border border-dashed border-[#CBD5E1] p-3">
        <p className="text-[12px] font-medium text-[#0F172A] mb-2 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#FF6B35]" /> Ajouter un type de billet
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          <input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Nom (VIP…)" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
          <input value={nPrice} onChange={(e) => setNPrice(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Prix (Ar)" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
          <input value={nQty} onChange={(e) => setNQty(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Quantité" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
          <input value={nMax} onChange={(e) => setNMax(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="Max/cmd" className="px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]" />
        </div>
        <button onClick={create} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[13px] font-medium disabled:opacity-50">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Créer
        </button>
      </div>

      {msg && <p className="text-[12px] text-[#DC2626] mt-2">{msg}</p>}
    </div>
  );
}
