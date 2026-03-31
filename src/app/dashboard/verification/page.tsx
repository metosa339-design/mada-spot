'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Upload, FileText, CheckCircle, Clock, XCircle,
  AlertTriangle, BadgeCheck, Eye
} from 'lucide-react'

interface VerificationDoc {
  id: string
  documentType: string
  documentUrl: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  note?: string | null
  createdAt: string
}

const DOC_TYPES = [
  { id: 'nif', label: 'NIF (Numéro d\'Identification Fiscale)', description: 'Requis pour la vérification fiscale' },
  { id: 'stat', label: 'Carte STAT', description: 'Numéro statistique de votre entreprise' },
  { id: 'business_license', label: 'Licence d\'exploitation', description: 'Autorisation officielle d\'exercer' },
  { id: 'id_card', label: 'Pièce d\'identité', description: 'CIN du propriétaire / gérant' },
]

export default function VerificationPage() {
  const [documents, setDocuments] = useState<VerificationDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/dashboard/verification')
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'verification')

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) return

      const { url } = await uploadRes.json()

      const res = await fetch('/api/dashboard/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: docType, documentUrl: url }),
      })

      if (res.ok) {
        await fetchDocuments()
      }
    } catch (err) {
      console.error('Error uploading:', err)
    } finally {
      setUploading(null)
    }
  }

  const getDocStatus = (docType: string) => {
    return documents.find(d => d.documentType === docType)
  }

  const verifiedCount = documents.filter(d => d.status === 'VERIFIED').length
  const totalRequired = DOC_TYPES.length
  const isFullyVerified = verifiedCount >= 2 // Au moins 2 documents vérifiés

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vérification du compte</h1>
        <p className="text-gray-400 text-sm mt-1">
          Uploadez vos documents pour obtenir le badge &quot;Établissement Vérifié&quot;
        </p>
      </div>

      {/* Verification Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border ${
          isFullyVerified
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-white border-white/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isFullyVerified ? 'bg-emerald-500/20' : 'bg-[#ff6b35]/10'
          }`}>
            {isFullyVerified ? (
              <BadgeCheck className="w-7 h-7 text-emerald-400" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-[#ff6b35]" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isFullyVerified ? 'Établissement Vérifié' : 'Vérification en cours'}
            </h2>
            <p className="text-sm text-gray-400">
              {verifiedCount}/{totalRequired} documents vérifiés
              {isFullyVerified && ' — Votre badge est affiché sur votre annonce'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyVerified ? 'bg-emerald-500' : 'bg-[#ff6b35]'
            }`}
            style={{ width: `${(verifiedCount / totalRequired) * 100}%` }}
          />
        </div>
      </motion.div>

      {/* Why verify */}
      <div className="bg-white border border-white/10 rounded-2xl p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Pourquoi se vérifier ?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: BadgeCheck, text: 'Badge "Vérifié" visible par les clients', color: '#10b981' },
            { icon: Eye, text: 'Meilleur référencement sur Google (SEO local)', color: '#3b82f6' },
            { icon: ShieldCheck, text: 'Confiance accrue des touristes', color: '#f59e0b' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
              <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: item.color }} />
              <span className="text-xs text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">Documents requis</h2>
        {DOC_TYPES.map((docType) => {
          const doc = getDocStatus(docType.id)
          const isUploading = uploading === docType.id

          return (
            <div
              key={docType.id}
              className="flex items-center gap-4 p-4 bg-white border border-white/10 rounded-xl"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                doc?.status === 'VERIFIED' ? 'bg-emerald-500/10' :
                doc?.status === 'PENDING' ? 'bg-yellow-500/10' :
                doc?.status === 'REJECTED' ? 'bg-red-500/10' :
                'bg-white/5'
              }`}>
                {doc?.status === 'VERIFIED' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                 doc?.status === 'PENDING' ? <Clock className="w-5 h-5 text-yellow-400" /> :
                 doc?.status === 'REJECTED' ? <XCircle className="w-5 h-5 text-red-400" /> :
                 <FileText className="w-5 h-5 text-gray-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{docType.label}</p>
                <p className="text-xs text-gray-400">{docType.description}</p>
                {doc?.status === 'REJECTED' && doc.note && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {doc.note}
                  </p>
                )}
              </div>

              <div>
                {doc?.status === 'VERIFIED' ? (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full">
                    Vérifié
                  </span>
                ) : doc?.status === 'PENDING' ? (
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full">
                    En attente
                  </span>
                ) : (
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                    isUploading ? 'bg-white/5 text-gray-400' : 'bg-[#ff6b35]/10 text-[#ff6b35] hover:bg-[#ff6b35]/20'
                  }`}>
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? 'Upload...' : doc?.status === 'REJECTED' ? 'Re-soumettre' : 'Uploader'}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(docType.id, file)
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
