'use client';

// Mada Spot — Admin billetterie : rôles, réseau POS, virements, litiges.
// Espace autonome gardé par la session administrateur (cookie panel admin).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowLeft,
  Users,
  Store,
  Wallet,
  LifeBuoy,
  Search,
  Check,
  X,
  RefreshCw,
  Ban,
  KeyRound,
} from 'lucide-react';

const fmtMga = (n: number | string) =>
  new Intl.NumberFormat('fr-MG').format(Math.round(Number(n))) + ' Ar';

type Tab = 'roles' | 'pos' | 'payouts' | 'disputes';
const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'roles', label: 'Rôles', icon: Users },
  { id: 'pos', label: 'Points de vente', icon: Store },
  { id: 'payouts', label: 'Virements', icon: Wallet },
  { id: 'disputes', label: 'Litiges', icon: LifeBuoy },
];

export default function AdminBilletteriePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [csrf, setCsrf] = useState('');
  const [tab, setTab] = useState<Tab>('roles');

  useEffect(() => {
    (async () => {
      try {
        const [sess, csrfRes] = await Promise.all([
          fetch('/api/admin/session', { cache: 'no-store' }),
          fetch('/api/csrf', { credentials: 'include' }),
        ]);
        if (!sess.ok) {
          router.replace('/admin/login?redirect=/admin/billetterie');
          return;
        }
        const csrfJson = await csrfRes.json().catch(() => ({}));
        setCsrf(csrfJson?.token || '');
        setReady(true);
      } catch {
        router.replace('/admin/login?redirect=/admin/billetterie');
      }
    })();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Panneau admin
        </Link>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-5">
          Régie billetterie
        </h1>

        <nav className="flex gap-1 mb-6 bg-white rounded-xl border border-[#E2E8F0] p-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active ? 'bg-[#FF6B35] text-white' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {tab === 'roles' && <RolesTab csrf={csrf} />}
        {tab === 'pos' && <PosTab csrf={csrf} />}
        {tab === 'payouts' && <PayoutsTab csrf={csrf} />}
        {tab === 'disputes' && <DisputesTab csrf={csrf} />}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Onglet Rôles
// ----------------------------------------------------------------------------

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: string;
}
const ROLE_OPTIONS = ['CLIENT', 'ORGANIZER', 'AGENT', 'POS_VENDOR'];

function RolesTab({ csrf }: { csrf: string }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ticketing/users?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setUsers(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load('');
  }, [load]);

  const setRole = useCallback(
    async (userId: string, role: string) => {
      setMsg(null);
      const res = await fetch('/api/admin/ticketing/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, userId, role }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMsg(json.error || 'Modification impossible.');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      setMsg('Rôle mis à jour.');
    },
    [csrf]
  );

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(q)}
              placeholder="Nom, email ou téléphone…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35]"
            />
          </div>
          <button onClick={() => load(q)} className="px-4 py-2.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[13px] font-medium">
            Rechercher
          </button>
        </div>
        <p className="text-[12px] text-[#94A3B8] mt-2">
          Promouvez un utilisateur en ORGANIZER (créer des billets), AGENT (scanner) ou POS_VENDOR (guichet).
        </p>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
          {users.length === 0 ? (
            <p className="p-4 text-[13px] text-[#64748B]">Aucun utilisateur.</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium text-[#0F172A] truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-[12px] text-[#64748B] truncate">{u.email || u.phone || '—'}</p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => setRole(u.id, e.target.value)}
                  disabled={u.role === 'ADMIN'}
                  className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35] disabled:opacity-50 bg-white"
                >
                  {u.role === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            ))
          )}
        </div>
      )}
      {msg && <Toast msg={msg} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Onglet POS
// ----------------------------------------------------------------------------

interface VendorRow {
  id: string;
  name: string;
  phone: string | null;
  cashBalance: string;
  totalCommissionsEarned: string;
  depositCap: string;
  ordersPaid: number;
  grossSold: string;
}

function PosTab({ csrf }: { csrf: string }) {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ticketing/pos', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setVendors(json.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const adjust = useCallback(
    async (vendorId: string, patch: { cashDelta?: number; commissionDelta?: number; depositCap?: number }) => {
      setMsg(null);
      const res = await fetch('/api/admin/ticketing/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, vendorId, ...patch }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setMsg(json.error || 'Ajustement impossible.');
      } else {
        setMsg('Portefeuille mis à jour.');
      }
      await load();
    },
    [csrf, load]
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-3">
      {vendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[13px] text-[#64748B]">
          Aucun vendeur POS. Promouvez un utilisateur en POS_VENDOR dans l’onglet Rôles.
        </div>
      ) : (
        vendors.map((v) => <PosVendorCard key={v.id} vendor={v} onAdjust={adjust} />)
      )}
      {msg && <Toast msg={msg} />}
    </div>
  );
}

