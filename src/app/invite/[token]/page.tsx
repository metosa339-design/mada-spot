'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, AlertCircle, MapPin, Building } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/image-url'
import { useTrans } from '@/i18n'

interface EstablishmentInfo {
  id: string
  name: string
  type: string
  city: string
  coverImage: string | null
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const t = useTrans('invitePage')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [establishment, setEstablishment] = useState<EstablishmentInfo | null>(null)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ name: '', phone: '' })

  useEffect(() => {
    params.then(p => {
      setToken(p.token)
      fetch(`/api/invite/${p.token}`)
        .then(res => res.json())
        .then(data => {
          if (data.establishment) {
            setEstablishment(data.establishment)
            setEmail(data.email || '')
            // Claim par téléphone (pas d'email) : préremplir le numéro connu
            if (!data.email && data.phone) {
              setForm(prev => ({ ...prev, phone: data.phone }))
            }
          } else {
            setError(data.error || t.invalidDefault)
          }
        })
        .catch(() => setError(t.connectionError))
        .finally(() => setLoading(false))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    // Claim par téléphone (pas d'email) : le numéro devient l'identifiant, requis
    if (!email && !form.phone.trim()) {
      setError(t.phoneRequired)
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email, phone: form.phone }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        // Le propriétaire est désormais connecté (lien magique) : on l'emmène
        // directement sur son tableau de bord.
        setTimeout(() => {
          window.location.href = data.redirectTo || '/dashboard'
        }, 1800)
      } else {
        setError(data.error || t.claimError)
      }
    } catch {
      setError(t.connectionError)
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeLabel = (type: string | undefined) => {
    if (type === 'HOTEL') return t.typeHotel
    if (type === 'RESTAURANT') return t.typeRestaurant
    if (type === 'ATTRACTION') return t.typeAttraction
    return t.typeProvider
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
      </div>
    )
  }

  if (error && !establishment) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t.invalidTitle}</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t.successTitle}</h2>
          <p className="text-gray-400 mb-6">
            {t.successDesc} <strong className="text-white">{establishment?.name}</strong> {t.successDescSuffix}
          </p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#ff6b35]/90 transition-colors"
          >
            {t.dashboardBtn}
          </a>
          <p className="text-gray-500 text-xs mt-3">{t.redirecting}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0c0c16] border border-[#1e1e2e] rounded-2xl overflow-hidden">
        {/* Header with establishment info */}
        <div className="relative h-40 bg-gradient-to-br from-[#ff6b35] to-[#ff1493]">
          {establishment?.coverImage && (
            <Image src={getImageUrl(establishment.coverImage)} alt="" fill className="object-cover opacity-40" />
          )}
          <div className="absolute inset-0 flex items-end p-6">
            <div>
              <p className="text-white/80 text-sm mb-1">{t.inviteHeader}</p>
              <h1 className="text-2xl font-bold text-white">{establishment?.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {getTypeLabel(establishment?.type)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {establishment?.city}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-400 text-sm">
            {t.formIntro}
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.nameLabel}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]"
              placeholder={t.namePlaceholder}
            />
          </div>

          {email && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">{t.phoneLabel}{!email ? ' *' : ''}</label>
            <input
              type="tel"
              required={!email}
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]"
              placeholder={t.phonePlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            className="w-full py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#ff6b35]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t.claimBtn}
          </button>
        </form>
      </div>
    </div>
  )
}
