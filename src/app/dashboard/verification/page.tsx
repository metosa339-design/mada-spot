'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Upload, FileText, CheckCircle, Clock, XCircle,
  AlertTriangle, BadgeCheck, Eye
} from 'lucide-react'
import { useTrans } from '@/i18n'

interface VerificationDoc {
  id: string
  documentType: string
  documentUrl: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  note?: string | null
  createdAt: string
}

const DOC_TYPES: { id: string; labelKey: string; descKey: string }[] = [
  { id: 'nif', labelKey: 'doc_nif', descKey: 'doc_nifDesc' },
  { id: 'stat', labelKey: 'doc_stat', descKey: 'doc_statDesc' },
  { id: 'business_license', labelKey: 'doc_business_license', descKey: 'doc_business_licenseDesc' },
  { id: 'id_card', labelKey: 'doc_id_card', descKey: 'doc_id_cardDesc' },
]

export default function VerificationPage() {
  const t = useTrans('dashboardVerification')
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
  const isFullyVerified = verifiedCount >= 2

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
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {t.subtitle}
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
              {isFullyVerified ? t.verifiedTitle : t.inProgressTitle}
            </h2>
            <p className="text-sm text-gray-400">
              {verifiedCount}/{totalRequired} {t.docsVerifiedSuffix}
              {isFullyVerified && ` ${t.verifiedNote}`}
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
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t.whyVerify}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: BadgeCheck, textKey: 'benefit1', color: '#10b981' },
            { icon: Eye, textKey: 'benefit2', color: '#3b82f6' },
            { icon: ShieldCheck, textKey: 'benefit3', color: '#f59e0b' },
          ].map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="flex items-start gap-2 p-3 bg-white/5 rounded-xl">
                <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: item.color }} />
                <span className="text-xs text-gray-300">{t[item.textKey]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-400">{t.requiredDocs}</h2>
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
                <p className="text-sm font-medium text-gray-900">{t[docType.labelKey]}</p>
                <p className="text-xs text-gray-400">{t[docType.descKey]}</p>
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
                    {t.statusVerified}
                  </span>
                ) : doc?.status === 'PENDING' ? (
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full">
                    {t.statusPending}
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
                    {isUploading ? t.uploadingBtn : doc?.status === 'REJECTED' ? t.resubmitBtn : t.uploadBtn}
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