function PosVendorCard({
  vendor,
  onAdjust,
}: {
  vendor: VendorRow;
  onAdjust: (id: string, patch: { cashDelta?: number; commissionDelta?: number; depositCap?: number }) => void;
}) {
  const [amount, setAmount] = useState('');
  const [cap, setCap] = useState('');
  const amt = parseInt(amount, 10);

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold text-[#0F172A]">{vendor.name}</p>
          <p className="text-[12px] text-[#64748B]">{vendor.phone || '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-[16px] font-bold text-[#0F172A] tabular-nums">{fmtMga(vendor.cashBalance)}</p>
          <p className="text-[11px] text-[#94A3B8]">
            plafond {fmtMga(vendor.depositCap)} · comm. {fmtMga(vendor.totalCommissionsEarned)}
          </p>
        </div>
      </div>
      <p className="text-[12px] text-[#64748B] mb-3">
        {vendor.ordersPaid} commande(s) encaissée(s) · {fmtMga(vendor.grossSold)}
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d-]/g, ''))}
          inputMode="numeric"
          placeholder="Montant (Ar)"
          className="w-32 px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]"
        />
        <button
          onClick={() => Number.isFinite(amt) && onAdjust(vendor.id, { cashDelta: amt })}
          className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          Ajuster caisse
        </button>
        <button
          onClick={() => Number.isFinite(amt) && onAdjust(vendor.id, { commissionDelta: amt })}
          className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          Verser commission
        </button>
        <input
          value={cap}
          onChange={(e) => setCap(e.target.value.replace(/\D/g, ''))}
          inputMode="numeric"
          placeholder="Plafond"
          className="w-28 px-2.5 py-2 rounded-lg border border-[#E2E8F0] text-[13px] outline-none focus:border-[#FF6B35]"
        />
        <button
          onClick={() => cap && onAdjust(vendor.id, { depositCap: parseInt(cap, 10) })}
          className="px-3 py-2 rounded-lg border border-[#E2E8F0] text-[13px] text-[#0F172A] hover:bg-[#F8FAFC]"
        >
          Définir plafond
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Onglet Virements
// ----------------------------------------------------------------------------

interface PayoutRow {
  id: string;
  amount: string;
  status: string;
  provider: string;
  mobileMoneyNumber: string;
  organizerName: string;
  organizerPhone: string | null;
  createdAt: string;
}

