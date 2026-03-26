'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Building2,
  CalendarDays,
  Eye,
  MessageSquare,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Flag,
  CalendarCheck,
  Trophy,
  MapPin,
  Activity,
  Mail,
  Map,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AdminHeatmap = dynamic(() => import('@/components/admin/AdminHeatmap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[400px]"><div className="w-6 h-6 border-2 border-gray-600 border-t-[#ff6b35] rounded-full animate-spin" /></div>,
});
import type {
  AdminStatsResponse,
} from '@/types/admin-dashboard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface AdminDashboardOverviewProps {
  onNavigateTab: (tabId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const formatNumber = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

const formatTrend = (t: number) =>
  t > 0 ? `+${t.toFixed(1)}%` : `${t.toFixed(1)}%`;

const timeAgo = (date: string): string => {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "a l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
};

const BREAKDOWN_COLORS: Record<string, string> = {
  HOTEL: '#3b82f6',
  RESTAURANT: '#f97316',
  ATTRACTION: '#10b981',
  PROVIDER: '#8b5cf6',
};

const BREAKDOWN_LABELS: Record<string, string> = {
  HOTEL: 'Hotels',
  RESTAURANT: 'Restaurants',
  ATTRACTION: 'Attractions',
  PROVIDER: 'Prestataires',
};

const ACTION_ICONS: Record<string, typeof Activity> = {
  create: ArrowUpRight,
  update: Activity,
  delete: AlertTriangle,
  approve: ShieldCheck,
  reject: Flag,
  login: Users,
  logout: Users,
};

const TYPE_COLORS: Record<string, string> = {
  CLIENT: '#06b6d4',
  HOTEL: '#3b82f6',
  RESTAURANT: '#f97316',
  ATTRACTION: '#10b981',
  PROVIDER: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  CLIENT: 'Voyageurs',
  HOTEL: 'Hotels',
  RESTAURANT: 'Restaurants',
  ATTRACTION: 'Attractions',
  PROVIDER: 'Prestataires',
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#1a1a2e] ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonPulse key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonPulse key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonPulse className="lg:col-span-2 h-64" />
        <SkeletonPulse className="h-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonPulse className="h-72" />
        <SkeletonPulse className="h-72" />
      </div>
      <SkeletonPulse className="h-72" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonPulse className="h-80" />
        <SkeletonPulse className="h-80" />
      </div>
    </div>
  );
}

