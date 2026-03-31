'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardCheck,
  Trophy,
  ShieldAlert,
  BarChart3,
  Bell,
  Search,
  LogOut,
  X,
  Loader2,
  Building2,
  Flag,
  FileDown,
  MessageSquare,
  CalendarDays,
  ImageIcon,
  FileText,
  Headphones,
  Shield,
  ShieldCheck,
  Eye,
  Trash2,
  Users,
  Zap,
  Radio,
  MousePointer,
  Ticket,
  TrendingUp,
  Copy,
  Clock,
  Menu,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// ---- Dynamic imports for all tab components ----
const DynLoading = () => <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;

const AdminDashboardOverview = dynamic(() => import('@/components/admin/AdminDashboardOverview'), { loading: DynLoading });
const ImportSection = dynamic(() => import('@/components/admin/ImportSection'), { loading: DynLoading });
const EstablishmentModerationList = dynamic(() => import('@/components/admin/EstablishmentModerationList'), { loading: DynLoading });
const ClaimsModeration = dynamic(() => import('@/components/admin/ClaimsModeration'), { loading: DynLoading });
const ReviewModeration = dynamic(() => import('@/components/admin/ReviewModeration'), { loading: DynLoading });
const BookingManagement = dynamic(() => import('@/components/admin/BookingManagement'), { loading: DynLoading });
const ExchangeRateManager = dynamic(() => import('@/components/admin/ExchangeRateManager'), { loading: DynLoading });
const AuditLog = dynamic(() => import('@/components/admin/AuditLog'), { loading: DynLoading });
const ImageManager = dynamic(() => import('@/components/admin/ImageManager'), { loading: DynLoading });
const ModerationPipeline = dynamic(() => import('@/components/admin/ModerationPipeline'), { loading: DynLoading });
const EventCalendar = dynamic(() => import('@/components/admin/EventCalendar'), { loading: DynLoading });
const AdminSupportInbox = dynamic(() => import('@/components/admin/AdminSupportInbox'), { loading: DynLoading });
const GodModeMessaging = dynamic(() => import('@/components/admin/GodModeMessaging'), { loading: DynLoading });
const AccountSimulation = dynamic(() => import('@/components/admin/AccountSimulation'), { loading: DynLoading });
const DBCleanupTool = dynamic(() => import('@/components/admin/DBCleanupTool'), { loading: DynLoading });
const VerificationReview = dynamic(() => import('@/components/admin/VerificationReview'), { loading: DynLoading });
const UserManagement = dynamic(() => import('@/components/admin/UserManagement'), { loading: DynLoading });
const ComplianceTracker = dynamic(() => import('@/components/admin/ComplianceTracker'), { loading: DynLoading });
const RankingManager = dynamic(() => import('@/components/admin/RankingManager'), { loading: DynLoading });
const MessageScanAlerts = dynamic(() => import('@/components/admin/MessageScanAlerts'), { loading: DynLoading });
const LiveOpsPanel = dynamic(() => import('@/components/admin/LiveOpsPanel'), { loading: DynLoading });
const ClickAnalytics = dynamic(() => import('@/components/admin/ClickAnalytics'), { loading: DynLoading });
const SupportTicketManager = dynamic(() => import('@/components/admin/SupportTicketManager'), { loading: DynLoading });
const SEOTrends = dynamic(() => import('@/components/admin/SEOTrends'), { loading: DynLoading });
const DuplicateDetector = dynamic(() => import('@/components/admin/DuplicateDetector'), { loading: DynLoading });
const SlowProviders = dynamic(() => import('@/components/admin/SlowProviders'), { loading: DynLoading });

// ============================================================
// TYPES
// ============================================================
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'moderation', label: 'Moderation', icon: ClipboardCheck, hasBadge: true },
  { id: 'establishments', label: 'Etablissements', icon: Building2, hasBadge: true },
  { id: 'claims', label: 'Revendications', icon: Flag, hasBadge: true },
  { id: 'reviews', label: 'Avis', icon: MessageSquare },
  { id: 'bookings', label: 'Reservations', icon: CalendarDays },
  { id: 'slow-providers', label: 'Prestataires Lents', icon: Clock },
  { id: 'events', label: 'Evenements', icon: CalendarDays },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'godmode', label: 'God Mode', icon: Shield },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'import', label: 'Import', icon: BarChart3 },
  { id: 'ranking', label: 'Classement', icon: Trophy },
  { id: 'nonconformity', label: 'Conformite', icon: ShieldAlert },
  { id: 'simulation', label: 'Simulation', icon: Eye },
  { id: 'cleanup', label: 'Nettoyage', icon: Trash2 },
  { id: 'scanner', label: 'Anti-Contournement', icon: Zap },
  { id: 'liveops', label: 'Live Ops', icon: Radio },
  { id: 'clicks', label: 'Click Analytics', icon: MousePointer },
  { id: 'tickets', label: 'Tickets Support', icon: Ticket },
  { id: 'seo', label: 'SEO Trends', icon: TrendingUp },
  { id: 'duplicates', label: 'Doublons', icon: Copy },
  { id: 'exchange', label: 'Devises', icon: FileText },
  { id: 'audit', label: 'Audit', icon: FileText },
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
];

