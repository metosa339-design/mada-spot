'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, MousePointerClick, Calendar, DollarSign, Star, TrendingUp,
  TrendingDown, MessageSquare, Clock, ArrowRight, BedDouble,
  UtensilsCrossed, Users, MapPin, Zap, CalendarDays, ShieldCheck,
  CheckCircle, AlertTriangle, BarChart3, Activity,
  Percent, UserCheck, XCircle
} from 'lucide-react'
import Link from 'next/link'
import type { DashboardStats, BookingItem, ReviewItem, DashboardUser, TodayArrival, PendingBookingItem } from '@/types/dashboard'
import { useTrans } from '@/i18n'
type DashboardProTrans = ReturnType<typeof useTrans<'dashboardPro'>>

// Mini SVG Sparkline chart
function SparkLine({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const width = 120
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * (height - 4)}`).join(' ')
  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

// Mini bar chart component
function MiniBarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all duration-300"
            style={{ height: `${Math.max((val / max) * 100, 4)}%`, backgroundColor: color, opacity: 0.8 }}
            title={`${labels[i]}: ${val}`}
          />
          <span className="text-[9px] text-gray-500 leading-none">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}

// Profile completion widget
function ProfileCompletion({ user, stats, accent, t }: { user: DashboardUser; stats: DashboardStats | null; accent: string; t: DashboardProTrans }) {
  const checks = [
    { label: t.basicInfo, done: !!(user.firstName && user.lastName) },
    { label: t.emailVerified, done: true },
    { label: t.establishmentPublished, done: (stats?.totalViews ?? 0) > 0 },
    { label: t.coverPhoto, done: !!user.avatar },
    { label: t.firstReviewReceived, done: (stats?.totalReviews ?? 0) > 0 },
    { label: t.firstBooking, done: (stats?.totalBookings ?? 0) > 0 },
  ]
  const doneCount = checks.filter(c => c.done).length
  const percent = Math.round((doneCount / checks.length) * 100)

  return (
    <div className="bg-white border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" style={{ color: accent }} />
          {t.profileCompletion}
        </h3>
        <span className="text-lg font-bold" style={{ color: accent }}>{percent}%</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2 mb-4">
        <div className="h-2 rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: accent }} />
      </div>
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {check.done ? (
              <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />
            )}
            <span className={check.done ? 'text-gray-400' : 'text-gray-500'}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, trend, color, href, sparkData }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; trend?: number; color: string; href?: string; sparkData?: number[]
}) {
  const content = (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className="bg-white border border-white/10 rounded-2xl p-5 cursor-pointer transition-shadow hover:shadow-lg relative overflow-hidden"
      style={{ '--hover-shadow': `${color}10` } as React.CSSProperties}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
      {sparkData && sparkData.length > 1 && (
        <div className="absolute bottom-2 right-3 opacity-40">
          <SparkLine data={sparkData} color={color} height={30} />
        </div>
      )}
    </motion.div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

// Occupancy gauge for hotel
function OccupancyGauge({ rate, color }: { rate: number; color: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(rate, 100) / 100) * circumference
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{Math.round(rate)}%</span>
      </div>
    </div>
  )
}

// Response time badge
function ResponseTimeBadge({ hours, t }: { hours: number; t: DashboardProTrans }) {
  const getColor = () => {
    if (hours <= 2) return { color: '#10b981', label: t.excellent, bg: 'bg-emerald-500/10' }
    if (hours <= 12) return { color: '#f59e0b', label: t.average, bg: 'bg-amber-500/10' }
    return { color: '#ef4444', label: t.toImprove, bg: 'bg-red-500/10' }
  }
  const config = getColor()
  const isPoor = hours > 12

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border border-white/10 ${config.bg}`}>
      <div className={`relative ${isPoor ? 'animate-pulse' : ''}`}>
        <Clock className="w-8 h-8" style={{ color: config.color }} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{t.avgResponseTime}</p>
        <p className="text-lg font-bold text-gray-900">{hours > 0 ? `${hours}h` : '—'}</p>
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: config.color, backgroundColor: `${config.color}20` }}>
        {config.label}
      </span>
    </div>
  )
}

