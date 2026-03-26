'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, Building2, UtensilsCrossed, Mountain, Users, Loader2, ArrowLeft, Plus } from 'lucide-react'
import { getImageUrl } from '@/lib/image-url'
import ReviewForm from '@/components/bons-plans/ReviewForm'
import GhostEstablishmentForm from '@/components/bons-plans/GhostEstablishmentForm'
import ContributorBadge from '@/components/bons-plans/ContributorBadge'

interface Establishment {
  id: string
  name: string
  slug: string
  type: string
  city: string
  coverImage: string | null
  rating: number
  reviewCount: number
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  HOTEL: Building2,
  RESTAURANT: UtensilsCrossed,
  ATTRACTION: Mountain,
  PROVIDER: Users,
}

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
}

export default function PublierAvisPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Establishment[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Establishment | null>(null)
  const [user, setUser] = useState<{ id: string; firstName: string } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [showGhostForm, setShowGhostForm] = useState(false)
  const [ghostCreated, setGhostCreated] = useState<{ name: string; slug: string } | null>(null)

  // Check auth
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) setUser(d.user)
        else router.push('/login?redirect=/publier-avis')
      })
      .catch(() => router.push('/login?redirect=/publier-avis'))
      .finally(() => setCheckingAuth(false))
  }, [router])

  // Search establishments
  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }

    setSearching(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.establishments || [])
      }
    } catch { /* ignore */ }
    finally { setSearching(false) }
  }, [])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0c0c16] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#0c0c16] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Publier un avis</h1>
          <p className="text-gray-400">Partagez votre expérience et aidez d&apos;autres voyageurs</p>
        </motion.div>

        {!selected ? (
          /* Step 1: Search for an establishment */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Rechercher un hôtel, restaurant, attraction..."
                autoFocus
                className="w-full pl-12 pr-4 py-4 bg-[#1a1a24] border border-white/10 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              {searching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400 animate-spin" />
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="bg-[#1a1a24] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                {results.map(est => {
                  const Icon = TYPE_ICONS[est.type] || Building2
                  return (
                    <button
                      key={est.id}
                      onClick={() => setSelected(est)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                    >
                      {est.coverImage ? (
                        <img
                          src={getImageUrl(est.coverImage)}
                          alt={est.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{est.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-orange-400">{TYPE_LABELS[est.type] || est.type}</span>
                          <span className="text-xs text-gray-600">·</span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />
                            {est.city}
                          </span>
                        </div>
                        {est.rating > 0 && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs text-gray-400">{est.rating.toFixed(1)} ({est.reviewCount} avis)</span>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {query.length >= 2 && !searching && results.length === 0 && !showGhostForm && !ghostCreated && (
              <div className="text-center py-8 space-y-4">
                <p className="text-gray-500 text-sm">Aucun établissement trouvé pour &quot;{query}&quot;</p>
                <button
                  onClick={() => setShowGhostForm(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Créer ce lieu et donner mon avis
                </button>
                <p className="text-xs text-gray-600">Vous connaissez ce lieu ? Ajoutez-le à la carte de Madagascar !</p>
              </div>
            )}

            {showGhostForm && !ghostCreated && (
              <GhostEstablishmentForm
                initialName={query}
                onSuccess={(data) => {
                  setShowGhostForm(false)
                  setGhostCreated({ name: data.name, slug: data.slug })
                }}
                onCancel={() => setShowGhostForm(false)}
              />
            )}

            {ghostCreated && (
              <ContributorBadge establishmentName={ghostCreated.name} slug={ghostCreated.slug} />
            )}

            {query.length < 2 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Commencez par rechercher l&apos;établissement que vous souhaitez évaluer</p>
              </div>
            )}
          </motion.div>
        ) : (
          /* Step 2: Review form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Selected establishment header */}
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Changer d&apos;établissement
            </button>

            <div className="flex items-center gap-4 p-4 bg-[#1a1a24] border border-orange-500/20 rounded-2xl">
              {selected.coverImage ? (
                <img
                  src={getImageUrl(selected.coverImage)}
                  alt={selected.name}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  {(() => { const Icon = TYPE_ICONS[selected.type] || Building2; return <Icon className="w-7 h-7 text-gray-600" /> })()}
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{selected.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-orange-400">{TYPE_LABELS[selected.type]}</span>
                  <span className="text-xs text-gray-600">·</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {selected.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Review form */}
            <ReviewForm
              establishmentId={selected.id}
              onReviewSubmitted={() => {
                // Stay on form for potential another review
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
