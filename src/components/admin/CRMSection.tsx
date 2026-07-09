'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, Search, Plus, Mail, MessageCircle, Users, UserPlus, Inbox,
  Send, CalendarClock, CheckCircle2, AlertCircle,
  Facebook, Phone, Smartphone, X, RefreshCw,
  TrendingUp, Trash2, Upload, Paperclip, ArrowDownUp, FileText,
} from 'lucide-react';

type Channel = 'EMAIL' | 'MESSENGER' | 'IN_APP' | 'PHONE' | 'WHATSAPP' | 'SMS';
type ProspectStatus = 'NEW' | 'CONTACTED' | 'ENGAGED' | 'QUALIFIED' | 'CONVERTED' | 'UNRESPONSIVE' | 'UNSUBSCRIBED' | 'REJECTED';
type ConversationStatus = 'OPEN' | 'PENDING' | 'ON_HOLD' | 'CLOSED';

interface Stats {
  totals: {
    clients: number;
    activeClients: number;
    newClients30d: number;
    prospects: number;
    newProspects7d: number;
    newsletterSubs: number;
    openConversations: number;
    unreadConversations: number;
    overdueFollowUps: number;
  };
  conversationsByChannel: { channel: Channel; count: number }[];
  prospectsByStatus: { status: ProspectStatus; count: number }[];
  prospectsBySource: { source: string; count: number }[];
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  isBanned: boolean;
  emailVerified: boolean;
  loyaltyPoints: number;
  createdAt: string;
  lastLoginAt: string | null;
  clientProfile: { city: string | null; district: string | null } | null;
  _count: { bookings: number; conversations: number; establishmentReviews: number; establishmentFavorites: number; contactNotes: number };
}

interface Prospect {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  facebookName: string | null;
  city: string | null;
  status: ProspectStatus;
  source: string;
  score: number;
  preferredChannel: Channel;
  optInEmail: boolean;
  optInMessenger: boolean;
  lastContactedAt: string | null;
  lastInboundAt: string | null;
  contactAttempts: number;
  createdAt: string;
  owner: { id: string; firstName: string; lastName: string } | null;
  tags: { tag: { id: string; name: string; color: string | null } }[];
  _count: { conversations: number; notes: number; followUps: number };
}

interface ConversationListItem {
  id: string;
  channel: Channel;
  status: ConversationStatus;
  isUnread: boolean;
  subject: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  user: { id: string; firstName: string; lastName: string; email: string | null; avatar: string | null } | null;
  prospect: { id: string; firstName: string | null; lastName: string | null; email: string | null; facebookName: string | null; status: ProspectStatus } | null;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  _count: { messages: number };
}

interface ConversationDetail extends ConversationListItem {
  user: any;
  prospect: any;
  messages: {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    channel: Channel;
    content: string;
    createdAt: string;
    isDelivered: boolean;
    errorMessage: string | null;
    authorAdmin: { firstName: string; lastName: string } | null;
  }[];
}

interface FollowUp {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  status: 'PENDING' | 'DONE' | 'SKIPPED' | 'OVERDUE';
  prospect: { id: string; firstName: string | null; lastName: string | null; email: string | null; facebookName: string | null } | null;
  user: { id: string; firstName: string; lastName: string; email: string | null } | null;
  owner: { firstName: string; lastName: string } | null;
}

const CHANNEL_LABEL: Record<Channel, string> = {
  EMAIL: 'Email', MESSENGER: 'Messenger', IN_APP: 'Chat interne', PHONE: 'Téléphone', WHATSAPP: 'WhatsApp', SMS: 'SMS',
};

const CHANNEL_ICON: Record<Channel, any> = {
  EMAIL: Mail, MESSENGER: Facebook, IN_APP: MessageCircle, PHONE: Phone, WHATSAPP: Smartphone, SMS: Smartphone,
};

const STATUS_COLOR: Record<ProspectStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-amber-100 text-amber-700',
  ENGAGED: 'bg-purple-100 text-purple-700',
  QUALIFIED: 'bg-emerald-100 text-emerald-700',
  CONVERTED: 'bg-green-100 text-green-700',
  UNRESPONSIVE: 'bg-gray-100 text-gray-600',
  UNSUBSCRIBED: 'bg-red-100 text-red-700',
  REJECTED: 'bg-zinc-100 text-zinc-600',
};

type Tab = 'overview' | 'clients' | 'prospects' | 'inbox' | 'followups';

