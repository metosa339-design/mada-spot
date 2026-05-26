'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, MessageSquare, AlertTriangle, Send,
  Loader2
} from 'lucide-react'
import type { ReviewItem } from '@/types/dashboard'
import { useTrans } from '@/i18n'

type FilterTab = 'all' | 'unanswered' | 'answered' | 'flagged'

const FILTER_TABS: { key: FilterTab; labelKey: 'filterAll' | 'filterUnanswered' | 'filterAnswered' | 'filterFlagged' }[] = [
  { key: 'all', labelKey: 'filterAll' },
  { key: 'unanswered', labelKey: 'filterUnanswered' },
  { key: 'answered', labelKey: 'filterAnswered' },
  { key: 'flagged', labelKey: 'filterFlagged' },
]

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : i - 0.5 <= rating
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-[#64748B]'
          }`}
        />
      ))}
    </div>
  )
}

export default function AvisPage() {
  const t = useTrans('dashboardAvis')
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/dashboard/reviews')
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || data || [])
      }
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  const submitResponse = useCallback(async (reviewId: string) => {
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/dashboard/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, response: replyText.trim() }),
      })
      if (res.ok) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? { ...r, ownerResponse: replyText.trim(), respondedAt: new Date().toISOString() }
              : r
          )
        )
        setReplyingTo(null)
        setReplyText('')
      }
    } catch (err) {
      console.error('Error submitting response:', err)
    } finally {
      setSubmitting(false)
    }
  }, [replyText, submitting])

  // Summary stats
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0
  const unansweredCount = reviews.filter(r => !r.ownerResponse).length
  const flaggedCount = reviews.filter(r => r.isFlagged).length

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    if (activeFilter === 'unanswered') return !r.ownerResponse
    if (activeFilter === 'answered') return !!r.ownerResponse
    if (activeFilter === 'flagged') return r.isFlagged
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div className="h-8 w-48 bg-white rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-[#0F172A]">{t.pageTitle}</h1>
        <p className="text-[#94A3B8] mt-1">{t.pageSubtitle}</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Note moyenne */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="text-3xl font-bold text-[#0F172A]">{averageRating.toFixed(1)}</p>
            <span className="text-sm text-[#94A3B8]">/ 5</span>
          </div>
          <StarRating rating={Math.round(averageRating)} size="md" />
          <p className="text-sm text-[#94A3B8] mt-2">{t.averageRating}</p>
        </motion.div>

        {/* Total avis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#0F172A]">{totalReviews}</p>
          <p className="text-sm text-[#94A3B8] mt-2">{t.totalReviewsLabel}</p>
        </motion.div>

        {/* Avis sans réponse */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#FDBA74]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#0F172A]">{unansweredCount}</p>
          <p className="text-sm text-[#94A3B8] mt-2">{t.unansweredLabel}</p>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === tab.key
                ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#ff6b35]/20'
                : 'bg-white text-[#94A3B8] hover:bg-white hover:text-white'
            }`}
          >
            {t[tab.labelKey]}
            {tab.key === 'unanswered' && unansweredCount > 0 && (
              <span className="ml-2 bg-white/20 text-[#0F172A] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unansweredCount}
              </span>
            )}
            {tab.key === 'flagged' && flaggedCount > 0 && (
              <span className="ml-2 bg-red-500/30 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {flaggedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Review Cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden"
              >
                <div className="p-5">
                  {/* Review header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      {/* Author avatar */}
                      <div className="w-10 h-10 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#0F172A] text-sm font-bold">
                          {(review.authorName || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {review.authorName || t.anonymous}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-[#94A3B8]">
                            {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Flagged badge */}
                      {review.isFlagged && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-lg border border-red-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {t.flaggedBadge}
                        </span>
                      )}
                      {/* Establishment name */}
                      {review.establishment?.name && (
                        <span className="text-[10px] bg-white text-[#94A3B8] px-2 py-1 rounded-lg">
                          {review.establishment.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Review title */}
                  {review.title && (
                    <p className="text-sm font-medium text-[#0F172A] mb-1">{review.title}</p>
                  )}

                  {/* Review comment */}
                  <p className="text-sm text-[#CBD5E1] leading-relaxed">{review.comment}</p>

                  {/* Flag reason */}
                  {review.isFlagged && review.flagReason && (
                    <div className="mt-2 p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg">
                      <p className="text-[10px] font-medium text-red-400 mb-0.5">{t.flagReasonLabel}</p>
                      <p className="text-xs text-red-300/80">{review.flagReason}</p>
                    </div>
                  )}

                  {/* Owner response */}
                  {review.ownerResponse && (
                    <div className="mt-4 pl-4 border-l-2 border-[#FF6B35]/30 bg-[#FF6B35]/5 rounded-r-xl p-3">
                      <p className="text-xs font-medium text-[#FF6B35] mb-1">{t.yourReplyTitle}</p>
                      <p className="text-sm text-[#CBD5E1]">{review.ownerResponse}</p>
                      {review.respondedAt && (
                        <p className="text-[10px] text-[#94A3B8] mt-2">
                          {t.repliedOn} {new Date(review.respondedAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reply button / form */}
                  {!review.ownerResponse && (
                    <div className="mt-4">
                      {replyingTo === review.id ? (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t.replyPlaceholder2}
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#FF6B35] transition-colors resize-none"
                          />
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText('') }}
                              className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                            >
                              {t.cancel}
                            </button>
                            <button
                              onClick={() => submitResponse(review.id)}
                              disabled={!replyText.trim() || submitting}
                              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FF6B35] hover:bg-[#F97316] disabled:bg-[#F1F5F9] disabled:text-[#CBD5E1] text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              {submitting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              {t.sendReply}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <button
                          onClick={() => { setReplyingTo(review.id); setReplyText('') }}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#FF6B35] hover:text-[#FDBA74] transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {t.reply}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center"
            >
              <Star className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
              <p className="text-sm text-[#94A3B8]">{t.noReviewsFound}</p>
              <p className="text-xs text-[#64748B] mt-1">
                {activeFilter !== 'all'
                  ? t.tryAnotherFilter
                  : t.reviewsWillAppear}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