/** Custom SVG bar chart */
function BarChart({
  data,
  color = '#ef4444',
  height = 200,
  formatValue,
  showLabels = true,
}: {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (v: number) => string;
  showLabels?: boolean;
}) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min(40, Math.max(16, Math.floor(600 / data.length) - 8));
  const chartWidth = data.length * (barWidth + 8) + 40;
  const chartHeight = height;
  const paddingBottom = showLabels ? 40 : 16;
  const paddingTop = 28;
  const drawH = chartHeight - paddingBottom - paddingTop;

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`bar-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.9} />
          <stop offset="100%" stopColor={color} stopOpacity={0.4} />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const barH = max > 0 ? (d.value / max) * drawH : 0;
        const x = 20 + i * (barWidth + 8);
        const y = paddingTop + drawH - barH;
        return (
          <g key={i}>
            <motion.rect
              x={x}
              y={paddingTop + drawH}
              width={barWidth}
              rx={4}
              fill={`url(#bar-grad-${color.replace('#', '')})`}
              initial={{ height: 0, y: paddingTop + drawH }}
              animate={{ height: barH, y }}
              transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
            />
            {d.value > 0 && (
              <motion.text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-gray-400"
                fontSize={9}
                fontWeight={500}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 + 0.3 }}
              >
                {formatValue ? formatValue(d.value) : formatNumber(d.value)}
              </motion.text>
            )}
            {showLabels && (
              <text
                x={x + barWidth / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize={9}
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
      <line
        x1={16}
        y1={paddingTop + drawH}
        x2={chartWidth - 4}
        y2={paddingTop + drawH}
        stroke="#2a2a3e"
        strokeWidth={1}
      />
    </svg>
  );
}

/** Stacked bar chart for user growth by type */
function StackedBarChart({
  data,
  height = 200,
}: {
  data: { date: string; CLIENT: number; HOTEL: number; RESTAURANT: number; ATTRACTION: number; PROVIDER: number }[];
  height?: number;
}) {
  if (!data.length) return null;
  const types = ['CLIENT', 'HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'] as const;
  const maxTotal = Math.max(...data.map((d) => types.reduce((sum, t) => sum + d[t], 0)), 1);
  const barWidth = Math.min(40, Math.max(16, Math.floor(600 / data.length) - 8));
  const chartWidth = data.length * (barWidth + 8) + 40;
  const chartHeight = height;
  const paddingBottom = 40;
  const paddingTop = 28;
  const drawH = chartHeight - paddingBottom - paddingTop;

  return (
    <div>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {data.map((d, i) => {
          const x = 20 + i * (barWidth + 8);
          let yOffset = 0;
          const total = types.reduce((sum, t) => sum + d[t], 0);
          return (
            <g key={i}>
              {types.map((type) => {
                const val = d[type];
                if (val === 0) return null;
                const barH = (val / maxTotal) * drawH;
                const y = paddingTop + drawH - yOffset - barH;
                yOffset += barH;
                return (
                  <motion.rect
                    key={type}
                    x={x}
                    width={barWidth}
                    rx={2}
                    fill={TYPE_COLORS[type]}
                    fillOpacity={0.8}
                    initial={{ height: 0, y: paddingTop + drawH }}
                    animate={{ height: barH, y }}
                    transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
                  />
                );
              })}
              {total > 0 && (
                <motion.text
                  x={x + barWidth / 2}
                  y={paddingTop + drawH - yOffset - 6}
                  textAnchor="middle"
                  className="fill-gray-400"
                  fontSize={9}
                  fontWeight={500}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 + 0.3 }}
                >
                  {total}
                </motion.text>
              )}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 8}
                textAnchor="middle"
                className="fill-gray-500"
                fontSize={9}
              >
                {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          );
        })}
        <line
          x1={16}
          y1={paddingTop + drawH}
          x2={chartWidth - 4}
          y2={paddingTop + drawH}
          stroke="#2a2a3e"
          strokeWidth={1}
        />
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {types.map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type] }} />
            <span className="text-xs text-gray-400">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendBadge({ value }: { value: number }) {
  const isUp = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isUp ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
      }`}
    >
      {isUp ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {formatTrend(value)}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${
            s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
          }`}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdminDashboardOverview({ onNavigateTab }: AdminDashboardOverviewProps) {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?period=${period}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingSkeleton />;

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <AlertTriangle className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-lg font-medium text-white">Impossible de charger les statistiques</p>
        <p className="text-sm mt-1">Veuillez reessayer ulterieurement.</p>
      </div>
    );
  }

  const { kpis, moderationQueue, establishmentBreakdown, charts, topEstablishments, recentActivity } = stats;
  const { userGrowth, bookingTrend, userGrowthByType, messageTrend } = charts;

  const maxBreakdown = Math.max(...establishmentBreakdown.map((b) => b.count), 1);

  // Prepare chart data
  const userGrowthBars = userGrowth.map((p) => ({
    label: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    value: p.count,
  }));

  const bookingTrendBars = bookingTrend.map((p) => ({
    label: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    value: p.count,
  }));

  const messageTrendBars = messageTrend.map((p) => ({
    label: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    value: p.count,
  }));

  // -------------------------------------------------------------------------
  // KPI cards config
  // -------------------------------------------------------------------------
  const mainKPIs: {
    label: string;
    value: string;
    trend: number;
    icon: typeof Users;
    color: string;
  }[] = [
    {
      label: 'Utilisateurs',
      value: formatNumber(kpis.totalUsers),
      trend: kpis.usersTrend,
      icon: Users,
      color: '#3b82f6',
    },
    {
      label: 'Etablissements',
      value: formatNumber(kpis.totalEstablishments),
      trend: kpis.establishmentsTrend,
      icon: Building2,
      color: '#10b981',
    },
    {
      label: 'Reservations',
      value: formatNumber(kpis.totalBookings),
      trend: kpis.bookingsTrend,
      icon: CalendarDays,
      color: '#f59e0b',
    },
    {
      label: 'Messages',
      value: formatNumber(kpis.totalMessages),
      trend: kpis.messagesTrend,
      icon: Mail,
      color: '#8b5cf6',
    },
  ];

  const secondaryKPIs: {
    label: string;
    value: string;
    icon: typeof Eye;
    color: string;
  }[] = [
    { label: 'Vues totales', value: formatNumber(kpis.totalViews), icon: Eye, color: '#06b6d4' },
    { label: 'Total avis', value: formatNumber(kpis.totalReviews), icon: MessageSquare, color: '#f97316' },
    { label: 'Note moyenne', value: `${kpis.averageRating.toFixed(1)}/5`, icon: Star, color: '#eab308' },
    { label: 'Nouveaux aujourd\'hui', value: formatNumber(kpis.newUsers), icon: TrendingUp, color: '#ec4899' },
  ];

  // Moderation tiles
  const moderationTiles: {
    label: string;
    count: number;
    tabId: string;
    color: string;
    bgClass: string;
    icon: typeof ShieldCheck;
  }[] = [
    {
      label: 'Etabl. en attente',
      count: moderationQueue.pendingEstablishments,
      tabId: 'moderation',
      color: '#f59e0b',
      bgClass: 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
      icon: ShieldCheck,
    },
    {
      label: 'Claims en attente',
      count: moderationQueue.pendingClaims,
      tabId: 'claims',
      color: '#3b82f6',
      bgClass: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
      icon: Flag,
    },
    {
      label: 'Avis signales',
      count: moderationQueue.flaggedReviews,
      tabId: 'reviews',
      color: '#ef4444',
      bgClass: 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20',
      icon: AlertTriangle,
    },
    {
      label: 'Reserv. en attente',
      count: moderationQueue.pendingBookings,
      tabId: 'bookings',
      color: '#8b5cf6',
      bgClass: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
      icon: CalendarCheck,
    },
  ];

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Vue d&apos;ensemble</h2>
        <div className="flex items-center gap-1 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                period === p
                  ? 'bg-[#ef4444] text-white shadow-lg shadow-red-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {p === '7d' ? '7j' : p === '30d' ? '30j' : '90j'}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================= */}
      {/* Row 1 - Main KPIs                                                 */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKPIs.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${kpi.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
                <TrendBadge value={kpi.trend} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{kpi.value}</div>
                <div className="text-sm text-gray-400 mt-0.5">{kpi.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* Row 2 - Secondary KPIs                                            */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {secondaryKPIs.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              custom={i + 4}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-4 flex items-center gap-3"
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${kpi.color}20` }}
              >
                <Icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{kpi.value}</div>
                <div className="text-xs text-gray-500">{kpi.label}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* Row 3 - Moderation Queue + Breakdown                              */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Moderation queue */}
        <motion.div
          custom={8}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#ef4444]" />
            File de moderation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {moderationTiles.map((tile) => {
              const TileIcon = tile.icon;
              return (
                <button
                  key={tile.tabId}
                  onClick={() => onNavigateTab(tile.tabId)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${tile.bgClass}`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${tile.color}25` }}
                  >
                    <TileIcon className="w-5 h-5" style={{ color: tile.color }} />
                  </div>
                  <div className="text-left">
                    <div className="text-xl font-bold text-white">{tile.count}</div>
                    <div className="text-xs text-gray-400">{tile.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Establishment breakdown */}
        <motion.div
          custom={9}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#ef4444]" />
            Repartition par type
          </h3>
          <div className="space-y-3">
            {establishmentBreakdown.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Aucune donnee</p>
            ) : (
              establishmentBreakdown.map((item) => {
                const color = BREAKDOWN_COLORS[item.type] || '#6b7280';
                const pct = (item.count / maxBreakdown) * 100;
                return (
                  <div key={item.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">
                        {BREAKDOWN_LABELS[item.type] || item.type}
                      </span>
                      <span className="text-sm font-semibold text-white">{item.count}</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Row 4 - Inscriptions par type (stacked) + Tendance messages       */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          custom={10}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3b82f6]" />
            Inscriptions par type
          </h3>
          {userGrowthByType.length > 0 ? (
            <StackedBarChart data={userGrowthByType} />
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aucune donnee disponible</p>
          )}
        </motion.div>

        <motion.div
          custom={11}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#8b5cf6]" />
            Tendance messages
          </h3>
          {messageTrendBars.length > 0 ? (
            <BarChart data={messageTrendBars} color="#8b5cf6" />
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aucune donnee disponible</p>
          )}
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Row 5 - User Growth + Booking Trend charts                        */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          custom={12}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#06b6d4]" />
            Croissance utilisateurs
          </h3>
          {userGrowthBars.length > 0 ? (
            <BarChart data={userGrowthBars} color="#06b6d4" />
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aucune donnee disponible</p>
          )}
        </motion.div>

        <motion.div
          custom={13}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#f59e0b]" />
            Tendance reservations
          </h3>
          {bookingTrendBars.length > 0 ? (
            <BarChart data={bookingTrendBars} color="#f59e0b" />
          ) : (
            <p className="text-sm text-gray-500 text-center py-12">Aucune donnee disponible</p>
          )}
        </motion.div>
      </div>

      {/* ================================================================= */}
      {/* Row 5.5 - Madagascar Heatmap (full width)                         */}
      {/* ================================================================= */}
      <motion.div
        custom={14}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
      >
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Map className="w-4 h-4 text-[#ff6b35]" />
          Carte de chaleur — Zones les plus consultees
        </h3>
        <AdminHeatmap period={period} />
      </motion.div>

      {/* ================================================================= */}
      {/* Row 6 - Top Establishments + Recent Activity                      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Establishments */}
        <motion.div
          custom={14}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#eab308]" />
            Top 5 Etablissements
          </h3>
          {topEstablishments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucun etablissement</p>
          ) : (
            <div className="space-y-3">
              {topEstablishments.slice(0, 5).map((est, i) => {
                const typeColor = BREAKDOWN_COLORS[est.type?.toUpperCase()] || '#6b7280';
                return (
                  <motion.div
                    key={est.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#12122a] hover:bg-[#181838] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{
                        backgroundColor: i < 3 ? `${medalColors[i]}20` : '#1e1e2e',
                        color: i < 3 ? medalColors[i] : '#6b7280',
                      }}
                    >
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{est.name}</span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase"
                          style={{
                            backgroundColor: `${typeColor}20`,
                            color: typeColor,
                          }}
                        >
                          {est.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {est.city}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />
                          {formatNumber(est.viewCount)}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <RatingStars rating={est.rating} />
                      <div className="text-[10px] text-gray-500 mt-0.5">{est.rating.toFixed(1)}/5</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          custom={15}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-5"
        >
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#06b6d4]" />
            Activite recente
          </h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Aucune activite recente</p>
          ) : (
            <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {recentActivity.slice(0, 10).map((item, i) => {
                const ActionIcon = ACTION_ICONS[item.action] || Activity;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#12122a] transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0 mt-0.5">
                      <ActionIcon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 leading-snug">
                        {item.details || `${item.action} ${item.entityType}`}
                        {item.entityId && (
                          <span className="text-gray-600 font-mono text-[10px] ml-1">
                            #{item.entityId.slice(0, 8)}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-gray-600 mt-0.5">{timeAgo(item.createdAt)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
