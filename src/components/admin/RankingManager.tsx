'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy, Search, ArrowUp, ArrowDown, Star, Eye, Save, Loader2,
  Hotel, UtensilsCrossed, MapPin, Briefcase,
  CheckCircle, Crown, RotateCcw, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/image-url'

interface RankedEstablishment {
  id: string
  name: string
  type: string
  city: string
  coverImage: string | null
  rating: number
  reviewCount: number
  viewCount: number
  isFeatured: boolean
  isPremium: boolean
  displayOrder: number
  isClaimed: boolean
}

const TYPE_TABS = [
  { id: 'all', label: 'Tous', icon: Trophy },
  { id: 'HOTEL', label: 'Hôtels', icon: Hotel },
  { id: 'RESTAURANT', label: 'Restaurants', icon: UtensilsCrossed },
  { id: 'ATTRACTION', label: 'Attractions', icon: MapPin },
  { id: 'PROVIDER', label: 'Prestataires', icon: Briefcase },
]

export default function RankingManager() {
  const [establishments, setEstablishments] = useState<RankedEstablishment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [total, setTotal] = useState(0)
  const [typeFilter, setTypeFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [cities, setCities] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (cityFilter) params.set('city', cityFilter)
      if (search) params.set('search', search)
      params.set('limit', '200')

      const res = await fetch(`/api/admin/ranking?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setEstablishments(data.establishments || [])
        setTotal(data.total || 0)
        if (data.cities) setCities(data.cities)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [typeFilter, cityFilter, search])

  useEffect(() => { fetchData() }, [fetchData])

  const moveUp = (index: number) => {
    if (index === 0) return
    const items = [...establishments]
    const temp = items[index].displayOrder
    items[index].displayOrder = items[index - 1].displayOrder
    items[index - 1].displayOrder = temp
    ;[items[index], items[index - 1]] = [items[index - 1], items[index]]
    setEstablishments(items)
    setHasChanges(true)
  }

  const moveDown = (index: number) => {
    if (index >= establishments.length - 1) return
    const items = [...establishments]
    const temp = items[index].displayOrder
    items[index].displayOrder = items[index + 1].displayOrder
    items[index + 1].displayOrder = temp
    ;[items[index], items[index + 1]] = [items[index + 1], items[index]]
    setEstablishments(items)
    setHasChanges(true)
  }

  const setOrder = (id: string, value: number) => {
    setEstablishments(prev =>
      prev.map(e => e.id === id ? { ...e, displayOrder: value } : e)
    )
    setHasChanges(true)
    setEditingId(null)
  }

  const toggleFeatured = (id: string) => {
    setEstablishments(prev =>
      prev.map(e => e.id === id ? { ...e, isFeatured: !e.isFeatured } : e)
    )
    setHasChanges(true)
  }

  const autoRank = () => {
    const items = [...establishments]
    items.forEach((item, i) => {
      item.displayOrder = (items.length - i) * 10
    })
    setEstablishments(items)
    setHasChanges(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Save rankings
      const rankings = establishments.map(e => ({ id: e.id, displayOrder: e.displayOrder }))
      const res = await fetch('/api/admin/ranking', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rankings }),
      })

      // Save featured toggles individually
      const featuredChanges = establishments.filter(e => e.isFeatured !== undefined)
      for (const est of featuredChanges) {
        await fetch('/api/admin/establishments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: est.id, isFeatured: est.isFeatured }),
        }).catch(() => {})
      }

      if (res.ok) {
        setHasChanges(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-center gap-3 p-4 bg-[#ff6b35]/5 border border-[#ff6b35]/20 rounded-xl">
        <Trophy className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#ff6b35]">Classement Manuel</p>
          <p className="text-xs text-gray-500">
            Les établissements avec un displayOrder &gt; 0 apparaissent en premier. Tri : displayOrder DESC &rarr; Featured &rarr; Note.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_TABS.map(tab => {
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  typeFilter === tab.id
                    ? 'bg-[#ff6b35] text-white'
                    : 'bg-[#0c0c16] text-gray-400 border border-[#1e1e2e] hover:border-[#ff6b35]/50'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] text-sm"
            />
          </div>
          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35] max-w-[200px]"
            >
              <option value="">Toutes les villes</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={autoRank}
            className="flex items-center gap-2 px-4 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-400 text-sm hover:border-[#ff6b35]/50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Auto-numéroter
          </button>
          <button
            onClick={() => { fetchData(); setHasChanges(false) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-400 text-sm hover:border-[#ff6b35]/50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{total} résultats</span>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> Sauvegardé
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              hasChanges
                ? 'bg-[#ff6b35] text-white hover:bg-[#ff6b35]/90'
                : 'bg-[#1e1e2e] text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Ranking list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : establishments.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucun établissement trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {establishments.map((est, index) => (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-3 hover:border-[#ff6b35]/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                {/* Position */}
                <div className="flex flex-col items-center gap-0.5 w-8 flex-shrink-0">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="p-0.5 text-gray-600 hover:text-[#ff6b35] disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-gray-500">{index + 1}</span>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index >= establishments.length - 1}
                    className="p-0.5 text-gray-600 hover:text-[#ff6b35] disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#1e1e2e] flex-shrink-0 relative">
                  {est.coverImage ? (
                    <Image src={getImageUrl(est.coverImage)} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm truncate">{est.name}</span>
                    {est.isFeatured && (
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    {est.isClaimed && (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                      {est.type === 'HOTEL' ? 'Hôtel' : est.type === 'RESTAURANT' ? 'Restaurant' : est.type === 'ATTRACTION' ? 'Attraction' : 'Prestataire'}
                    </span>
                    <span>{est.city}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400" />
                    <span className="text-white">{est.rating.toFixed(1)}</span>
                    <span className="text-gray-600">({est.reviewCount})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>{est.viewCount}</span>
                  </div>
                </div>

                {/* Display order input */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-600 hidden sm:block">Ordre:</span>
                  {editingId === est.id ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={() => setOrder(est.id, parseInt(editValue) || 0)}
                      onKeyDown={e => { if (e.key === 'Enter') setOrder(est.id, parseInt(editValue) || 0) }}
                      className="w-16 px-2 py-1 bg-[#080810] border border-[#ff6b35] rounded-lg text-white text-sm text-center focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingId(est.id); setEditValue(String(est.displayOrder)) }}
                      className={`w-16 px-2 py-1 rounded-lg text-sm text-center transition-all ${
                        est.displayOrder > 0
                          ? 'bg-[#ff6b35]/20 text-[#ff6b35] border border-[#ff6b35]/30 font-bold'
                          : 'bg-[#1e1e2e] text-gray-500 border border-transparent'
                      }`}
                    >
                      {est.displayOrder}
                    </button>
                  )}
                </div>

                {/* Featured toggle */}
                <button
                  onClick={() => toggleFeatured(est.id)}
                  className={`p-2 rounded-lg transition-all ${
                    est.isFeatured
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-[#1e1e2e] text-gray-600 hover:text-amber-400'
                  }`}
                  title={est.isFeatured ? 'Retirer en vedette' : 'Mettre en vedette'}
                >
                  <Star className={`w-4 h-4 ${est.isFeatured ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
