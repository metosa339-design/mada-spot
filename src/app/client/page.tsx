'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Heart, LogOut, Settings, Mountain, Calendar, MapPin,
  MessageSquare, ArrowRight, Star, Search, Plane, Trophy,
  Hotel, UtensilsCrossed, Compass, Navigation,
  CloudSun, DollarSign, CheckSquare, Square,
  ChevronRight, Sparkles, BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import { getImageUrl } from '@/lib/image-url'

// ——— Types ———

interface UserData {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  role: string
  userType?: string | null
  clientProfile?: {
    id: string
    city?: string
    companyName?: string
  }
}

interface DashboardStats {
  favorites: number
  publications: number
  reviews: number
  upcomingBookings: number
  completedBookings: number
  totalBookings: number
  unreadMessages: number
  loyaltyPoints: number
}

interface NextBooking {
  id: string
  reference: string
  bookingType: string
  checkIn: string
  checkOut: string | null
  guestCount: number
  guestName: string
  status: string
  totalPrice: number | null
  currency: string
  establishment: {
    id: string
    name: string
    slug: string
    city: string
    region: string | null
    type: string
    coverImage: string | null
    latitude: number | null
    longitude: number | null
  }
}

interface RecentFavorite {
  id: string
  establishment: {
    id: string
    name: string
    slug: string
    type: string
    city: string
    coverImage: string | null
    rating: number | null
  }
}

interface WeatherData {
  temperature: number
  weatherCode: number
  city: string
}

// ——— Constants ———

const TYPE_PATHS: Record<string, string> = {
  HOTEL: 'hotels', RESTAURANT: 'restaurants', ATTRACTION: 'attractions', PROVIDER: 'prestataires',
}

const DEFAULT_CHECKLIST = [
  { id: 'passport', label: 'Passeport / visa', checked: false },
  { id: 'sunscreen', label: 'Crème solaire', checked: false },
  { id: 'repellent', label: 'Anti-moustiques', checked: false },
  { id: 'adapter', label: 'Adaptateur électrique', checked: false },
  { id: 'cash', label: 'Ariary / espèces', checked: false },
  { id: 'medication', label: 'Médicaments', checked: false },
]

const WEATHER_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '❄️', 73: '❄️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

const EXCHANGE_RATES: Record<string, { rate: number; symbol: string }> = {
  EUR: { rate: 5000, symbol: '€' },
  USD: { rate: 4600, symbol: '$' },
  GBP: { rate: 5800, symbol: '£' },
}

// ——— Slide-up animation variants ———

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