export default function CRMSection({ onOpenContact }: { onOpenContact?: (email: string) => void } = {}) {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')} icon={TrendingUp} label="Vue d'ensemble" />
        <TabBtn active={tab === 'inbox'} onClick={() => setTab('inbox')} icon={Inbox} label="Boîte de réception" />
        <TabBtn active={tab === 'clients'} onClick={() => setTab('clients')} icon={Users} label="Clients" />
        <TabBtn active={tab === 'prospects'} onClick={() => setTab('prospects')} icon={UserPlus} label="Prospects" />
        <TabBtn active={tab === 'followups'} onClick={() => setTab('followups')} icon={CalendarClock} label="Suivis" />
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'inbox' && <InboxTab onOpenContact={onOpenContact} />}
      {tab === 'clients' && <ClientsTab />}
      {tab === 'prospects' && <ProspectsTab />}
      {tab === 'followups' && <FollowUpsTab />}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg whitespace-nowrap transition-colors ${
        active ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

// ============================================================================
// VUE D'ENSEMBLE
// ============================================================================
function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/stats', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setStats(data.data);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <Spinner />;
  if (!stats) return <Empty msg="Aucune donnée" />;

  const t = stats.totals;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Clients inscrits" value={t.clients} sub={`+${t.newClients30d} sur 30j`} accent="text-emerald-600" />
        <KPI label="Prospects" value={t.prospects} sub={`+${t.newProspects7d} cette semaine`} accent="text-blue-600" />
        <KPI label="Newsletter" value={t.newsletterSubs} sub="Abonnés actifs" accent="text-purple-600" />
        <KPI label="Conv. ouvertes" value={t.openConversations} sub={`${t.unreadConversations} non lus`} accent="text-orange-600" />
      </div>

      {t.overdueFollowUps > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">
            <strong>{t.overdueFollowUps}</strong> relance{t.overdueFollowUps > 1 ? 's' : ''} en retard. Pense à nettoyer la file.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Conversations par canal">
          {stats.conversationsByChannel.length === 0 ? <Empty msg="Pas encore de conversations" /> :
            stats.conversationsByChannel.map(c => (
              <Row key={c.channel} label={CHANNEL_LABEL[c.channel]} value={c.count} />
            ))
          }
        </Card>
        <Card title="Prospects par statut">
          {stats.prospectsByStatus.map(p => (
            <Row key={p.status} label={p.status} value={p.count} pillClass={STATUS_COLOR[p.status]} />
          ))}
        </Card>
        <Card title="Sources d'acquisition">
          {stats.prospectsBySource.map(p => (
            <Row key={p.source} label={p.source} value={p.count} />
          ))}
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: string }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${accent || 'text-gray-900'}`}>{value.toLocaleString('fr-FR')}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200">
      <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ label, value, pillClass }: { label: string; value: number; pillClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={pillClass ? `px-2 py-0.5 rounded-full text-xs ${pillClass}` : 'text-gray-700'}>{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ============================================================================
// BOÎTE DE RÉCEPTION UNIFIÉE
// ============================================================================
// Nettoie le corps d'un e-mail entrant : coupe les citations/signatures, masque les liens de tracking.
function cleanEmailBody(raw: string): { text: string; truncated: boolean } {
  if (!raw) return { text: '', truncated: false };
  const lines = raw.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  let truncated = false;
  for (const line of lines) {
    const t = line.trim();
    if (/^>/.test(t)) { truncated = true; break; }
    if (/^Le .+ a écrit\s*:?$/i.test(t)) { truncated = true; break; }
    if (/^On .+ wrote:?$/i.test(t)) { truncated = true; break; }
    if (/^-{3,}\s*(message|original)/i.test(t)) { truncated = true; break; }
    if (/vous recevez ce message car/i.test(t)) { truncated = true; break; }
    if (/^se d[ée]sinscrire/i.test(t)) { truncated = true; break; }
    if (/^<https?:\/\/\S+>$/.test(t)) { truncated = true; continue; } // ligne = URL de tracking seule
    out.push(line);
  }
  const text = out
    .join('\n')
    .replace(/<(https?:\/\/[^>]+)>/g, '') // <url> => rien
    .replace(/https?:\/\/\S{70,}/g, '🔗') // URL de tracking très longue => icône
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, truncated };
}

function parseAttachments(raw: unknown): { url: string; type?: string; name?: string }[] {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}

function MessageBubble({ m }: { m: any }) {
  const [showRaw, setShowRaw] = useState(false);
  const isOut = m.direction === 'OUTBOUND';
  const cleaned = isOut ? { text: m.content, truncated: false } : cleanEmailBody(m.content);
  const attachments = parseAttachments(m.attachments);
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${isOut ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white' : 'bg-white text-gray-900 border border-gray-200'}`}>
        <div className="whitespace-pre-wrap break-words leading-relaxed">{showRaw ? m.content : (cleaned.text || '(vide)')}</div>
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            {attachments.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs underline ${isOut ? 'text-white/90' : 'text-orange-600'}`}>
                {(a.type || '').startsWith('image') ? <img src={a.url} alt="" className="max-h-32 rounded-lg" /> : <><FileText className="w-3.5 h-3.5" /> {a.name || 'pièce jointe'}</>}
              </a>
            ))}
          </div>
        )}
        {cleaned.truncated && (
          <button onClick={() => setShowRaw(v => !v)} className={`text-[10px] mt-1 underline ${isOut ? 'text-white/80' : 'text-gray-400'}`}>
            {showRaw ? 'Masquer' : 'Voir l\'original'}
          </button>
        )}
        <div className={`text-[10px] mt-1 ${isOut ? 'text-white/80' : 'text-gray-400'}`}>
          {new Date(m.createdAt).toLocaleString('fr-FR')}
          {isOut && (m.isDelivered ? ' · Envoyé' : ' · ⚠ non envoyé')}
          {m.errorMessage && <span title={m.errorMessage}> · ⚠</span>}
        </div>
      </div>
    </div>
  );
}

function InboxTab({ onOpenContact }: { onOpenContact?: (email: string) => void }) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [filterChannel, setFilterChannel] = useState<'all' | Channel>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'az' | 'za'>('recent');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactLabel = (it: ConversationListItem) =>
    (it.user ? `${it.user.firstName} ${it.user.lastName}` : `${it.prospect?.firstName || ''} ${it.prospect?.lastName || ''}`.trim() || it.prospect?.facebookName || it.prospect?.email || '—');

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    if (sortBy === 'old') return new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime();
    const cmp = contactLabel(a).localeCompare(contactLabel(b), 'fr', { sensitivity: 'base' });
    return sortBy === 'az' ? cmp : -cmp;
  });

  const uploadAttachment = async (file: File) => {
    setUploading(true);
    setSendError(null);
    try {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include' });
      const csrf = (await csrfRes.json())?.token || '';
      const fd = new FormData();
      fd.append('files', file);
      fd.append('csrfToken', csrf);
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: fd });
      const data = await res.json();
      const url = data?.files?.[0]?.url;
      if (url) setDraft(d => (d ? d + '\n' : '') + url);
      else setSendError(data?.error || 'Échec de l\'envoi du fichier');
    } catch {
      setSendError('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterChannel !== 'all') params.set('channel', filterChannel);
      if (unreadOnly) params.set('unread', '1');
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/crm/conversations?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.data.items);
      }
    } finally { setLoading(false); }
  }, [filterChannel, unreadOnly, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const loadDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setSendError(null);
    try {
      const res = await fetch(`/api/admin/crm/conversations/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setDetail(data.data);
        setItems(prev => prev.map(it => it.id === id ? { ...it, isUnread: false } : it));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (detail) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail]);

  const sendMessage = async () => {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/admin/crm/conversations/${selectedId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSendError(data.error || 'Échec envoi');
      } else {
        setDraft('');
        if (data.data?.errorMessage) setSendError(data.data.errorMessage);
        await loadDetail(selectedId);
        await refresh();
      }
    } catch (e) {
      setSendError('Erreur réseau');
    } finally { setSending(false); }
  };

  return (
    <div className="grid md:grid-cols-[380px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Liste */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterChannel}
              onChange={e => setFilterChannel(e.target.value as any)}
              className="text-xs px-2 py-1 rounded-md border border-gray-200"
            >
              <option value="all">Tous canaux</option>
              <option value="EMAIL">Email</option>
              <option value="MESSENGER">Messenger</option>
              <option value="IN_APP">Chat interne</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PHONE">Téléphone</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-gray-600">
              <input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} />
              Non lus
            </label>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ArrowDownUp className="w-3.5 h-3.5" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="text-xs px-1.5 py-1 rounded-md border border-gray-200">
                <option value="recent">Récent</option>
                <option value="old">Ancien</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            </div>
            <button onClick={refresh} className="ml-auto p-1 rounded hover:bg-gray-100" title="Rafraîchir">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? <Spinner /> :
            sortedItems.length === 0 ? <Empty msg="Aucune conversation" /> :
            sortedItems.map(it => {
              const ChannelIcon = CHANNEL_ICON[it.channel];
              const contactName = it.user
                ? `${it.user.firstName} ${it.user.lastName}`
                : (it.prospect
                    ? `${it.prospect.firstName || ''} ${it.prospect.lastName || ''}`.trim() || it.prospect.facebookName || it.prospect.email || 'Prospect'
                    : '—');
              return (
                <button
                  key={it.id}
                  onClick={() => loadDetail(it.id)}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedId === it.id ? 'bg-orange-50' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <ChannelIcon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${it.isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {contactName}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(it.lastMessageAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {it.lastMessagePreview || 'Aucun message'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {it.isUnread && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                        <span className="text-[10px] text-gray-400">{CHANNEL_LABEL[it.channel]}</span>
                        {it.user ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Client</span> :
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Prospect</span>}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          }
        </div>
      </div>

      {/* Détail */}
      <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!detail ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Inbox className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Sélectionne une conversation pour l'afficher</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-gray-200 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {detail.user ? `${detail.user.firstName} ${detail.user.lastName}` :
                    `${detail.prospect?.firstName || ''} ${detail.prospect?.lastName || ''}`.trim() || detail.prospect?.facebookName || detail.prospect?.email || 'Contact'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {CHANNEL_LABEL[detail.channel]} · {detail.user?.email || detail.prospect?.email || detail.prospect?.messengerPsid || ''}
                </p>
              </div>
              {onOpenContact && (detail.user?.email || detail.prospect?.email) && (
                <button
                  onClick={() => onOpenContact((detail.user?.email || detail.prospect?.email) as string)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 whitespace-nowrap"
                  title="Ouvrir la fiche 360° du contact"
                >
                  Fiche 360°
                </button>
              )}
              <select
                value={detail.status}
                onChange={async (e) => {
                  await fetch(`/api/admin/crm/conversations/${detail.id}`, {
                    method: 'PATCH', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: e.target.value }),
                  });
                  loadDetail(detail.id);
                }}
                className="text-xs px-2 py-1 rounded border border-gray-200"
              >
                <option value="OPEN">Ouverte</option>
                <option value="PENDING">En attente</option>
                <option value="ON_HOLD">En pause</option>
                <option value="CLOSED">Fermée</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {detail.messages.map(m => <MessageBubble key={m.id} m={m} />)}
              <div ref={messagesEndRef} />
            </div>

            {sendError && (
              <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-t border-red-200">⚠ {sendError}</div>
            )}

            <div className="p-3 border-t border-gray-200 flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,.doc,.docx"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Joindre une photo / un PDF"
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </button>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendMessage();
                }}
                rows={2}
                spellCheck
                lang="fr"
                autoCorrect="on"
                placeholder={`Répondre via ${CHANNEL_LABEL[detail.channel]}... (Ctrl+Entrée pour envoyer)`}
                className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !draft.trim()}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-white text-sm bg-gradient-to-r from-orange-500 to-pink-500 disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CLIENTS
// ============================================================================
function ClientsTab() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const refresh = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status });
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/crm/clients?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.data.items);
      }
    } finally { setLoading(false); }
  }, [status, search]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Nom, email, téléphone..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400"
          />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200">
          <option value="all">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="banned">Bannis</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Client</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Ville</th>
              <th className="text-center px-4 py-3">Réservations</th>
              <th className="text-center px-4 py-3">Conv.</th>
              <th className="text-center px-4 py-3">Points</th>
              <th className="text-left px-4 py-3">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8"><Spinner /></td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-8"><Empty msg="Aucun client" /></td></tr>
            ) : items.map(c => (
              <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                  {c.isBanned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">Banni</span>}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</div>}
                  {c.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" /> {c.phone}</div>}
                </td>
                <td className="px-4 py-3 text-gray-700">{c.clientProfile?.city || '—'}</td>
                <td className="px-4 py-3 text-center">{c._count.bookings}</td>
                <td className="px-4 py-3 text-center">{c._count.conversations}</td>
                <td className="px-4 py-3 text-center font-semibold text-orange-600">{c.loyaltyPoints}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// PROSPECTS
// ============================================================================
function ProspectsTab() {
  const [items, setItems] = useState<Prospect[]>([]);
  const [newsletterOrphans, setNewsletterOrphans] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter, source: sourceFilter, includeNewsletter: '1' });
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/crm/prospects?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.data.items);
        setNewsletterOrphans(data.data.newsletterOrphans);
      }
    } finally { setLoading(false); }
  }, [statusFilter, sourceFilter, search]);

  useEffect(() => { refresh(); }, [refresh]);

  const importFromNewsletter = async () => {
    const res = await fetch('/api/admin/crm/prospects/import', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromNewsletter: true }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Importé : ${data.data.created}, ignorés : ${data.data.skipped}`);
      refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Email, nom, entreprise..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-orange-400"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200">
          <option value="all">Tous statuts</option>
          <option value="NEW">Nouveau</option>
          <option value="CONTACTED">Contacté</option>
          <option value="ENGAGED">Engagé</option>
          <option value="QUALIFIED">Qualifié</option>
          <option value="CONVERTED">Converti</option>
          <option value="UNRESPONSIVE">Pas de réponse</option>
          <option value="UNSUBSCRIBED">Désinscrit</option>
        </select>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="text-sm px-3 py-2 rounded-lg border border-gray-200">
          <option value="all">Toutes sources</option>
          <option value="NEWSLETTER">Newsletter</option>
          <option value="CONTACT_FORM">Formulaire contact</option>
          <option value="CSV_IMPORT">Import CSV</option>
          <option value="MESSENGER">Messenger</option>
          <option value="MANUAL">Manuel</option>
          <option value="EVENT">Événement</option>
          <option value="REFERRAL">Parrainage</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm">
          <Plus className="w-4 h-4" /> Nouveau
        </button>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-sm">
          <Upload className="w-4 h-4" /> Importer
        </button>
      </div>

      {newsletterOrphans.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <Mail className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-900 flex-1">
            <strong>{newsletterOrphans.length}</strong> abonnés newsletter ne sont pas encore dans ton CRM.
          </p>
          <button onClick={importFromNewsletter} className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white">
            Tous les importer
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-center px-4 py-3">Tentatives</th>
              <th className="text-left px-4 py-3">Dernier contact</th>
              <th className="text-left px-4 py-3">Owner</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="p-8"><Spinner /></td></tr> :
              items.length === 0 ? <tr><td colSpan={7} className="p-8"><Empty msg="Aucun prospect" /></td></tr> :
              items.map(p => (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {`${p.firstName || ''} ${p.lastName || ''}`.trim() || p.facebookName || p.email || '—'}
                    </div>
                    <div className="text-xs text-gray-500">{p.email || p.phone || '—'}</div>
                    {p.company && <div className="text-xs text-gray-400">{p.company}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{p.source}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">{p.contactAttempts}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.lastContactedAt ? new Date(p.lastContactedAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={async () => {
                        if (!confirm('Supprimer ce prospect ?')) return;
                        await fetch(`/api/admin/crm/prospects/${p.id}`, { method: 'DELETE', credentials: 'include' });
                        refresh();
                      }}
                      className="p-1 rounded hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showCreate && <CreateProspectModal onClose={() => setShowCreate(false)} onCreated={refresh} />}
      {showImport && <ImportProspectsModal onClose={() => setShowImport(false)} onImported={refresh} />}
    </div>
  );
}

function CreateProspectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', phone: '', firstName: '', lastName: '', company: '', city: '', source: 'MANUAL', sourceNote: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.email && !form.phone) { setError('Email ou téléphone requis'); return; }
    setSaving(true); setError(null);
    const res = await fetch('/api/admin/crm/prospects', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || 'Erreur');
    else { onCreated(); onClose(); }
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} title="Nouveau prospect">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <Input label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <Input label="Prénom" value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} />
        <Input label="Nom" value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} />
        <Input label="Entreprise" value={form.company} onChange={v => setForm({ ...form, company: v })} />
        <Input label="Ville" value={form.city} onChange={v => setForm({ ...form, city: v })} />
        <div className="col-span-2">
          <label className="text-xs text-gray-500">Source</label>
          <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm">
            <option value="MANUAL">Manuel</option>
            <option value="CONTACT_FORM">Formulaire contact</option>
            <option value="EVENT">Événement</option>
            <option value="REFERRAL">Parrainage</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-gray-500">Note source</label>
          <textarea value={form.sourceNote} onChange={e => setForm({ ...form, sourceNote: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
        </div>
      </div>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-gray-200">Annuler</button>
        <button onClick={submit} disabled={saving} className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

function ImportProspectsModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [csv, setCsv] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);

  const submit = async () => {
    setImporting(true);
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) { setImporting(false); return; }
    // Format attendu : email,firstName,lastName,phone,company,city  (header optionnel)
    const headerCandidate = lines[0].toLowerCase();
    const hasHeader = headerCandidate.includes('email') || headerCandidate.includes('mail');
    const data = (hasHeader ? lines.slice(1) : lines).map(line => {
      const [email = '', firstName = '', lastName = '', phone = '', company = '', city = ''] = line.split(',').map(s => s.trim());
      return { email, firstName, lastName, phone, company, city };
    });
    const res = await fetch('/api/admin/crm/prospects/import', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: data, defaultSource: 'CSV_IMPORT' }),
    });
    const json = await res.json();
    setResult(json.data);
    setImporting(false);
    if (res.ok) onImported();
  };

  return (
    <Modal onClose={onClose} title="Importer des prospects (CSV)">
      <p className="text-xs text-gray-500 mb-2">Format : <code>email,firstName,lastName,phone,company,city</code> (1 par ligne, en-tête optionnel).</p>
      <textarea value={csv} onChange={e => setCsv(e.target.value)} rows={10} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
        placeholder="email,firstName,lastName,phone,company,city&#10;jean@x.fr,Jean,Dupont,+33...,Acme,Paris"
      />
      {result && (
        <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
          ✓ Créés : <strong>{result.created}</strong> · Ignorés : {result.skipped}
          {result.errors.length > 0 && <details className="mt-1"><summary className="text-xs cursor-pointer">{result.errors.length} erreurs</summary>
            <ul className="text-xs mt-1">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </details>}
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-gray-200">Fermer</button>
        <button onClick={submit} disabled={importing || !csv.trim()} className="px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white disabled:opacity-50">
          {importing ? 'Import...' : 'Importer'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================================
// SUIVIS / FOLLOW-UPS
// ============================================================================
function FollowUpsTab() {
  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'overdue' | 'done' | 'all'>('pending');

  const refresh = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === 'pending') params.set('status', 'PENDING');
    if (filter === 'overdue') params.set('overdue', '1');
    if (filter === 'done') params.set('status', 'DONE');
    try {
      const res = await fetch(`/api/admin/crm/follow-ups?${params}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setItems(data.data);
      }
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const markDone = async (id: string) => {
    await fetch('/api/admin/crm/follow-ups', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'DONE' }),
    });
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['pending', 'overdue', 'done', 'all'] as const).map(k => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full ${filter === k ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {k === 'pending' ? 'En cours' : k === 'overdue' ? 'En retard' : k === 'done' ? 'Terminés' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> :
        items.length === 0 ? <Empty msg="Aucun suivi" /> :
        <div className="space-y-2">
          {items.map(f => {
            const due = new Date(f.dueAt);
            const isOverdue = f.status === 'PENDING' && due < new Date();
            const contact = f.prospect
              ? `${f.prospect.firstName || ''} ${f.prospect.lastName || ''}`.trim() || f.prospect.facebookName || f.prospect.email || 'Prospect'
              : f.user ? `${f.user.firstName} ${f.user.lastName}` : '—';
            return (
              <div key={f.id} className={`p-3 rounded-xl border bg-white flex items-center gap-3 ${isOverdue ? 'border-red-300' : 'border-gray-200'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{f.title}</p>
                    {isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">En retard</span>}
                    {f.status === 'DONE' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Fait</span>}
                  </div>
                  {f.description && <p className="text-xs text-gray-500 truncate">{f.description}</p>}
                  <div className="text-xs text-gray-500 mt-1">
                    <CalendarClock className="inline w-3 h-3 mr-1" />
                    {due.toLocaleString('fr-FR')} · Pour : <strong>{contact}</strong>
                    {f.owner && <> · Owner : {f.owner.firstName}</>}
                  </div>
                </div>
                {f.status === 'PENDING' && (
                  <button onClick={() => markDone(f.id)} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Marquer fait
                  </button>
                )}
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ============================================================================
// PRIMITIVES
// ============================================================================
function Spinner() {
  return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;
}
function Empty({ msg }: { msg: string }) {
  return <div className="text-center p-8 text-sm text-gray-400">{msg}</div>;
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-gray-500">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-orange-400" />
    </div>
  );
}
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
