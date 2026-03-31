'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Eye, MousePointerClick, Calendar, DollarSign,
  BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

interface ViewData {
  date: string
  views: number
  clicks: number
}

interface StatsData {
  totalViews: number
  viewsTrend: number
  totalBookings: number
  bookingsTrend: number
  totalRevenue: number
  revenueTrend: number
  ctr: number
  weeklyViews: ViewData[]
  topSources: { source: string; count: number; percentage: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
}

interface AnalyticsData {
  funnel: { views: number; inquiries: number; bookings: number; completed: number }
  occupancyByDay: { day: string; rate: number }[]
  revenueComparison: {
    current: { label: string; value: number }[]
    previous: { label: string; value: number }[]
  }
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null
  const max = Math.max(...data, 1)
  const height = 40

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * 12} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area */}
      <path
        d={`M0,${height} ${data.map((v, i) => `L${i * 12},${height - (v / max) * (height - 4)}`).join(' ')} L${(data.length - 1) * 12},${height} Z`}
        fill={`url(#grad-${color.replace('#','')})`}
      />
      {/* Line */}
      <path
        d={data.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * 12},${height - (v / max) * (height - 4)}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="w-full rounded-t-md min-h-[4px]"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] text-gray-500 truncate max-w-full">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function StatistiquesPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchStats()
    fetchAnalytics()
  }, [period])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalViews: data.stats?.totalViews || 0,
          viewsTrend: data.stats?.viewsTrend || 0,
          totalBookings: data.stats?.totalBookings || 0,
          bookingsTrend: data.stats?.bookingsTrend || 0,
          totalRevenue: data.stats?.totalRevenue || 0,
          revenueTrend: data.stats?.revenueTrend || 0,
          ctr: data.stats?.ctr || 0,
          weeklyViews: data.weeklyViews || [],
          topSources: data.topSources || [
            { source: 'Recherche', count: 450, percentage: 45 },
            { source: 'Direct', count: 250, percentage: 25 },
            { source: 'Carte', count: 200, percentage: 20 },
            { source: 'Autres', count: 100, percentage: 10 },
          ],
          monthlyRevenue: data.monthlyRevenue || [],
        })
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/dashboard/stats/analytics?period=${period}`)
      if (res.ok) {
        const data = await res.json()
        if (data.data) setAnalytics(data.data)
      }
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-[#1a1a24] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Vues totales',
      value: (stats?.totalViews || 0).toLocaleString('fr-FR'),
      trend: stats?.viewsTrend || 0,
      icon: Eye,
      color: '#8b5cf6',
      chartData: stats?.weeklyViews?.map(d => d.views) || [],
    },
    {
      label: 'Taux de clic',
      value: `${(stats?.ctr || 0).toFixed(1)}%`,
      trend: 0,
      icon: MousePointerClick,
      color: '#3b82f6',
      chartData: stats?.weeklyViews?.map(d => d.clicks) || [],
    },
    {
      label: 'Réservations',
      value: (stats?.totalBookings || 0).toLocaleString('fr-FR'),
      trend: stats?.bookingsTrend || 0,
      icon: Calendar,
      color: '#10b981',
      chartData: [],
    },
    {
      label: 'Revenus',
      value: `${(stats?.totalRevenue || 0).toLocaleString('fr-FR')} MGA`,
      trend: stats?.revenueTrend || 0,
      icon: DollarSign,
      color: '#ff6b35',
      chartData: [],
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Statistiques</h1>
          <p className="text-gray-400 text-sm mt-1">Suivez les performances de votre établissement</p>
        </div>
        <div className="flex gap-1 bg-[#1a1a24] border border-white/10 rounded-xl p-1 self-start sm:self-auto">
          {[
            { value: '7d' as const, label: '7 jours' },
            { value: '30d' as const, label: '30 jours' },
            { value: '90d' as const, label: '90 jours' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.value ? 'bg-[#ff6b35] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards with Mini Charts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#1a1a24] border border-white/10 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}15` }}>
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              {card.trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                  card.trend > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {card.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(card.trend)}%
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1 mb-3">{card.label}</p>
            {card.chartData.length > 0 && (
              <MiniChart data={card.chartData} color={card.color} />
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources de trafic */}
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            Sources de trafic
          </h3>
          <div className="space-y-3">
            {(stats?.topSources || []).map((source, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{source.source}</span>
                  <span className="text-xs text-gray-400">{source.count} ({source.percentage}%)</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${source.percentage}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="h-full rounded-full bg-[#ff6b35]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenus mensuels */}
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            Revenus par mois
          </h3>
          {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
            <BarChart
              data={stats.monthlyRevenue.map(m => ({ label: m.month, value: m.revenue }))}
              color="#ff6b35"
            />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
              Pas encore de données
            </div>
          )}
        </div>
      </div>

      {/* Conversion Funnel */}
      {analytics?.funnel && (
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-medium text-white mb-5">Entonnoir de conversion</h3>
          <div className="space-y-3">
            {[
              { label: 'Vues', value: analytics.funnel.views, color: '#8b5cf6' },
              { label: 'Demandes', value: analytics.funnel.inquiries, color: '#6366f1' },
              { label: 'Réservations', value: analytics.funnel.bookings, color: '#f97316' },
              { label: 'Terminées', value: analytics.funnel.completed, color: '#ff6b35' },
            ].map((step, i, arr) => {
              const maxVal = Math.max(arr[0].value, 1)
              const pct = Math.round((step.value / maxVal) * 100)
              const prevVal = i > 0 ? arr[i - 1].value : 0
              const convRate = i > 0 && prevVal > 0 ? Math.round((step.value / prevVal) * 100) : null
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{step.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{step.value.toLocaleString('fr-FR')}</span>
                      {convRate !== null && (
                        <span className="text-[10px] text-gray-500">({convRate}%)</span>
                      )}
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: step.color, minWidth: step.value > 0 ? 4 : 0 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy Heatmap */}
        {analytics?.occupancyByDay && (
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-white mb-5">Occupation par jour</h3>
            <div className="grid grid-cols-7 gap-2">
              {analytics.occupancyByDay.map((d, i) => (
                <motion.div
                  key={d.day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full aspect-square rounded-xl flex items-center justify-center border border-white/5"
                    style={{
                      backgroundColor: `rgba(255, 107, 53, ${d.rate * 0.8})`,
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      {Math.round(d.rate * 100)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500">{d.day}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue Comparison */}
        {analytics?.revenueComparison && analytics.revenueComparison.current.length > 0 && (
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-white mb-2">Revenus : période actuelle vs précédente</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#ff6b35]" />
                <span className="text-[10px] text-gray-400">Actuelle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-[#2a2a36]" />
                <span className="text-[10px] text-gray-400">Précédente</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-32">
              {analytics.revenueComparison.current.map((week, i) => {
                const prev = analytics.revenueComparison.previous[i]
                const max = Math.max(
                  ...analytics.revenueComparison.current.map(w => w.value),
                  ...analytics.revenueComparison.previous.map(w => w.value),
                  1
                )
                return (
                  <div key={week.label} className="flex-1 flex items-end gap-0.5">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(prev?.value || 0) / max * 100}%` }}
                      transition={{ delay: i * 0.05, duration: 0.5 }}
                      className="flex-1 rounded-t bg-[#2a2a36] min-h-[2px]"
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${week.value / max * 100}%` }}
                      transition={{ delay: i * 0.05 + 0.1, duration: 0.5 }}
                      className="flex-1 rounded-t bg-[#ff6b35] min-h-[2px]"
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex gap-1 mt-1">
              {analytics.revenueComparison.current.map(w => (
                <span key={w.label} className="flex-1 text-center text-[9px] text-gray-500">{w.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SEO JSON-LD note */}
      <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-white mb-2">Référencement SEO</h3>
        <p className="text-xs text-gray-400">
          Votre annonce génère automatiquement des données structurées (JSON-LD) pour améliorer
          votre visibilité sur Google. Complétez votre profil à 100% pour maximiser votre référencement local.
        </p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400">Données structurées actives</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-400">Schema.org LocalBusiness</span>
          </div>
        </div>
      </div>
    </div>
  )
}