// ============================================================
// TAB CONTENT MAP
// ============================================================
function TabContent({ tabId, setActiveTab }: { tabId: string; setActiveTab: (t: string) => void }) {
  switch (tabId) {
    case 'dashboard':
      return <AdminDashboardOverview onNavigateTab={setActiveTab} />;
    case 'moderation':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Pipeline de Moderation</h3>
            <p className="text-sm text-gray-500">Validation fiches, lieux fantomes, audit avis &amp; photos</p>
          </div>
          <ModerationPipeline />
        </div>
      );
    case 'import':
      return <ImportSection />;
    case 'establishments':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Gestion des Etablissements</h3>
            <p className="text-sm text-gray-500">Moderation des fiches importees et manuelles</p>
          </div>
          <EstablishmentModerationList />
        </div>
      );
    case 'claims':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Revendications de Fiches</h3>
            <p className="text-sm text-gray-500">Gerer les demandes de revendication des proprietaires</p>
          </div>
          <ClaimsModeration />
        </div>
      );
    case 'reviews':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Moderation des Avis</h3>
            <p className="text-sm text-gray-500">Gerer les avis des etablissements</p>
          </div>
          <ReviewModeration />
        </div>
      );
    case 'bookings':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Gestion des Reservations</h3>
            <p className="text-sm text-gray-500">Suivre et gerer toutes les reservations de la plateforme</p>
          </div>
          <BookingManagement />
        </div>
      );
    case 'slow-providers':
      return <SlowProviders />;
    case 'events':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Calendrier des Evenements</h3>
            <p className="text-sm text-gray-500">Gerer et moderer les evenements de la plateforme</p>
          </div>
          <EventCalendar />
        </div>
      );
    case 'support':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Support — Messagerie</h3>
            <p className="text-sm text-gray-500">Consultez les conversations entre utilisateurs</p>
          </div>
          <AdminSupportInbox />
        </div>
      );
    case 'godmode':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">God Mode — Intervention</h3>
            <p className="text-sm text-gray-500">Intervenir dans les conversations utilisateurs avec audit obligatoire</p>
          </div>
          <GodModeMessaging />
        </div>
      );
    case 'simulation':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Simulation de Compte</h3>
            <p className="text-sm text-gray-500">Rechercher et visualiser un compte utilisateur</p>
          </div>
          <AccountSimulation />
        </div>
      );
    case 'cleanup':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Nettoyage Base de Donnees</h3>
            <p className="text-sm text-gray-500">Identifier et supprimer les donnees obsoletes</p>
          </div>
          <DBCleanupTool />
        </div>
      );
    case 'exchange':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Taux de Change</h3>
            <p className="text-sm text-gray-500">Gerer les taux de conversion MGA/EUR/USD</p>
          </div>
          <ExchangeRateManager />
        </div>
      );
    case 'audit':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Journal d&apos;Audit</h3>
            <p className="text-sm text-gray-500">Tracabilite de toutes les actions administratives</p>
          </div>
          <AuditLog />
        </div>
      );
    case 'images':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Gestion des Images</h3>
            <p className="text-sm text-gray-500">Ajouter, supprimer et gerer les images de chaque attraction</p>
          </div>
          <ImageManager />
        </div>
      );
    case 'users':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Gestion des Utilisateurs</h3>
            <p className="text-sm text-gray-500">Liste, filtrage par type, ban/unban, messagerie directe</p>
          </div>
          <UserManagement />
        </div>
      );
    case 'verification':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Verification des Documents</h3>
            <p className="text-sm text-gray-500">NIF, STAT, Licence d&apos;exploitation, CIN — Approuver ou rejeter</p>
          </div>
          <VerificationReview />
        </div>
      );
    case 'ranking':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Classement des Etablissements</h3>
            <p className="text-sm text-gray-500">Gerez l&apos;ordre d&apos;affichage — qui apparait en 1er, 2e, ... 10000e</p>
          </div>
          <RankingManager />
        </div>
      );
    case 'nonconformity':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Suivi de Conformite</h3>
            <p className="text-sm text-gray-500">Nouveaux inscrits, conformite documentaire, qualite des fiches</p>
          </div>
          <ComplianceTracker />
        </div>
      );
    case 'scanner':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Anti-Contournement</h3>
            <p className="text-sm text-gray-500">Detecter les tentatives de contact hors plateforme (telephone, WhatsApp, email)</p>
          </div>
          <MessageScanAlerts />
        </div>
      );
    case 'liveops':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Live Ops</h3>
            <p className="text-sm text-gray-500">Gerer les pharmacies de garde, contacts d&apos;urgence et alertes meteo</p>
          </div>
          <LiveOpsPanel />
        </div>
      );
    case 'clicks':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Click Analytics</h3>
            <p className="text-sm text-gray-500">Suivre les clics sortants : appels, WhatsApp, emails, sites web</p>
          </div>
          <ClickAnalytics />
        </div>
      );
    case 'tickets':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Tickets Support</h3>
            <p className="text-sm text-gray-500">Gerer les demandes d&apos;assistance des utilisateurs</p>
          </div>
          <SupportTicketManager />
        </div>
      );
    case 'seo':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">SEO Trends</h3>
            <p className="text-sm text-gray-500">Mots-cles recherches, volume de recherche, requetes sans resultat</p>
          </div>
          <SEOTrends />
        </div>
      );
    case 'duplicates':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Detection de Doublons</h3>
            <p className="text-sm text-gray-500">Identifier et fusionner les fiches en double</p>
          </div>
          <DuplicateDetector />
        </div>
      );
    case 'stats':
      return (
        <div>
          <div className="mb-8">
            <h3 className="text-xl font-bold">Statistiques de la Plateforme</h3>
            <p className="text-sm text-gray-500">Performances globales Mada Spot</p>
          </div>
          <div className="mb-8 bg-gray-50 rounded-xl p-4">
            <h4 className="font-medium text-sm mb-3 text-gray-800 flex items-center gap-2"><FileDown className="w-4 h-4" /> Exporter les donnees (CSV)</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { type: 'users', label: 'Utilisateurs' },
                { type: 'establishments', label: 'Etablissements' },
                { type: 'bookings', label: 'Reservations' },
                { type: 'reviews', label: 'Avis' },
              ].map((exp) => (
                <a key={exp.type} href={`/api/admin/export?type=${exp.type}`} className="px-3 py-1.5 bg-white border rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors" download>
                  {exp.label}
                </a>
              ))}
            </div>
          </div>
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Les statistiques detaillees seront affichees ici</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// ============================================================
// MAIN
// ============================================================
export default function AdminControlCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Auth
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        let res = await fetch('/api/admin/session', { credentials: 'include' });
        let data = await res.json();
        if (data.success && data.authenticated) { setIsAuthed(true); return; }
        res = await fetch('/api/auth/session', { credentials: 'include' });
        data = await res.json();
        if (data.success && data.user?.role === 'ADMIN') { setIsAuthed(true); return; }
        router.push('/admin/login');
      } catch { router.push('/admin/login'); }
    };
    checkAuth();
  }, [router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const notifRes = await fetch('/api/notifications?limit=20', { credentials: 'include' });
      if (notifRes.ok) {
        const data = await notifRes.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const markNotificationsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch { /* ignore */ }
  }, [unreadCount]);

  useEffect(() => {
    if (!showNotifDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifDropdown]);

  useEffect(() => {
    if (isAuthed) { fetchNotifications(); setLoading(false); }
  }, [isAuthed, fetchNotifications]);

  if (!isAuthed || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white border border-gray-200 rounded-xl text-gray-700 shadow-md"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-[55]"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`w-72 bg-white border-r border-gray-200 flex flex-col fixed h-full z-[58] transition-transform duration-300 shadow-lg lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Mada Spot" width={40} height={40} className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold">Mada Spot</h1>
              <p className="text-[10px] text-red-400 font-semibold tracking-wider uppercase">Admin Control Center</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Icon className="w-5 h-5" />
                {item.label}
                {item.hasBadge && unreadCount > 0 && (
                  <span className="ml-auto px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={async () => { try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }); } catch {} router.push('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all">
            <LogOut className="w-5 h-5" /> Deconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 ml-10 lg:ml-0">
              <h2 className="text-lg sm:text-2xl font-bold truncate">{NAV_ITEMS.find(n => n.id === activeTab)?.label}</h2>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Centre de controle administrateur</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-orange-500/50 w-48 lg:w-64" />
              </div>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    const willOpen = !showNotifDropdown;
                    setShowNotifDropdown(willOpen);
                    if (willOpen && unreadCount > 0) markNotificationsRead();
                  }}
                  className="relative p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-red-500/30 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>
                  )}
                </button>
                {showNotifDropdown && (
                  <div className="absolute right-0 top-12 w-72 sm:w-80 bg-gray-50 border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Notifications</h4>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markNotificationsRead} className="text-[10px] text-red-400 hover:text-red-300">Tout lire</button>
                        )}
                        <button onClick={() => setShowNotifDropdown(false)} className="p-1 rounded hover:bg-[#1e1e2e]" aria-label="Fermer les notifications">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className={`p-4 border-b border-gray-200 hover:bg-gray-50 ${!n.isRead ? 'bg-red-500/5' : ''}`}>
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Aucune notification</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs">AD</div>
                <span className="text-sm font-medium hidden sm:inline">Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <TabContent tabId={activeTab} setActiveTab={setActiveTab} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