function PayoutsTab({ csrf }: { csrf: string }) {
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ticketing/payouts', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setRows(json.data);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (id: string, action: 'APPROVE' | 'EXECUTE' | 'REJECT') => {
      setMsg(null);
      const res = await fetch(`/api/admin/ticketing/payouts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) setMsg(json.error || 'Action impossible.');
      await load();
    },
    [csrf, load]
  );

  if (loading) return <Spinner />;

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[13px] text-[#64748B]">
          Aucune demande de virement.
        </div>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-[#0F172A] tabular-nums">{fmtMga(r.amount)}</p>
              <p className="text-[12px] text-[#64748B] truncate">
                {r.organizerName} · {r.provider} · {r.mobileMoneyNumber}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusPill status={r.status} />
              {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                <>
                  {r.status === 'PENDING' && (
                    <button onClick={() => act(r.id, 'APPROVE')} title="Approuver" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1D4ED8] hover:bg-[#EFF6FF]">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => act(r.id, 'EXECUTE')} title="Marquer versé" className="px-3 h-8 rounded-lg text-[12px] font-medium text-white bg-[#10B981] hover:bg-[#059669]">
                    Versé
                  </button>
                  <button onClick={() => act(r.id, 'REJECT')} title="Rejeter" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#DC2626] hover:bg-[#FEF2F2]">
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
      {msg && <Toast msg={msg} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Onglet Litiges
// ----------------------------------------------------------------------------

interface DisputeTicket {
  id: string;
  securityCode: string;
  isScanned: boolean;
  scannedAt: string | null;
  isForResale: boolean;
  category: string;
}
interface DisputeOrder {
  id: string;
  clientName: string;
  clientPhone: string;
  totalAmount: string;
  paymentStatus: string;
  paymentMethod: string;
  channelSource: string;
  transactionRef: string | null;
  eventTitle: string;
  createdAt: string;
  tickets: DisputeTicket[];
}

function DisputesTab({ csrf }: { csrf: string }) {
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState<DisputeOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/admin/ticketing/search?q=${encodeURIComponent(q.trim())}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) setOrders(json.data);
    } finally {
      setLoading(false);
    }
  }, [q]);

  const refund = useCallback(
    async (orderId: string) => {
      setMsg(null);
      const res = await fetch(`/api/admin/ticketing/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf }),
      });
      const json = await res.json();
      setMsg(json.success ? 'Commande remboursée.' : json.error || 'Remboursement impossible.');
      await search();
    },
    [csrf, search]
  );

  const ticketAction = useCallback(
    async (ticketId: string, action: 'REGENERATE' | 'CANCEL') => {
      setMsg(null);
      const res = await fetch(`/api/admin/ticketing/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken: csrf, action }),
      });
      const json = await res.json();
      setMsg(json.success ? (action === 'REGENERATE' ? `Nouveau code : ${json.data.securityCode}` : 'Billet annulé.') : json.error || 'Action impossible.');
      await search();
    },
    [csrf, search]
  );

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Téléphone, nom, code 6 chiffres, réf. transaction…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#E2E8F0] text-[14px] outline-none focus:border-[#FF6B35]"
            />
          </div>
          <button onClick={search} className="px-4 py-2.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[13px] font-medium">
            Rechercher
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : searched && orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center text-[13px] text-[#64748B]">
          Aucune commande trouvée.
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="bg-white rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center justify-between mb-2 gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#0F172A] truncate">{o.eventTitle}</p>
                <p className="text-[12px] text-[#64748B] truncate">
                  {o.clientName} · {o.clientPhone} · {o.paymentMethod} · {o.channelSource}
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  {fmtMga(o.totalAmount)} · {new Date(o.createdAt).toLocaleString('fr-MG')}
                  {o.transactionRef ? ` · ref ${o.transactionRef}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={o.paymentStatus} />
                {o.paymentStatus === 'PAID' && (
                  <button onClick={() => refund(o.id)} className="px-3 h-8 rounded-lg text-[12px] font-medium text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEF2F2]">
                    Rembourser
                  </button>
                )}
              </div>
            </div>

            <div className="divide-y divide-[#F1F5F9] border-t border-[#F1F5F9] mt-2">
              {o.tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] text-[#0F172A]">
                      <span className="font-semibold tabular-nums tracking-wider">{t.securityCode}</span> · {t.category}
                      {t.isScanned && <span className="ml-2 text-[11px] text-[#DC2626]">scanné</span>}
                      {t.isForResale && <span className="ml-2 text-[11px] text-[#9A3412]">revente</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => ticketAction(t.id, 'REGENERATE')} title="Régénérer QR + code" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1D4ED8] hover:bg-[#EFF6FF]">
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {!t.isScanned && (
                      <button onClick={() => ticketAction(t.id, 'CANCEL')} title="Annuler le billet" className="w-8 h-8 rounded-lg flex items-center justify-center text-[#DC2626] hover:bg-[#FEF2F2]">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
      {msg && <Toast msg={msg} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Petits composants partagés
// ----------------------------------------------------------------------------

function Spinner() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-10 flex justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-[#FF6B35]" />
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#0F172A] text-white text-[13px] px-4 py-2.5 rounded-lg shadow-lg">
      <RefreshCw className="w-3.5 h-3.5" /> {msg}
    </div>
  );
}

const STATUS_CLS: Record<string, string> = {
  PENDING: 'bg-[#FFF7ED] text-[#9A3412]',
  PROCESSING: 'bg-[#EFF6FF] text-[#1D4ED8]',
  PAID: 'bg-[#ECFDF5] text-[#047857]',
  APPROVED: 'bg-[#EFF6FF] text-[#1D4ED8]',
  EXECUTED: 'bg-[#ECFDF5] text-[#047857]',
  REJECTED: 'bg-[#FEF2F2] text-[#B91C1C]',
  FAILED: 'bg-[#FEF2F2] text-[#B91C1C]',
  EXPIRED: 'bg-[#F1F5F9] text-[#64748B]',
  REFUNDED: 'bg-[#F5F3FF] text-[#6D28D9]',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[status] || 'bg-[#F1F5F9] text-[#64748B]'}`}>
      {status}
    </span>
  );
}
