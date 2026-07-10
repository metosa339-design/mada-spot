'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Calendar, Percent, Trash2, Save,
  Sun, Snowflake, PartyPopper, Edit2, X,
  Building2, UtensilsCrossed, Landmark, Briefcase, ArrowRight,
  ChevronDown, ChevronUp
} from 'lucide-react'
import type { SeasonalPricingItem } from '@/types/dashboard'
import { useTrans } from '@/i18n'

const SEASON_PRESETS: { nameKey: 'presetHigh' | 'presetLow' | 'presetHoliday'; monthsKey: 'presetHighMonths' | 'presetLowMonths' | 'presetHolidayMonths'; icon: typeof Sun; color: string; multiplier: number }[] = [
  { nameKey: 'presetHigh', icon: Sun, color: '#f59e0b', multiplier: 1.5, monthsKey: 'presetHighMonths' },
  { nameKey: 'presetLow', icon: Snowflake, color: '#3b82f6', multiplier: 0.8, monthsKey: 'presetLowMonths' },
  { nameKey: 'presetHoliday', icon: PartyPopper, color: '#ec4899', multiplier: 1.3, monthsKey: 'presetHolidayMonths' },
]

const TYPE_ICONS: Record<string, typeof Building2> = {
  HOTEL: Building2,
  RESTAURANT: UtensilsCrossed,
  ATTRACTION: Landmark,
  PROVIDER: Briefcase,
}

const TYPE_LABEL_KEYS: Record<string, 'typeHotel' | 'typeRestaurant' | 'typeAttraction' | 'typeProvider'> = {
  HOTEL: 'typeHotel',
  RESTAURANT: 'typeRestaurant',
  ATTRACTION: 'typeAttraction',
  PROVIDER: 'typeProvider',
}

interface PriceItem {
  label: string
  value: number
}

interface EstablishmentPricing {
  id: string
  name: string
  type: string
  prices: PriceItem[]
}

interface EditingSeason {
  id?: string
  name: string
  startDate: string
  endDate: string
  priceMultiplier: number
  priceMultipliers: Record<string, number>
  isActive: boolean
}

const formatMGA = (value: number) => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value)) + ' MGA'
}

