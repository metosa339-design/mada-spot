'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Star, BadgeCheck, Loader2,
  SlidersHorizontal, Flag,
  ImageIcon, ShieldCheck, MessageSquare,
} from 'lucide-react'
import ReviewImageGallery from '@/components/bons-plans/ReviewImageGallery'
import ReviewVoteButtons from '@/components/bons-plans/ReviewVoteButtons'
import ReportReviewDialog from '@/components/bons-plans/ReportReviewDialog'

interface Review {
  id: string
  establishmentId: string
  authorName: string
  userId: string | null
  rating: number
  title?: string
  comment: string
  images?: string
  isVerified: boolean
  ownerResponse?: string
  respondedAt?: string
  createdAt: string
  helpfulCount: number
  unhelpfulCount: number
}

type SortOption = 'recent' | 'highest' | 'lowest'

const SORT_LABELS: Record<SortOption, string> = {
  recent: 'Plus récents',
  highest: 'Meilleure note',
  lowest: 'Note la plus basse',
}

const PAGE_SIZE = 10

export default function AllReviewsPage() {
  const params = useParams()
  const establishmentId = params.establishmentId as string

  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [establishment, setEstablishment] = useState<{ name: string; rating: number; reviewCount: number } | null>(null)

  const [sort, setSort] = useState<SortOption>('recent')
  const [filterVerified, setFilterVerified] = useState(false)
  const [filterPhotos, setFilterPhotos] = useState(false)

  const [reportingReview, setReportingReview] = useState<string | null>(null)

  const fetchReviews = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        sort,
      })
      if (filterVerified) params.set('verified', 'true')
      if (filterPhotos) params.set('withPhotos', 'true')

      const res = await fetch(`/api/establishments/${establishmentId}/reviews?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (append) {
          setReviews(prev => [...prev, ...data.reviews])
        } else {
          setReviews(data.reviews)
        }
        setTotal(data.total)
        if (data.establishment && !append) {
          setEstablishment(data.establishment)
        }
      }
    } catch { /* ignore */ }
    finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [establishmentId, sort, filterVerified, filterPhotos])

  useEffect(() => {
    fetchReviews(0, false)
  }, [fetchReviews])

  const loadMore = () => {
    fetchReviews(reviews.length, true)
  }

  const hasMore = reviews.length < total

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Tous les avis
            </h1>
            {establishment && (
              <p className="text-sm text-gray-400 mt-0.5">
                {establishment.name} — {establishment.reviewCount} avis, {establishment.rating?.toFixed(1)}★
              </p>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Trier :
          </div>
          {(Object.keys(SORT_LABELS) as SortOption[]).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                sort === s
                  ? 'bg-[#ff6b35]/20 border-[#ff6b35]/50 text-[#ff6b35]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button
            onClick={() => setFilterVerified(v => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
              filterVerified
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            Vérifiés
          </button>

          <button
            onClick={() => setFilterPhotos(v => !v)}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
              filterPhotos
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            Avec photos
          </button>
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff6b35]" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun avis trouvé avec ces filtres</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{total} avis au total</p>

            {reviews.map(review => (
              <div key={review.id} className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl p-5">
                {/* Review header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(review.authorName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white text-sm">{review.authorName || 'Anonyme'}</p>
                          {review.isVerified && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px] font-medium border border-emerald-500/20">
                              <BadgeCheck className="w-2.5 h-2.5" />
                              Vérifié
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.title && (
                      <p className="font-medium text-white mt-2 text-sm">{review.title}</p>
                    )}
                    <p className="text-slate-300 mt-1.5 text-sm leading-relaxed">{review.comment}</p>

                    {/* Images */}
                    {(() => {
                      if (!review.images) return null
                      let parsed: string[]
                      try { parsed = typeof review.images === 'string' ? JSON.parse(review.images) : review.images } catch { return null }
                      if (!Array.isArray(parsed) || parsed.length === 0) return null
                      return <ReviewImageGallery images={parsed} />
                    })()}

                    {/* Owner response */}
                    {review.ownerResponse && (
                      <div className="mt-3 p-3 bg-orange-500/10 rounded-lg border-l-2 border-orange-500">
                        <p className="text-xs font-medium text-orange-300 mb-1">Réponse de l&apos;établissement</p>
                        <p className="text-xs text-orange-200">{review.ownerResponse}</p>
                      </div>
                    )}

                    {/* Actions: vote + report */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                      <ReviewVoteButtons
                        reviewId={review.id}
                        establishmentId={establishmentId}
                        helpfulCount={review.helpfulCount}
                        unhelpfulCount={review.unhelpfulCount}
                      />
                      <button
                        onClick={() => setReportingReview(review.id)}
                        className="ml-auto p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                        title="Signaler cet avis"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Load more */}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 border border-[#2a2a36] text-slate-300 font-medium text-sm rounded-xl hover:bg-[#2a2a36] transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  `Charger plus d'avis (${reviews.length}/${total})`
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report dialog */}
      {reportingReview && (
        <ReportReviewDialog
          reviewId={reportingReview}
          establishmentId={establishmentId}
          onClose={() => setReportingReview(null)}
        />
      )}
    </div>
  )
}
