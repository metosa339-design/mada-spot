'use client'

import { useState } from 'react'
import { X, Flag, Loader2, CheckCircle } from 'lucide-react'

const REASONS = [
  { label: 'Contenu inapproprié', value: 'Contenu inapproprié ou offensant' },
  { label: 'Spam', value: 'Spam ou publicité non sollicitée' },
  { label: 'Faux avis', value: 'Avis frauduleux ou non authentique' },
  { label: 'Autre', value: '' },
]

interface ReportReviewDialogProps {
  reviewId: string
  establishmentId: string
  onClose: () => void
}

export default function ReportReviewDialog({ reviewId, establishmentId, onClose }: ReportReviewDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reason = selectedReason === '' ? customReason.trim() : selectedReason

  const handleSubmit = async () => {
    if (!reason || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/establishments/${establishmentId}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json().catch(() => null)
        setError(data?.error || 'Erreur lors du signalement')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Signalement envoyé</h3>
            <p className="text-sm text-gray-400 mb-4">Merci, notre équipe examinera cet avis.</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#ff6b35] text-white rounded-xl text-sm font-medium hover:bg-[#ff6b35]/80 transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Signaler cet avis</h3>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Pourquoi souhaitez-vous signaler cet avis ?
            </p>

            <div className="space-y-2 mb-4">
              {REASONS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setSelectedReason(r.value)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                    selectedReason === r.value
                      ? 'bg-red-500/10 border-red-500/30 text-red-300'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {selectedReason === '' && (
              <textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="Décrivez la raison..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500/50 resize-none mb-4"
              />
            )}

            {error && (
              <p className="text-xs text-red-400 mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-white/10 text-gray-400 rounded-xl text-sm hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-500/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Signaler'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