export default function TarifsPage() {
  const t = useTrans('dashboardTarifs')
  const [seasons, setSeasons] = useState<SeasonalPricingItem[]>([])
  const [establishments, setEstablishments] = useState<EstablishmentPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditingSeason | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPerPriceMultipliers, setShowPerPriceMultipliers] = useState(false)

  const allPriceLabels = establishments.flatMap(e => e.prices.map(p => p.label))
  const uniquePriceLabels = [...new Set(allPriceLabels)]

  useEffect(() => {
    fetchSeasons()
  }, [])

  const fetchSeasons = async () => {
    try {
      const res = await fetch('/api/dashboard/pricing')
      if (res.ok) {
        const data = await res.json()
        setSeasons(data.seasons || [])
        setEstablishments(data.establishments || [])
      }
    } catch (err) {
      console.error('Error fetching seasons:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const method = editing.id ? 'PUT' : 'POST'
      const hasPerPrice = Object.keys(editing.priceMultipliers).length > 0
      const payload = {
        ...editing,
        priceMultipliers: hasPerPrice ? editing.priceMultipliers : null,
      }
      const res = await fetch('/api/dashboard/pricing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        await fetchSeasons()
        setEditing(null)
        setShowPerPriceMultipliers(false)
      }
    } catch (err) {
      console.error('Error saving season:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t.confirmDeletePeriod)) return
    try {
      await fetch(`/api/dashboard/pricing?id=${id}`, { method: 'DELETE' })
      await fetchSeasons()
    } catch (err) {
      console.error('Error deleting season:', err)
    }
  }

  const formatMultiplier = (m: number) => {
    if (m > 1) return `+${((m - 1) * 100).toFixed(0)}%`
    if (m < 1) return `${((m - 1) * 100).toFixed(0)}%`
    return t.normalRate
  }

  const getMultiplierForPrice = (season: SeasonalPricingItem, priceLabel: string): number => {
    return season.priceMultipliers?.[priceLabel] || season.priceMultiplier
  }

  const getEditingMultiplierForPrice = (priceLabel: string): number => {
    if (!editing) return 1
    return editing.priceMultipliers[priceLabel] ?? editing.priceMultiplier
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="h-8 w-48 bg-white rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">{t.pageTitle}</h1>
          <p className="text-[#94A3B8] text-sm mt-1">{t.pageSubtitle}</p>
        </div>
        <button
          onClick={() => {
            setEditing({
              name: '', startDate: '', endDate: '', priceMultiplier: 1.0, priceMultipliers: {}, isActive: true
            })
            setShowPerPriceMultipliers(false)
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] hover:bg-[#F97316] text-[#0F172A] rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t.newPeriod}
        </button>
      </div>

      {/* Vos prix actuels */}
      {establishments.length > 0 && establishments.some(e => e.prices.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-[#94A3B8]">{t.currentPrices}</h2>
          {establishments.filter(e => e.prices.length > 0).map((estab) => {
            const TypeIcon = TYPE_ICONS[estab.type] || Building2
            return (
              <div key={estab.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFF7ED] flex items-center justify-center">
                    <TypeIcon className="w-4.5 h-4.5 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{estab.name}</p>
                    <p className="text-xs text-[#94A3B8]">{TYPE_LABEL_KEYS[estab.type] ? t[TYPE_LABEL_KEYS[estab.type]] : estab.type}</p>
                  </div>
                </div>

                {/* Tableau des prix */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E2E8F0]">
                        <th className="text-left text-xs text-[#94A3B8] font-medium pb-2 pr-4">{t.priceType}</th>
                        <th className="text-right text-xs text-[#94A3B8] font-medium pb-2 pr-4">{t.basePrice}</th>
                        {seasons.filter(s => s.isActive).map((season) => (
                          <th key={season.id} className="text-right text-xs font-medium pb-2 pr-4">
                            <span className={
                              season.priceMultiplier > 1 ? 'text-yellow-400' :
                              season.priceMultiplier < 1 ? 'text-blue-400' : 'text-[#94A3B8]'
                            }>
                              {season.name}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {estab.prices.map((price, idx) => (
                        <tr key={idx} className="border-b border-[#E2E8F0] last:border-0">
                          <td className="py-2.5 pr-4 text-[#334155]">{price.label}</td>
                          <td className="py-2.5 pr-4 text-right text-[#0F172A] font-medium">{formatMGA(price.value)}</td>
                          {seasons.filter(s => s.isActive).map((season) => {
                            const multiplier = getMultiplierForPrice(season, price.label)
                            const result = price.value * multiplier
                            const diff = result - price.value
                            return (
                              <td key={season.id} className="py-2.5 pr-4 text-right">
                                <span className="text-[#0F172A] font-medium">{formatMGA(result)}</span>
                                <br />
                                <span className={`text-[10px] ${
                                  diff > 0 ? 'text-yellow-400/70' :
                                  diff < 0 ? 'text-blue-400/70' : 'text-[#64748B]'
                                }`}>
                                  {diff > 0 ? '+' : ''}{formatMGA(diff)}
                                  {' '}({formatMultiplier(multiplier)})
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {seasons.filter(s => s.isActive).length === 0 && (
                  <p className="text-xs text-[#94A3B8] italic">{t.seasonsHint}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Presets */}
      <div>
        <h2 className="text-sm font-medium text-[#94A3B8] mb-3">{t.quickModels}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SEASON_PRESETS.map((preset) => (
            <motion.button
              key={preset.nameKey}
              whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setEditing({
                  name: t[preset.nameKey],
                  startDate: '',
                  endDate: '',
                  priceMultiplier: preset.multiplier,
                  priceMultipliers: {},
                  isActive: true,
                })
                setShowPerPriceMultipliers(false)
              }}
              className="flex items-center gap-3 p-4 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${preset.color}15` }}>
                <preset.icon className="w-5 h-5" style={{ color: preset.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{t[preset.nameKey]}</p>
                <p className="text-xs text-[#94A3B8]">{t[preset.monthsKey]} · {formatMultiplier(preset.multiplier)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#FF6B35]/30 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#0F172A]">
              {editing.id ? t.editPeriodTitle : t.newPeriodTitle}
            </h3>
            <button onClick={() => { setEditing(null); setShowPerPriceMultipliers(false) }} className="text-[#94A3B8] hover:text-[#0F172A]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">{t.periodName}</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder={t.periodNamePlaceholder}
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">{t.globalMultiplier}</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={editing.priceMultiplier}
                  onChange={(e) => setEditing(prev => prev ? { ...prev, priceMultiplier: parseFloat(e.target.value) } : null)}
                  className="flex-1 accent-[#FF6B35]"
                />
                <span className={`text-sm font-bold min-w-[60px] text-right ${
                  editing.priceMultiplier > 1 ? 'text-yellow-400' :
                  editing.priceMultiplier < 1 ? 'text-blue-400' : 'text-[#94A3B8]'
                }`}>
                  {formatMultiplier(editing.priceMultiplier)}
                </span>
              </div>
            </div>
          </div>

          {/* Per-price multipliers */}
          {uniquePriceLabels.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowPerPriceMultipliers(!showPerPriceMultipliers)}
                className="flex items-center gap-2 text-sm text-[#FF6B35] hover:text-[#F97316] transition-colors"
              >
                {showPerPriceMultipliers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {t.perPriceMultipliers}
              </button>

              {showPerPriceMultipliers && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white rounded-xl p-4 space-y-3"
                >
                  <p className="text-xs text-[#94A3B8] mb-2">
                    {t.perPriceHelp}
                  </p>
                  {uniquePriceLabels.map((label) => {
                    const hasCustom = label in editing.priceMultipliers
                    const currentValue = editing.priceMultipliers[label] ?? editing.priceMultiplier
                    const basePrice = establishments.flatMap(e => e.prices).find(p => p.label === label)?.value
                    return (
                      <div key={label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#334155]">{label}</span>
                            {hasCustom && (
                              <button
                                onClick={() => {
                                  setEditing(prev => {
                                    if (!prev) return null
                                    const updated = { ...prev.priceMultipliers }
                                    delete updated[label]
                                    return { ...prev, priceMultipliers: updated }
                                  })
                                }}
                                className="text-[10px] text-[#94A3B8] hover:text-red-400 transition-colors"
                              >
                                {t.resetBtn}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${
                              currentValue > 1 ? 'text-yellow-400' :
                              currentValue < 1 ? 'text-blue-400' : 'text-[#94A3B8]'
                            }`}>
                              {formatMultiplier(currentValue)}
                            </span>
                            {basePrice !== undefined && (
                              <span className="text-[10px] text-[#64748B]">
                                = {formatMGA(basePrice * currentValue)}
                              </span>
                            )}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={currentValue}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            setEditing(prev => {
                              if (!prev) return null
                              return {
                                ...prev,
                                priceMultipliers: { ...prev.priceMultipliers, [label]: val },
                              }
                            })
                          }}
                          className="w-full accent-[#FF6B35]"
                        />
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </div>
          )}

          {/* Apercu en temps reel des prix avec multiplicateur */}
          {establishments.some(e => e.prices.length > 0) && (
            editing.priceMultiplier !== 1 || Object.keys(editing.priceMultipliers).length > 0
          ) && (
            <div className="bg-white rounded-xl p-4 space-y-2">
              <p className="text-xs text-[#94A3B8] font-medium mb-2">{t.previewTitle}</p>
              {establishments.filter(e => e.prices.length > 0).map((estab) => (
                <div key={estab.id} className="space-y-1">
                  <p className="text-xs text-[#94A3B8]">{estab.name}</p>
                  {estab.prices.map((price, idx) => {
                    const multiplier = getEditingMultiplierForPrice(price.label)
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-[#94A3B8] w-40 truncate">{price.label}</span>
                        <span className="text-[#94A3B8]">{formatMGA(price.value)}</span>
                        <ArrowRight className="w-3 h-3 text-[#64748B]" />
                        <span className={`font-semibold ${
                          multiplier > 1 ? 'text-yellow-400' : multiplier < 1 ? 'text-blue-400' : 'text-[#94A3B8]'
                        }`}>
                          {formatMGA(price.value * multiplier)}
                        </span>
                        <span className="text-[#64748B] text-[10px]">
                          ({formatMultiplier(multiplier)})
                        </span>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">{t.startDateLabel}</label>
              <input
                type="date"
                value={editing.startDate}
                onChange={(e) => setEditing(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#94A3B8] mb-1">{t.endDateLabel}</label>
              <input
                type="date"
                value={editing.endDate}
                onChange={(e) => setEditing(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                className="w-full px-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A] text-sm focus:outline-none focus:border-[#FF6B35]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setEditing(null); setShowPerPriceMultipliers(false) }}
              className="px-4 py-2 text-[#94A3B8] hover:text-[#0F172A] text-sm transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editing.name || !editing.startDate || !editing.endDate}
              className="flex items-center gap-2 px-5 py-2 bg-[#FF6B35] hover:bg-[#F97316] text-[#0F172A] rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t.saveBtn}
            </button>
          </div>
        </motion.div>
      )}

      {/* Existing Seasons */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[#94A3B8]">{t.activePeriods}</h2>
        {seasons.length > 0 ? (
          seasons.map((season) => (
            <motion.div
              key={season.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-3"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  season.priceMultiplier > 1 ? 'bg-yellow-500/10' :
                  season.priceMultiplier < 1 ? 'bg-blue-500/10' : 'bg-[#F1F5F9]'
                }`}>
                  <Percent className={`w-5 h-5 ${
                    season.priceMultiplier > 1 ? 'text-yellow-400' :
                    season.priceMultiplier < 1 ? 'text-blue-400' : 'text-[#94A3B8]'
                  }`} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-[#0F172A]">{season.name}</p>
                  <p className="text-xs text-[#94A3B8]">
                    {new Date(season.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' \u2192 '}
                    {new Date(season.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <span className={`text-sm font-bold ${
                  season.priceMultiplier > 1 ? 'text-yellow-400' :
                  season.priceMultiplier < 1 ? 'text-blue-400' : 'text-[#94A3B8]'
                }`}>
                  {formatMultiplier(season.priceMultiplier)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing({
                        id: season.id,
                        name: season.name,
                        startDate: season.startDate.split('T')[0],
                        endDate: season.endDate.split('T')[0],
                        priceMultiplier: season.priceMultiplier,
                        priceMultipliers: season.priceMultipliers ? { ...season.priceMultipliers } : {},
                        isActive: season.isActive,
                      })
                      setShowPerPriceMultipliers(!!season.priceMultipliers && Object.keys(season.priceMultipliers).length > 0)
                    }}
                    className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-white rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(season.id)}
                    className="p-2 text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Per-price multipliers display */}
              {season.priceMultipliers && Object.keys(season.priceMultipliers).length > 0 && (
                <div className="ml-14 flex flex-wrap gap-2">
                  {Object.entries(season.priceMultipliers).map(([label, mult]) => (
                    <span
                      key={label}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                        mult > 1 ? 'bg-yellow-500/10 text-yellow-400' :
                        mult < 1 ? 'bg-blue-500/10 text-blue-400' : 'bg-[#F1F5F9] text-[#94A3B8]'
                      }`}
                    >
                      {label}: {formatMultiplier(mult)}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <div className="p-8 bg-white border border-[#E2E8F0] rounded-2xl text-center">
            <Calendar className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">{t.noPeriodTitle}</p>
            <p className="text-xs text-[#94A3B8] mt-1">{t.noPeriodHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
