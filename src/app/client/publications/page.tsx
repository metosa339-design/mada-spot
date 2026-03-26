'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/lib/image-url'
import {
  ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, XCircle,
  Mountain, Star, Ghost, Plus, Eye,
} from 'lucide-react'

interface Publication {
  id: string
  name: string
  slug: string
  type: string
  coverImage: string | null
  city: string
  region: string | null
  rating: number
  reviewCount: number
  isGhost: boolean
  moderationStatus: string
  moderationNote: string | null
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
}

const TYPE_PATHS: Record<string, string> = {
  HOTEL: 'hotels',
  RESTAURANT: 'restaurants',
  ATTRACTION: 'attractions',
  PROVIDER: 'prestataires',
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  approved: { label: 'Approuvé', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  pending_review: { label: 'En attente', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  rejected: { label: 'Refusé', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

export default function ClientPublicationsPage() {
  const router = useRouter()
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/publications', { credentials: 'include' })
      .then(r => {
        if (r.status === 401) { router.push('/login?redirect=/client/publications'); return null }
        return r.json()
      })
      .then(data => {
        if (data?.publications) setPublications(data.publications)
      })
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <motion.div variants={slideUp} custom={0} initial="hidden" animate="visible" className="mb-8">
          <Link href="/client" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mon espace
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mes publications</h1>
              <p className="text-gray-400 text-sm mt-1">
                Lieux que vous avez ajoutés sur Mada Spot
              </p>
            </div>
            <Link
              href="/publier-avis"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Ajouter un lieu
            </Link>
          </div>
        </motion.div>

        {/* Empty State */}
        {publications.length === 0 && (
          <motion.div
            variants={slideUp} custom={1} initial="hidden" animate="visible"
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ghost className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Aucune publication</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
              Vous n&apos;avez pas encore ajouté de lieu. Partagez vos découvertes avec la communauté !
            </p>
            <Link
              href="/publier-avis"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Ajouter mon premier lieu
            </Link>
          </motion.div>
        )}

        {/* Publications List */}
        <div className="space-y-4">
          {publications.map((pub, i) => {
            const status = STATUS_CONFIG[pub.moderationStatus] || STATUS_CONFIG.pending_review
            const StatusIcon = status.icon
            const typePath = TYPE_PATHS[pub.type]
            const detailHref = pub.isGhost
              ? `/bons-plans/lieu/${pub.slug}`
              : pub.moderationStatus === 'approved' && typePath
                ? `/bons-plans/${typePath}/${pub.slug}`
                : undefined

            return (
              <motion.div
                key={pub.id}
                variants={slideUp}
                custom={i + 1}
                initial="hidden"
                animate="visible"
                className="bg-[#1a1a24] border border-[#2a2a36] rounded-2xl overflow-hidden hover:border-[#ff6b35]/20 transition-all"
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-xl overflow-hidden bg-[#2a2a36] shrink-0">
                    {pub.coverImage ? (
                      <Image src={getImageUrl(pub.coverImage)} alt={pub.name} fill sizes="128px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Mountain className="w-8 h-8 text-white/10" />
                      </div>
                    )}
                    {pub.isGhost && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-violet-500/80 backdrop-blur-sm rounded text-[10px] font-medium text-white flex items-center gap-0.5">
                        <Ghost className="w-2.5 h-2.5" /> Ghost
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="font-semibold text-white truncate">{pub.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {pub.city}{pub.region && `, ${pub.region}`}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                        {TYPE_LABELS[pub.type] || pub.type}
                      </span>
                      {pub.rating > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          {pub.rating.toFixed(1)}
                        </span>
                      )}
                      {pub.reviewCount > 0 && (
                        <span className="text-xs text-gray-500">{pub.reviewCount} avis</span>
                      )}
                      <span className="text-xs text-gray-600">
                        {new Date(pub.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {pub.moderationNote && pub.moderationStatus === 'rejected' && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-red-400/80 bg-red-500/5 px-2.5 py-1.5 rounded-lg">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {pub.moderationNote}
                      </div>
                    )}

                    {detailHref && (
                      <Link
                        href={detailHref}
                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#ff6b35] hover:text-orange-400 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Voir la fiche
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
