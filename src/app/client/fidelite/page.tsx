'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Trophy, Calendar, Star, Heart, Gift, TrendingUp,
  ChevronRight, Sparkles,
} from 'lucide-react'

interface Tier {
  name: string
  color: string
  minPoints: number
  nextTier: { name: string; minPoints: number } | null
  progress: number
}

interface Transaction {
  id: string
  type: string
  points: number
  description: string
  createdAt: string
}

interface LoyaltyData {
  points: number
  tier: Tier
  transactions: Transaction[]
}

const TYPE_ICONS: Record<string, typeof Calendar> = {
  BOOKING_COMPLETE: Calendar,
  REVIEW_POSTED: Star,
  FAVORITE_ADDED: Heart,
  FAVORITE_REMOVED: Heart,
  BONUS: Gift,
}

const TYPE_COLORS: Record<string, string> = {
  BOOKING_COMPLETE: '#0891b2',
  REVIEW_POSTED: '#f59e0b',
  FAVORITE_ADDED: '#ef4444',
  FAVORITE_REMOVED: '#6b7280',
  BONUS: '#8b5cf6',
}

const TIER_GRADIENTS: Record<string, string> = {
  Bronze: 'from-orange-700 to-amber-600',
  Argent: 'from-slate-400 to-gray-300',
  Or: 'from-amber-500 to-yellow-400',
  Platine: 'from-gray-300 to-white',
}

const HOW_TO_EARN = [
  { icon: Calendar, label: 'Terminer une réservation', points: '+100', color: '#0891b2' },
  { icon: Star, label: 'Publier un avis', points: '+50', color: '#f59e0b' },
  { icon: Heart, label: 'Ajouter un favori', points: '+10', color: '#ef4444' },
]

export default function FidelitePage() {
  const router = useRouter()
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/loyalty')
      .then(r => {
        if (r.status === 401) { router.push('/login?redirect=/client/fidelite'); return null }
        return r.json()
      })
      .then(d => { if (d) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ff6b35]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-gray-400">
        Erreur de chargement
      </div>
    )
  }

  const { points, tier, transactions } = data
  const gradient = TIER_GRADIENTS[tier.name] || TIER_GRADIENTS.Bronze

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        {/* Back */}
        <Link
          href="/client"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Mon espace
        </Link>

        {/* Tier Card */}
        <div className={`relative overflow-hidden rounded-2xl border border-[#2a2a36] bg-gradient-to-br ${gradient} p-px mb-8`}>
          <div className="bg-[#0a0a0f]/90 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span className={`text-sm font-bold px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white`}>
                    {tier.name.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {points.toLocaleString('fr-FR')} <span className="text-lg text-gray-400">points</span>
                </h1>
              </div>
              <Sparkles className="w-10 h-10 text-amber-400/30" />
            </div>

            {/* Progress bar to next tier */}
            {tier.nextTier && (
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>{tier.name}</span>
                  <span>{tier.nextTier.name} ({tier.nextTier.minPoints.toLocaleString('fr-FR')} pts)</span>
                </div>
                <div className="w-full h-2.5 bg-[#2a2a36] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                    style={{ width: `${tier.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Plus que {(tier.nextTier.minPoints - points).toLocaleString('fr-FR')} points pour atteindre {tier.nextTier.name}
                </p>
              </div>
            )}
            {!tier.nextTier && (
              <p className="text-sm text-amber-300/70">Niveau maximum atteint !</p>
            )}
          </div>
        </div>

        {/* How to earn */}
        <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#ff6b35]" />
            <h2 className="text-lg font-semibold">Comment gagner des points</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {HOW_TO_EARN.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 bg-[#0a0a0f] rounded-xl p-4 border border-[#2a2a36]"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 leading-tight">{item.label}</p>
                  <p className="text-lg font-bold text-[#ff6b35]">{item.points}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Historique</h2>
            <span className="text-xs text-gray-500">{transactions.length} transactions</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">Aucune transaction pour l&apos;instant</p>
              <p className="text-sm text-gray-500">
                Réservez, notez et sauvegardez pour commencer à gagner des points !
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => {
                const Icon = TYPE_ICONS[t.type] || Gift
                const color = TYPE_COLORS[t.type] || '#6b7280'
                const isPositive = t.points > 0

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-xl border border-[#2a2a36]"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{t.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isPositive ? '+' : ''}{t.points}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Back to dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/client"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Retour au tableau de bord
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