// ——— Weather Widget Component ———

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    // Antananarivo coordinates
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-18.9137&longitude=47.5361&current=temperature_2m,weather_code&timezone=Indian/Antananarivo')
      .then(r => r.json())
      .then(data => {
        if (data?.current) {
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            city: 'Antananarivo',
          })
        }
      })
      .catch(() => {})
  }, [])

  if (!weather) return null

  const icon = WEATHER_ICONS[weather.weatherCode] || '🌤️'

  return (
    <motion.div
      variants={slideUp}
      custom={8}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-sky-500/10 to-blue-600/10 border border-sky-500/20 rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <CloudSun className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-sky-300">Météo</h3>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-gray-900">{weather.temperature}°C</p>
          <p className="text-xs text-sky-300/70">{weather.city}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ——— Currency Converter Widget ———

function CurrencyWidget() {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')

  const rate = EXCHANGE_RATES[currency]
  const converted = amount ? (parseFloat(amount) * rate.rate) : 0

  return (
    <motion.div
      variants={slideUp}
      custom={9}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-emerald-300">Convertisseur</h3>
      </div>
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Montant"
          className="flex-1 bg-black/30 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-400/50 w-0 min-w-0"
        />
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          className="bg-black/30 border border-emerald-500/20 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none"
        >
          {Object.entries(EXCHANGE_RATES).map(([key, v]) => (
            <option key={key} value={key} className="bg-white">{v.symbol} {key}</option>
          ))}
        </select>
      </div>
      {converted > 0 && (
        <p className="text-lg font-bold text-emerald-300">
          = {converted.toLocaleString('fr-FR')} <span className="text-sm font-normal text-emerald-400/70">MGA</span>
        </p>
      )}
      {!converted && (
        <p className="text-xs text-emerald-400/50">1 {EXCHANGE_RATES[currency].symbol} = {rate.rate.toLocaleString('fr-FR')} MGA</p>
      )}
    </motion.div>
  )
}

// ——— Travel Checklist Widget ———

function ChecklistWidget() {
  const [items, setItems] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CHECKLIST
    try {
      const saved = localStorage.getItem('mada-travel-checklist')
      return saved ? JSON.parse(saved) : DEFAULT_CHECKLIST
    } catch { return DEFAULT_CHECKLIST }
  })

  const toggleItem = (id: string) => {
    const updated = items.map((item: typeof DEFAULT_CHECKLIST[0]) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    )
    setItems(updated)
    localStorage.setItem('mada-travel-checklist', JSON.stringify(updated))
  }

  const checkedCount = items.filter((i: typeof DEFAULT_CHECKLIST[0]) => i.checked).length

  return (
    <motion.div
      variants={slideUp}
      custom={10}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-br from-violet-500/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-violet-300">Checklist Voyage</h3>
        </div>
        <span className="text-xs text-violet-400/70">{checkedCount}/{items.length}</span>
      </div>
      <div className="space-y-1.5 max-h-[140px] overflow-y-auto scrollbar-thin">
        {items.map((item: typeof DEFAULT_CHECKLIST[0]) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className="flex items-center gap-2 w-full text-left group"
          >
            {item.checked ? (
              <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-gray-600 group-hover:text-violet-400/50 shrink-0" />
            )}
            <span className={`text-sm ${item.checked ? 'text-violet-300/50 line-through' : 'text-gray-300'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  )
}

// ——— Main Dashboard ———

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    favorites: 0, publications: 0, reviews: 0,
    upcomingBookings: 0, completedBookings: 0, totalBookings: 0,
    unreadMessages: 0, loyaltyPoints: 0,
  })
  const [nextBooking, setNextBooking] = useState<NextBooking | null>(null)
  const [recentFavorites, setRecentFavorites] = useState<RecentFavorite[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUser()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) fetchDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (!res.ok) { router.push('/login?redirect=/client'); return }
      const data = await res.json()
      if (!data?.user || data.user.role !== 'CLIENT') {
        router.push(data?.user ? '/' : '/login?redirect=/client')
        return
      }
      // Bloquer l'accès si le compte n'est pas vérifié
      if (!data.user.isVerified) {
        router.push('/verify-account')
        return
      }
      if (data.user.userType) {
        router.push('/dashboard')
        return
      }
      setUser(data.user)
    } catch {
      router.push('/login?redirect=/client')
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/client/dashboard')
      if (!res.ok) return
      const data = await res.json()
      if (data?.stats) setStats(data.stats)
      if (data?.nextBooking) setNextBooking(data.nextBooking)
      if (data?.recentFavorites) setRecentFavorites(data.recentFavorites)
      if (data?.categoryCounts) setCategoryCounts(data.categoryCounts)
    } catch { /* ignore */ }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const daysUntil = (d: string) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return "Aujourd'hui"
    if (diff === 1) return 'Demain'
    return `Dans ${diff} jours`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b35]" />
      </div>
    )
  }

  if (!user) return null

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const getLoyaltyTier = (points: number) => {
    if (points >= 1000) return { name: 'Or', color: 'from-amber-500 to-yellow-400', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20' }
    if (points >= 500) return { name: 'Argent', color: 'from-slate-300 to-gray-400', text: 'text-slate-300', bg: 'bg-slate-500/10', border: 'border-slate-500/20' }
    return { name: 'Bronze', color: 'from-orange-700 to-amber-700', text: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20' }
  }

  const tier = getLoyaltyTier(stats.loyaltyPoints)

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        {/* ——— Welcome Header ——— */}
        <motion.div
          variants={slideUp} custom={0} initial="hidden" animate="visible"
          className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{greeting()}, {user.firstName} !</h1>
              <p className="text-gray-400 text-sm">Votre espace voyageur Mada Spot</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/publier-lieu"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6b35] to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/20"
            >
              <Mountain className="w-4 h-4" />
              Devenir prestataire
            </Link>
          </div>
        </motion.div>

        {/* ——— HERO: Mon Prochain Départ OU Bannière inspirante ——— */}
        <motion.div variants={slideUp} custom={1} initial="hidden" animate="visible" className="mb-8">
          {nextBooking ? (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200">
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0891b2]/30 via-[#0a0a0f] to-[#0a0a0f]" />
              {nextBooking.establishment.coverImage && (
                <div className="absolute inset-0 opacity-20">
                  <Image src={getImageUrl(nextBooking.establishment.coverImage)} alt="" fill className="object-cover" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />

              <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0891b2]/20 border border-[#0891b2]/30 rounded-full mb-3">
                    <Plane className="w-3.5 h-3.5 text-[#0891b2]" />
                    <span className="text-xs font-medium text-[#0891b2]">Mon prochain départ</span>
                    <span className="text-xs font-bold text-cyan-300">{daysUntil(nextBooking.checkIn)}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    {nextBooking.establishment.name}
                  </h2>
                  <p className="text-gray-400 flex items-center gap-1 text-sm mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {nextBooking.establishment.city}
                    {nextBooking.establishment.region && `, ${nextBooking.establishment.region}`}
                  </p>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-[#0891b2]" />
                      {formatDate(nextBooking.checkIn)}
                      {nextBooking.checkOut && ` - ${formatDate(nextBooking.checkOut)}`}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg">
                      <User className="w-3.5 h-3.5 text-[#0891b2]" />
                      {nextBooking.guestCount} pers.
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-mono bg-[#0891b2]/10 text-[#0891b2]">
                      {nextBooking.reference}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {nextBooking.establishment.latitude && nextBooking.establishment.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${nextBooking.establishment.latitude},${nextBooking.establishment.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 bg-[#0891b2] text-gray-900 rounded-xl text-sm font-semibold hover:bg-[#0891b2]/90 transition-colors shadow-lg shadow-cyan-500/20"
                    >
                      <Navigation className="w-4 h-4" />
                      Obtenir l&apos;itinéraire
                    </a>
                  )}
                  <Link
                    href="/client/bookings"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-xl text-sm hover:bg-gray-100 transition-colors text-center justify-center"
                  >
                    Voir mes réservations
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Inspirational banner */
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-[#ff6b35]/10 via-[#0a0a0f] to-pink-500/5">
              <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#ff6b35]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-[#ff6b35]" />
                  <span className="text-[#ff6b35] font-medium text-sm">Explorez Madagascar</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                  Où allons-nous à Madagascar ?
                </h2>
                <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Chercher un hôtel, restaurant, attraction..."
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#ff6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#e55a2b] transition-colors shrink-0"
                  >
                    Rechercher
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>

        {/* ——— Stats Widgets Grid ——— */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Mes Favoris',
              value: stats.favorites,
              icon: Heart,
              color: '#ef4444',
              href: '/client/favorites',
              emptyText: 'Sauvegardez vos coups de coeur !',
              subtitle: stats.favorites > 0 ? `${stats.favorites} lieu${stats.favorites > 1 ? 'x' : ''} sauvegardé${stats.favorites > 1 ? 's' : ''}` : undefined,
            },
            {
              label: 'Mes Réservations',
              value: stats.totalBookings,
              icon: Calendar,
              color: '#0891b2',
              href: '/client/bookings',
              emptyText: 'Réservez votre premier séjour !',
              subtitle: stats.totalBookings > 0
                ? `${stats.upcomingBookings} à venir · ${stats.completedBookings} terminé${stats.completedBookings > 1 ? 'es' : ''}`
                : undefined,
            },
            {
              label: 'Mes Contributions',
              value: stats.reviews,
              icon: Star,
              color: '#f59e0b',
              href: '/publier-avis',
              emptyText: 'Partagez votre première expérience !',
              subtitle: stats.reviews > 0 ? `${stats.reviews} avis publié${stats.reviews > 1 ? 's' : ''}` : undefined,
            },
            {
              label: 'Points Fidélité',
              value: stats.loyaltyPoints,
              icon: Trophy,
              color: tier.name === 'Or' ? '#f59e0b' : tier.name === 'Argent' ? '#94a3b8' : '#ea580c',
              href: '/client/fidelite',
              emptyText: 'Voyagez pour gagner des points !',
              subtitle: `Niveau ${tier.name}`,
              isFidelity: true,
            },
          ].map((stat, index) => (
            <motion.div key={stat.label} variants={slideUp} custom={index + 2} initial="hidden" animate="visible">
              <Link href={stat.href}>
                <motion.div
                  whileHover={{ scale: 1.03, y: -3 }}
                  className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-[#ff6b35]/20 transition-all cursor-pointer h-full"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    {stat.isFidelity && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.color} text-white`}>
                        {tier.name.toUpperCase()}
                      </span>
                    )}
                    {!stat.isFidelity && stat.value > 0 && (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </div>

                  {stat.value > 0 ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString('fr-FR')}</p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-500 leading-relaxed">{stat.emptyText}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ——— Explorer par Catégorie ——— */}
        <motion.div variants={slideUp} custom={6} initial="hidden" animate="visible" className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Explorer par catégorie</h2>
            <Link href="/bons-plans" className="text-sm text-[#ff6b35] hover:text-orange-400 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Hébergements',
                desc: 'Hôtels, lodges, villas...',
                href: '/bons-plans/hotels',
                icon: Hotel,
                gradient: 'from-[#0891b2] to-cyan-600',
                bgGlow: 'from-cyan-500/10',
                type: 'HOTEL',
              },
              {
                label: 'Restaurants',
                desc: 'Gastronomie malgache et plus',
                href: '/bons-plans/restaurants',
                icon: UtensilsCrossed,
                gradient: 'from-orange-500 to-red-500',
                bgGlow: 'from-orange-500/10',
                type: 'RESTAURANT',
              },
              {
                label: 'Attractions',
                desc: 'Parcs, plages, excursions...',
                href: '/bons-plans/attractions',
                icon: Compass,
                gradient: 'from-green-500 to-emerald-600',
                bgGlow: 'from-green-500/10',
                type: 'ATTRACTION',
              },
            ].map((item) => {
              const count = categoryCounts[item.type] || 0
              return (
                <Link key={item.label} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -3 }}
                    className={`relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#ff6b35]/20 transition-all cursor-pointer overflow-hidden group`}
                  >
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                        <item.icon className="w-6 h-6 text-gray-900" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-[#ff6b35] transition-colors">{item.label}</h3>
                      <p className="text-sm text-gray-500">{item.desc}</p>

                      {/* Count overlay on hover */}
                      <AnimatePresence>
                        {count > 0 && (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg"
                          >
                            <span className="text-xs font-semibold text-[#ff6b35]">{count}+</span>
                            <span className="text-xs text-gray-400">à découvrir</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>

        {/* ——— Dernières Activités (Recent Favorites) ——— */}
        {recentFavorites.length > 0 && (
          <motion.div variants={slideUp} custom={7} initial="hidden" animate="visible" className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Vos derniers favoris</h2>
              <Link href="/client/favorites" className="text-sm text-[#ff6b35] hover:text-orange-400 flex items-center gap-1">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#2a2a36]">
              {recentFavorites.map((fav) => {
                const est = fav.establishment
                const href = TYPE_PATHS[est.type]
                  ? `/bons-plans/${TYPE_PATHS[est.type]}/${est.slug}`
                  : '/bons-plans'
                return (
                  <Link key={fav.id} href={href} className="shrink-0 w-44">
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#ff6b35]/20 transition-all"
                    >
                      <div className="relative h-24 bg-gradient-to-br from-[#ff6b35]/10 to-pink-500/10">
                        {est.coverImage ? (
                          <Image src={getImageUrl(est.coverImage)} alt={est.name} fill sizes="176px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Mountain className="w-8 h-8 text-white/10" />
                          </div>
                        )}
                        {est.rating && est.rating > 0 && (
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-900 text-[10px] font-medium">{est.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{est.name}</h4>
                        <p className="text-[11px] text-gray-500 flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {est.city}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ——— Practical Widgets: Météo + Convertisseur + Checklist ——— */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <WeatherWidget />
          <CurrencyWidget />
          <ChecklistWidget />
        </div>

        {/* ——— Messages Banner (if unread) ——— */}
        {stats.unreadMessages > 0 && (
          <motion.div variants={slideUp} custom={11} initial="hidden" animate="visible" className="mb-8">
            <Link href="/client/messagerie">
              <div className="bg-gradient-to-r from-pink-500/10 to-[#ff6b35]/10 border border-pink-500/20 rounded-2xl p-4 flex items-center gap-4 hover:border-pink-500/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {stats.unreadMessages} message{stats.unreadMessages > 1 ? 's' : ''} non lu{stats.unreadMessages > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-400 truncate">Vous avez des réponses de prestataires</p>
                </div>
                <ArrowRight className="w-5 h-5 text-pink-400 shrink-0" />
              </div>
            </Link>
          </motion.div>
        )}

        {/* ——— Quick Navigation ——— */}
        <motion.div variants={slideUp} custom={12} initial="hidden" animate="visible">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accès rapide</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { icon: Calendar, label: 'Réservations', href: '/client/bookings', color: '#0891b2' },
              { icon: Heart, label: 'Favoris', href: '/client/favorites', color: '#ef4444' },
              { icon: MessageSquare, label: 'Messages', href: '/client/messagerie', color: '#ec4899', badge: stats.unreadMessages || undefined },
              { icon: Star, label: 'Mes avis', href: '/publier-avis', color: '#f59e0b' },
              { icon: BookOpen, label: 'Publications', href: '/client/publications', color: '#a855f7' },
              { icon: Settings, label: 'Paramètres', href: '/client/settings', color: '#6b7280' },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-[#ff6b35]/20 transition-all cursor-pointer text-center"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-xs font-medium text-gray-400">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-2 right-2 w-5 h-5 bg-pink-500 text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ——— Logout ——— */}
        <motion.div variants={slideUp} custom={13} initial="hidden" animate="visible" className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </motion.div>

      </div>
    </div>
  )
}
