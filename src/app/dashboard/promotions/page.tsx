'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Plus, Trash2, Clock, Calendar, Percent, Tag,
  Loader2, AlertCircle, CheckCircle, Sparkles, Timer
} from 'lucide-react'

interface Promotion {
  key: string
  title: string
  description: string
  discountPercent: number
  startDate: string
  endDate: string
  isActive: boolean
  establishmentId: string
  establishmentName: string
  createdAt: string
}

interface Establishment {
  id: string
  name: string
  type: string
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endDate).getTime() - Date.now()
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        expired: false,
      }
    }
    setTimeLeft(calc())
    const interval = setInterval(() => setTimeLeft(calc()), 1000)
    return () => clearInterval(interval)
  }, [endDate])

  if (timeLeft.expired) {
    return <span className="text-red-400 text-sm font-medium">Expiré</span>
  }

  return (
    <div className="flex gap-2">
      {[
        { value: timeLeft.days, label: 'j' },
        { value: timeLeft.hours, label: 'h' },
        { value: timeLeft.minutes, label: 'm' },
        { value: timeLeft.seconds, label: 's' },
      ].map((item, i) => (
        <div key={i} className="bg-black/40 rounded-lg px-2 py-1 text-center min-w-[40px]">
          <div className="text-gray-900 font-bold text-sm">{String(item.value).padStart(2, '0')}</div>
          <div className="text-gray-500 text-[10px]">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    establishmentId: '',
    title: '',
    description: '',
    discountPercent: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  })

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/promotions', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setPromotions(data.promotions || [])
        setEstablishments(data.establishments || [])
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.establishmentId || !form.title || !form.endDate) {
      setError('Remplissez tous les champs obligatoires')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/promotions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isActive: true }),
      })
      if (res.ok) {
        setSuccess('Promotion créée !')
        setShowForm(false)
        setForm({ establishmentId: '', title: '', description: '', discountPercent: 10, startDate: new Date().toISOString().split('T')[0], endDate: '' })
        fetchData()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la création')
      }
    } catch {
      setError('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Supprimer cette promotion ?')) return
    try {
      await fetch('/api/dashboard/promotions', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promotionKey: key }),
      })
      fetchData()
    } catch { /* ignore */ }
  }

  const activePromos = promotions.filter(p => p.isActive && new Date(p.endDate) > new Date())
  const expiredPromos = promotions.filter(p => !p.isActive || new Date(p.endDate) <= new Date())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-7 h-7 text-yellow-400" />
            Flash Deals & Promotions
          </h1>
          <p className="text-gray-400 text-sm mt-1">Créez des offres irrésistibles avec compte à rebours</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#ff6b35] to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Nouvelle promotion
        </button>
      </div>

      {/* Success/Error */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm">{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white border border-white/10 rounded-2xl p-6 space-y-4 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Créer une promotion
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Établissement *</label>
                <select
                  value={form.establishmentId}
                  onChange={(e) => setForm(f => ({ ...f, establishmentId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-white/10 rounded-xl text-gray-900 focus:outline-none focus:border-[#ff6b35] transition-colors"
                >
                  <option value="">Sélectionner...</option>
                  {establishments.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Titre de l&apos;offre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: -20% ce week-end !"
                  className="w-full px-4 py-3 bg-gray-50 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="Décrivez votre offre..."
                  className="w-full px-4 py-3 bg-gray-50 border border-white/10 rounded-xl text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-[#ff6b35] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Réduction (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={80}
                    step={5}
                    value={form.discountPercent}
                    onChange={(e) => setForm(f => ({ ...f, discountPercent: parseInt(e.target.value) }))}
                    className="flex-1 accent-[#ff6b35]"
                  />
                  <span className="bg-[#ff6b35] text-white font-bold px-3 py-1 rounded-lg text-sm min-w-[50px] text-center">
                    -{form.discountPercent}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Début</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-3 bg-gray-50 border border-white/10 rounded-xl text-gray-900 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fin *</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-3 bg-gray-50 border border-white/10 rounded-xl text-gray-900 focus:outline-none focus:border-[#ff6b35] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff6b35] to-pink-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Lancer la promo
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-white/5 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
                Annuler
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Active Promotions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-green-400" />
          Promotions actives ({activePromos.length})
        </h2>
        {activePromos.length === 0 ? (
          <div className="bg-white border border-white/10 rounded-2xl p-8 text-center">
            <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucune promotion active</p>
            <p className="text-gray-500 text-sm mt-1">Créez votre première offre flash pour attirer plus de clients</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePromos.map((promo) => (
              <motion.div
                key={promo.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#1a1a24] to-[#1a1a24] border border-[#ff6b35]/30 rounded-2xl p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff6b35]/5 rounded-full -translate-x-4 -translate-y-4" />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-gray-400">{promo.establishmentName}</span>
                    <h3 className="text-gray-900 font-bold text-lg">{promo.title}</h3>
                  </div>
                  <div className="bg-[#ff6b35] text-white font-bold px-3 py-1.5 rounded-xl text-lg flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    {promo.discountPercent}
                  </div>
                </div>

                {promo.description && (
                  <p className="text-gray-400 text-sm mb-3">{promo.description}</p>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(promo.startDate).toLocaleDateString('fr-FR')} → {new Date(promo.endDate).toLocaleDateString('fr-FR')}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Expire dans</p>
                    <CountdownTimer endDate={promo.endDate} />
                  </div>
                  <button
                    onClick={() => handleDelete(promo.key)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Expired/Inactive */}
      {expiredPromos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Promotions passées ({expiredPromos.length})
          </h2>
          <div className="space-y-2">
            {expiredPromos.map((promo) => (
              <div key={promo.key} className="bg-white/50 border border-white/5 rounded-xl p-4 flex items-center justify-between opacity-60">
                <div>
                  <span className="text-xs text-gray-500">{promo.establishmentName}</span>
                  <p className="text-gray-300 font-medium">{promo.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Tag className="w-3 h-3" /> -{promo.discountPercent}% • {new Date(promo.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <button onClick={() => handleDelete(promo.key)} className="p-2 text-gray-600 hover:text-red-400 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
