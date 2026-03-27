'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, AlertCircle, MapPin, Building } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/image-url'

interface EstablishmentInfo {
  id: string
  name: string
  type: string
  city: string
  coverImage: string | null
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
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
          } else {
            setError(data.error || 'Invitation invalide ou expirée')
          }
        })
        .catch(() => setError('Erreur de connexion'))
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
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
      } else {
        setError(data.error || 'Erreur lors de la revendication')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setSubmitting(false)
    }
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
          <h2 className="text-xl font-bold text-white mb-2">Invitation invalide</h2>
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
          <h2 className="text-xl font-bold text-white mb-2">Revendication acceptée !</h2>
          <p className="text-gray-400 mb-6">
            Votre fiche <strong className="text-white">{establishment?.name}</strong> a été revendiquée avec succès.
          </p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#ff6b35]/90 transition-colors"
          >
            Se connecter
          </a>
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
              <p className="text-white/80 text-sm mb-1">Vous êtes invité à revendiquer</p>
              <h1 className="text-2xl font-bold text-white">{establishment?.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-white/70 text-sm">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {establishment?.type === 'HOTEL' ? 'Hôtel' : establishment?.type === 'RESTAURANT' ? 'Restaurant' : establishment?.type === 'ATTRACTION' ? 'Attraction' : 'Prestataire'}
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
            Complétez les informations ci-dessous pour revendiquer cette fiche et en devenir le gestionnaire.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Votre nom complet *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]"
              placeholder="Nom et prénom"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-[#080810] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#ff6b35]"
              placeholder="+261 32 00 000 00"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            className="w-full py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#ff6b35]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Revendiquer cette fiche
          </button>
        </form>
      </div>
    </div>
  )
}