function BookingRow({ booking, accent, t }: { booking: BookingItem; accent: string; t: DashboardProTrans }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-emerald-500/10 text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-400',
    completed: 'bg-blue-500/10 text-blue-400',
    no_show: 'bg-gray-500/10 text-gray-400',
  }
  const statusLabels: Record<string, string> = {
    pending: t.statusPending,
    confirmed: t.statusConfirmed,
    cancelled: t.statusCancelled,
    completed: t.statusCompleted,
    no_show: t.statusNoShow,
  }
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}15` }}>
        {booking.bookingType === 'hotel' ? <BedDouble className="w-5 h-5" style={{ color: accent }} /> :
         booking.bookingType === 'restaurant' ? <UtensilsCrossed className="w-5 h-5" style={{ color: accent }} /> :
         <Users className="w-5 h-5" style={{ color: accent }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{booking.guestName}</p>
        <p className="text-xs text-gray-400">
          {new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          {booking.checkOut && ` → ${new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
          {' · '}{booking.guestCount} pers.
        </p>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[booking.status] || 'bg-gray-500/10 text-gray-400'}`}>
          {statusLabels[booking.status] || booking.status}
        </span>
        {booking.totalPrice != null && (
          <p className="text-xs text-gray-400 mt-1">{booking.totalPrice.toLocaleString('fr-FR')} MGA</p>
        )}
      </div>
    </div>
  )
}

// Pending booking action row (hotel)
function PendingRow({ booking, onAction, t }: {
  booking: PendingBookingItem
  onAction: (id: string, action: 'confirm' | 'cancel') => void
  t: DashboardProTrans
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors">
      <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
        <Clock className="w-5 h-5 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{booking.guestName}</p>
        <p className="text-xs text-gray-400">
          {new Date(booking.checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          {booking.checkOut && ` → ${new Date(booking.checkOut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
          {' · '}{booking.guestCount} pers.
          {booking.roomTypeName && ` · ${booking.roomTypeName}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {booking.totalPrice != null && (
          <span className="text-xs text-gray-400 mr-2">{booking.totalPrice.toLocaleString('fr-FR')} Ar</span>
        )}
        <button
          onClick={() => onAction(booking.id, 'confirm')}
          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
          title={t.accept}
        >
          <UserCheck className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction(booking.id, 'cancel')}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          title={t.refuse}
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const t = useTrans('dashboardPro')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([])
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([])
  const [todayArrivals, setTodayArrivals] = useState<TodayArrival[]>([])
  const [pendingList, setPendingList] = useState<PendingBookingItem[]>([])
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [loading, setLoading] = useState(true)

  const isHotel = user?.userType === 'HOTEL'

  const viewsSparkData = stats ? [
    Math.round((stats.totalViews || 0) * 0.6), Math.round((stats.totalViews || 0) * 0.7),
    Math.round((stats.totalViews || 0) * 0.5), Math.round((stats.totalViews || 0) * 0.8),
    Math.round((stats.totalViews || 0) * 0.9), Math.round((stats.totalViews || 0) * 0.75),
    stats.totalViews || 0
  ] : []
  const bookingsSparkData = stats ? [
    Math.round((stats.totalBookings || 0) * 0.4), Math.round((stats.totalBookings || 0) * 0.6),
    Math.round((stats.totalBookings || 0) * 0.3), Math.round((stats.totalBookings || 0) * 0.8),
    Math.round((stats.totalBookings || 0) * 0.5), Math.round((stats.totalBookings || 0) * 0.9),
    stats.totalBookings || 0
  ] : []

  const weekLabels = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun]
  const weekBookings = recentBookings.length > 0
    ? weekLabels.map((_, i) => recentBookings.filter(b => new Date(b.checkIn).getDay() === (i + 1) % 7).length)
    : [0, 1, 0, 2, 1, 3, 2]

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, sessionRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/auth/session'),
      ])
      if (statsRes.ok) {
        const json = await statsRes.json()
        const payload = json.data || json
        setStats(payload.stats)
        setRecentBookings(payload.recentBookings || [])
        setRecentReviews(payload.recentReviews || [])
        setTodayArrivals(payload.todayArrivals || [])
        setPendingList(payload.pendingList || [])
      }
      if (sessionRes.ok) {
        const data = await sessionRes.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handlePendingAction = async (id: string, action: 'confirm' | 'cancel') => {
    try {
      const res = await fetch(`/api/dashboard/reservations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'confirm' ? 'confirmed' : 'cancelled' }),
      })
      if (res.ok) {
        setPendingList(prev => prev.filter(b => b.id !== id))
        if (stats) {
          setStats(prev => prev ? { ...prev, pendingBookings: Math.max(0, (prev.pendingBookings || 0) - 1) } : prev)
        }
      }
    } catch (err) {
      console.error('Error updating booking:', err)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
              <div className="w-11 h-11 bg-white/5 rounded-xl mb-4" />
              <div className="h-7 w-20 bg-white/5 rounded mb-2" />
              <div className="h-4 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.morning
    if (hour < 18) return t.afternoon
    return t.evening
  }

  const pendingBookings = stats?.pendingBookings || recentBookings.filter(b => b.status === 'pending').length
  const unansweredReviews = recentReviews.filter(r => !r.ownerResponse).length

  // ====== HOTEL-SPECIFIC DASHBOARD ======
  if (isHotel && stats) {
    return (
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user?.firstName} !</h1>
            <p className="text-gray-400 mt-1">{t.hotelDashboardSubtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingBookings > 0 && (
              <Link href="/dashboard/reservations?tab=pending" className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                {pendingBookings} {pendingBookings > 1 ? t.pendingRequestPlural : t.pendingRequestSingle}
              </Link>
            )}
          </div>
        </div>

        {/* Hotel Stat Cards — Bleu Lagon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Occupancy with gauge */}
          <div className="bg-white border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-cyan-500" />
              <p className="text-sm text-gray-400">{t.occupancyRate}</p>
            </div>
            <OccupancyGauge rate={stats.occupancyRate || 0} color="#0891b2" />
            <p className="text-center text-xs text-gray-500 mt-2">{t.thisMonth}</p>
          </div>

          <StatCard
            label={t.monthlyRevenue}
            value={`${(stats.monthlyRevenue || 0).toLocaleString('fr-FR')} Ar`}
            icon={DollarSign}
            trend={stats.monthlyRevenueChange}
            color="#0891b2"
            href="/dashboard/statistiques"
          />
          <StatCard
            label={t.monthlyBookings}
            value={stats.monthlyBookingsCount || 0}
            icon={Calendar}
            trend={stats.monthlyBookingsChange}
            color="#0891b2"
            href="/dashboard/reservations"
          />
          <StatCard
            label={t.averageRating}
            value={`${stats.averageRating?.toFixed(1) || '0'}/5`}
            icon={Star}
            trend={stats.ratingTrend}
            color="#f59e0b"
            href="/dashboard/avis"
          />
        </div>

        {/* Response Time Badge + Today Arrivals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Response Time */}
          <div className="bg-white border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {t.reactivity}
            </h3>
            <ResponseTimeBadge hours={stats.avgResponseTimeHours || 0} t={t} />
            <p className="text-xs text-gray-500 mt-3">
              {(stats.avgResponseTimeHours || 0) <= 2
                ? t.responseFast
                : (stats.avgResponseTimeHours || 0) <= 12
                ? t.responseMedium
                : t.responseSlow}
            </p>
          </div>

          {/* Today Arrivals */}
          <div className="lg:col-span-2 bg-white border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                {t.todayArrivals}
              </h3>
              <span className="text-xs text-gray-400">{todayArrivals.length} {todayArrivals.length !== 1 ? t.checkInPlural : t.checkInSingle}</span>
            </div>
            <div className="divide-y divide-white/5">
              {todayArrivals.length > 0 ? todayArrivals.map((arrival, i) => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BedDouble className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{arrival.guestName}</p>
                    <p className="text-xs text-gray-400">
                      {arrival.guestCount} pers.
                      {arrival.roomTypeName && ` · ${arrival.roomTypeName}`}
                      {' · '}{arrival.reference}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    arrival.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {arrival.status === 'confirmed' ? t.confirmed : t.pendingStatus}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <CalendarDays className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{t.noArrivalToday}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingList.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-amber-500/20 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-amber-500/5">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  {t.pendingRequestsTitle}
                </h3>
                <Link href="/dashboard/reservations?tab=pending" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  {t.seeAll} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-white/5">
                {pendingList.map((booking) => (
                  <PendingRow key={booking.id} booking={booking} onAction={handlePendingAction} t={t} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={t.totalViews} value={stats.totalViews?.toLocaleString('fr-FR') || '0'} icon={Eye} trend={stats.viewsTrend} color="#8b5cf6" href="/dashboard/statistiques" sparkData={viewsSparkData} />
          <StatCard label={t.ctrLabel} value={`${stats.ctr?.toFixed(1) || '0'}%`} icon={MousePointerClick} color="#3b82f6" />
          <StatCard label={t.unreadMessages} value={stats.unreadMessages || 0} icon={MessageSquare} color="#ec4899" href="/dashboard/messagerie" />
          <StatCard label={t.totalReviews} value={stats.totalReviews || 0} icon={Star} color="#f59e0b" href="/dashboard/avis" />
        </div>

        {/* Charts + Profile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              {t.bookingsThisWeek}
            </h3>
            <MiniBarChart data={weekBookings} labels={weekLabels} color="#0891b2" />
          </div>

          <div className="bg-white border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {t.performance}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{t.confirmationRate}</span>
                  <span className="text-cyan-400 font-medium">
                    {stats.totalBookings ? Math.round((recentBookings.filter(b => b.status === 'confirmed').length / Math.max(recentBookings.length, 1)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: `${stats.totalBookings ? Math.round((recentBookings.filter(b => b.status === 'confirmed').length / Math.max(recentBookings.length, 1)) * 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{t.answeredReviews}</span>
                  <span className="text-amber-400 font-medium">
                    {recentReviews.length ? Math.round((recentReviews.filter(r => r.ownerResponse).length / recentReviews.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${recentReviews.length ? Math.round((recentReviews.filter(r => r.ownerResponse).length / recentReviews.length) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {user && <ProfileCompletion user={user} stats={stats} accent="#0891b2" t={t} />}
        </div>

        {/* Recent Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-gray-900">{t.recentBookings}</h2>
              <Link href="/dashboard/reservations" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                {t.seeAll} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentBookings.length > 0 ? (
                recentBookings.slice(0, 5).map((booking) => (
                  <BookingRow key={booking.id} booking={booking} accent="#0891b2" t={t} />
                ))
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{t.noRecentBookings}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-gray-900">{t.recentReviews}</h2>
              <Link href="/dashboard/avis" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                {t.seeAll} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recentReviews.length > 0 ? (
                recentReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{review.authorName || t.anonymous}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{review.comment}</p>
                    {!review.ownerResponse && (
                      <Link href="/dashboard/avis" className="text-xs text-cyan-400 mt-2 inline-block hover:underline">
                        {t.reply}
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{t.noRecentReviews}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ====== GENERIC DASHBOARD (non-hotel) ======
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{greeting()}, {user?.firstName} !</h2>
          <p className="text-gray-400 mt-1">{t.genericDashboardSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingBookings > 0 && (
            <Link href="/dashboard/reservations?tab=pending" className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/15 border border-orange-500/30 rounded-xl text-orange-400 text-sm font-semibold hover:bg-orange-500/20 transition-colors animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              {pendingBookings} {pendingBookings > 1 ? t.bookingsToValidatePlural : t.bookingsToValidateSingle}
            </Link>
          )}
          {unansweredReviews > 0 && (
            <Link href="/dashboard/avis" className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-400 text-xs font-medium hover:bg-pink-500/15 transition-colors">
              <Star className="w-3.5 h-3.5" />
              {unansweredReviews} {t.unansweredReviews}
            </Link>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.totalViews} value={stats?.totalViews?.toLocaleString('fr-FR') || '0'} icon={Eye} trend={stats?.viewsTrend} color="#8b5cf6" href="/dashboard/statistiques" sparkData={viewsSparkData} />
        <StatCard label={t.ctrLong} value={`${stats?.ctr?.toFixed(1) || '0'}%`} icon={MousePointerClick} color="#3b82f6" href="/dashboard/statistiques" />
        <StatCard label={t.bookings} value={stats?.totalBookings || 0} icon={Calendar} trend={stats?.bookingsTrend} color="#10b981" href="/dashboard/reservations" sparkData={bookingsSparkData} />
        <StatCard label={t.estimatedRevenue} value={`${(stats?.totalRevenue || 0).toLocaleString('fr-FR')} MGA`} icon={DollarSign} trend={stats?.revenueTrend} color="#ff6b35" href="/dashboard/statistiques" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.averageRating} value={`${stats?.averageRating?.toFixed(1) || '0'}/5`} icon={Star} trend={stats?.ratingTrend} color="#f59e0b" href="/dashboard/avis" />
        <StatCard label={t.totalReviews} value={stats?.totalReviews || 0} icon={Star} color="#f59e0b" href="/dashboard/avis" />
        <StatCard label={t.unreadMessages} value={stats?.unreadMessages || 0} icon={MessageSquare} color="#ec4899" href="/dashboard/messagerie" />
        <StatCard label={t.todayBookings} value={stats?.todayBookings || 0} icon={Clock} color="#06b6d4" href="/dashboard/reservations" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#10b981]" />
            {t.bookingsThisWeek}
          </h3>
          <MiniBarChart data={weekBookings} labels={weekLabels} color="#10b981" />
        </div>

        <div className="bg-white border border-white/10 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            {t.performance}
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{t.avgResponseTime}</span>
                <span className="text-cyan-400 font-medium">&lt; 2h</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-cyan-400" style={{ width: '80%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{t.confirmationRate}</span>
                <span className="text-green-400 font-medium">
                  {stats?.totalBookings ? Math.round((recentBookings.filter(b => b.status === 'confirmed').length / Math.max(recentBookings.length, 1)) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${stats?.totalBookings ? Math.round((recentBookings.filter(b => b.status === 'confirmed').length / Math.max(recentBookings.length, 1)) * 100) : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{t.answeredReviews}</span>
                <span className="text-amber-400 font-medium">
                  {recentReviews.length ? Math.round((recentReviews.filter(r => r.ownerResponse).length / recentReviews.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${recentReviews.length ? Math.round((recentReviews.filter(r => r.ownerResponse).length / recentReviews.length) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {user && <ProfileCompletion user={user} stats={stats} accent="#ff6b35" t={t} />}
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="text-lg font-semibold text-gray-900">{t.recentBookings}</h2>
            <Link href="/dashboard/reservations" className="text-sm text-[#ff6b35] hover:text-orange-400 flex items-center gap-1">
              {t.seeAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentBookings.length > 0 ? (
              recentBookings.slice(0, 5).map((booking) => (
                <BookingRow key={booking.id} booking={booking} accent="#ff6b35" t={t} />
              ))
            ) : (
              <div className="p-8 text-center">
                <Calendar className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">{t.noRecentBookings}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <h2 className="text-lg font-semibold text-gray-900">{t.recentReviews}</h2>
            <Link href="/dashboard/avis" className="text-sm text-[#ff6b35] hover:text-orange-400 flex items-center gap-1">
              {t.seeAll} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentReviews.length > 0 ? (
              recentReviews.slice(0, 5).map((review) => (
                <div key={review.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{review.authorName || t.anonymous}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{review.comment}</p>
                  {!review.ownerResponse && (
                    <Link href="/dashboard/avis" className="text-xs text-[#ff6b35] mt-2 inline-block hover:underline">
                      {t.reply}
                    </Link>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Star className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">{t.noRecentReviews}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t.myEstablishment, href: '/dashboard/etablissement', icon: MapPin, color: '#ff6b35' },
          { label: t.bookings, href: '/dashboard/reservations', icon: Calendar, color: '#10b981' },
          { label: t.calendar, href: '/dashboard/calendrier', icon: CalendarDays, color: '#06b6d4' },
          { label: t.promotions, href: '/dashboard/promotions', icon: Zap, color: '#eab308' },
          { label: t.customerReviews, href: '/dashboard/avis', icon: Star, color: '#f59e0b' },
          { label: t.messaging, href: '/dashboard/messagerie', icon: MessageSquare, color: '#ec4899' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#ff6b35]/30 transition-colors cursor-pointer text-center"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-xs font-medium text-gray-400">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  )
}
