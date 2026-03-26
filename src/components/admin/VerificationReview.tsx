'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, ShieldX, Search, Eye, CheckCircle, XCircle,
  FileText, User, Clock, ExternalLink, Loader2
} from 'lucide-react'

interface VerificationDoc {
  id: string
  userId: string
  documentType: string
  documentUrl: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  reviewedAt: string | null
  reviewedBy: string | null
  note: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    userType: string | null
  }
}

interface Stats {
  pending: number
  verified: number
  rejected: number
}

const DOC_TYPE_LABELS: Record<string, string> = {
  nif: 'NIF (Identification Fiscale)',
  stat: 'Carte STAT',
  business_license: 'Licence d\'exploitation',
  id_card: 'Pièce d\'identité (CIN)',
}

const USER_TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
}

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Clock },
  VERIFIED: { label: 'Vérifié', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: CheckCircle },
  REJECTED: { label: 'Rejeté', color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
}

export default function VerificationReview() {
  const [docs, setDocs] = useState<VerificationDoc[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, verified: 0, rejected: 0 })
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING')
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<VerificationDoc | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)
      params.set('limit', '100')
      const res = await fetch(`/api/admin/verification?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDocs(data.documents || [])
        setStats(data.stats || { pending: 0, verified: 0, rejected: 0 })
        setTotal(data.total || 0)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [filter, search])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedDoc) return
    if (action === 'reject' && !reviewNote.trim()) return

    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          documentId: selectedDoc.id,
          action,
          note: reviewNote.trim() || undefined,
        }),
      })
      if (res.ok) {
        setSelectedDoc(null)
        setReviewNote('')
        fetchDocs()
      }
    } catch { /* ignore */ }
    finally { setActionLoading(false) }
  }

  // Group docs by user for progress display
  const userProgressMap = new Map<string, { total: number; verified: number; name: string; type: string }>()
  docs.forEach(doc => {
    const existing = userProgressMap.get(doc.userId)
    if (existing) {
      existing.total++
      if (doc.status === 'VERIFIED') existing.verified++
    } else {
      userProgressMap.set(doc.userId, {
        total: 1,
        verified: doc.status === 'VERIFIED' ? 1 : 0,
        name: `${doc.user.firstName} ${doc.user.lastName}`,
        type: doc.user.userType || '',
      })
    }
  })

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'En attente', value: stats.pending, icon: ShieldAlert, color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400', border: 'border-amber-500/30' },
          { label: 'Vérifiés', value: stats.verified, icon: ShieldCheck, color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Rejetés', value: stats.rejected, icon: ShieldX, color: 'from-red-500/20 to-rose-500/20', textColor: 'text-red-400', border: 'border-red-500/30' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-gradient-to-br ${kpi.color} border ${kpi.border} rounded-xl p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{kpi.label}</p>
                <p className={`text-3xl font-bold ${kpi.textColor} mt-1`}>{kpi.value}</p>
              </div>
              <kpi.icon className={`w-8 h-8 ${kpi.textColor} opacity-60`} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#ff6b35] text-white'
                  : 'bg-[#0c0c16] text-gray-400 border border-[#1e1e2e] hover:border-[#ff6b35]/50'
              }`}
            >
              {f === 'all' ? 'Tous' : STATUS_CONFIG[f].label}
              {f === 'PENDING' && stats.pending > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500 ml-auto">{total} documents</span>
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun document {filter !== 'all' ? STATUS_CONFIG[filter].label.toLowerCase() : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => {
            const sc = STATUS_CONFIG[doc.status]
            const StatusIcon = sc.icon
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#ff6b35]/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* User avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b35]/20 to-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#ff6b35]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">
                          {doc.user.firstName} {doc.user.lastName}
                        </span>
                        {doc.user.userType && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                            {USER_TYPE_LABELS[doc.user.userType] || doc.user.userType}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {doc.user.email || doc.user.phone || 'N/A'}
                      </p>
                    </div>

                    {/* Document type */}
                    <div className="hidden md:block flex-shrink-0">
                      <p className="text-sm font-medium text-white">{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</p>
                      <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>

                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${sc.bg} rounded-full flex-shrink-0`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${sc.color}`} />
                      <span className={`text-xs font-medium ${sc.color}`}>{sc.label}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setPreviewUrl(doc.documentUrl)}
                      className="p-2 bg-[#1e1e2e] rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Voir le document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {doc.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => { setSelectedDoc(doc); setReviewNote('') }}
                          className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/30 transition-colors"
                        >
                          Examiner
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Rejection note */}
                {doc.status === 'REJECTED' && doc.note && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-xs text-red-400">Motif du rejet : {doc.note}</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-white mb-4">Examiner le document</h3>

              {/* Doc info */}
              <div className="space-y-3 mb-6">
                <div className="p-4 bg-[#080810] rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Prestataire</p>
                  <p className="text-white font-medium">{selectedDoc.user.firstName} {selectedDoc.user.lastName}</p>
                  <p className="text-xs text-gray-500">{selectedDoc.user.email || selectedDoc.user.phone}</p>
                </div>
                <div className="p-4 bg-[#080810] rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">Document</p>
                  <p className="text-white font-medium">{DOC_TYPE_LABELS[selectedDoc.documentType]}</p>
                  <a
                    href={selectedDoc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#ff6b35] text-sm mt-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ouvrir le fichier
                  </a>
                </div>
              </div>

              {/* Note */}
              <div className="mb-6">
                <label className="text-sm text-gray-400 mb-2 block">Note (obligatoire pour un rejet)</label>
                <textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Raison du rejet ou commentaire..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35] text-sm resize-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="flex-1 py-3 bg-[#1e1e2e] text-gray-400 rounded-xl font-medium hover:bg-[#2a2a3a] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={actionLoading || !reviewNote.trim()}
                  className="flex-1 py-3 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition-colors disabled:opacity-40"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Rejeter'}
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Approuver'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c16] rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#1e1e2e]">
                <h3 className="text-white font-medium">Aperçu du document</h3>
                <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-center min-h-[400px]">
                {previewUrl.match(/\.pdf/i) ? (
                  <iframe src={previewUrl} className="w-full h-[70vh] rounded-lg" />
                ) : (
                  <img src={previewUrl} alt="Document" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
