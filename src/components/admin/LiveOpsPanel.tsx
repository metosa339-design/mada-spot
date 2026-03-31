'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Pill, Phone, CloudLightning, Plus, Trash2, Save,
  Loader2, X, ToggleLeft, ToggleRight, AlertTriangle
} from 'lucide-react'

type LiveTab = 'pharmacies' | 'urgences' | 'meteo'

const TABS: { id: LiveTab; label: string; icon: any }[] = [
  { id: 'pharmacies', label: 'Pharmacies', icon: Pill },
  { id: 'urgences', label: 'Urgences', icon: Phone },
  { id: 'meteo', label: 'Alertes M\u00e9t\u00e9o', icon: CloudLightning },
]

interface Pharmacy {
  id: string; name: string; city: string; phone: string | null; isOnGuard: boolean; isActive: boolean; address: string | null
}
interface EmergencyContact {
  id: string; name: string; phone: string; type: string; city: string | null; is24h: boolean; isActive: boolean
}
interface WeatherAlert {
  id: string; type: string; level: string; title: string; message: string; regions: string | null; isActive: boolean; startDate: string
}

export default function LiveOpsPanel() {
  const [tab, setTab] = useState<LiveTab>('pharmacies')
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [emergencies, setEmergencies] = useState<EmergencyContact[]>([])
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state for each type
  const [pharmaForm, setPharmaForm] = useState({ name: '', city: '', phone: '', address: '' })
  const [emergencyForm, setEmergencyForm] = useState({ name: '', phone: '', type: 'police', city: '' })
  const [weatherForm, setWeatherForm] = useState({ type: 'cyclone', level: 'yellow', title: '', message: '', regions: '', startDate: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'pharmacies') {
        const res = await fetch('/api/admin/pharmacies', { credentials: 'include' })
        if (res.ok) { const data = await res.json(); setPharmacies(data.pharmacies || data.data || []) }
      } else if (tab === 'urgences') {
        const res = await fetch('/api/admin/emergency-contacts', { credentials: 'include' })
        if (res.ok) { const data = await res.json(); setEmergencies(data.contacts || data.data || []) }
      } else {
        const res = await fetch('/api/admin/weather-alerts', { credentials: 'include' })
        if (res.ok) { const data = await res.json(); setWeatherAlerts(data.alerts || data.data || []) }
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [tab])

  useEffect(() => { fetchData() }, [fetchData])

  const resetForm = () => {
    setPharmaForm({ name: '', city: '', phone: '', address: '' })
    setEmergencyForm({ name: '', phone: '', type: 'police', city: '' })
    setWeatherForm({ type: 'cyclone', level: 'yellow', title: '', message: '', regions: '', startDate: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let url = ''
      let body: any = {}
      if (tab === 'pharmacies') {
        url = editingId ? `/api/admin/pharmacies/${editingId}` : '/api/admin/pharmacies'
        body = pharmaForm
      } else if (tab === 'urgences') {
        url = editingId ? `/api/admin/emergency-contacts/${editingId}` : '/api/admin/emergency-contacts'
        body = emergencyForm
      } else {
        url = editingId ? `/api/admin/weather-alerts/${editingId}` : '/api/admin/weather-alerts'
        body = { ...weatherForm, startDate: weatherForm.startDate ? new Date(weatherForm.startDate).toISOString() : new Date().toISOString() }
      }

      await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      resetForm()
      await fetchData()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet \u00e9l\u00e9ment ?')) return
    const endpoint = tab === 'pharmacies' ? 'pharmacies' : tab === 'urgences' ? 'emergency-contacts' : 'weather-alerts'
    await fetch(`/api/admin/${endpoint}/${id}`, { method: 'DELETE', credentials: 'include' })
    await fetchData()
  }

  const toggleGuard = async (id: string, current: boolean) => {
    await fetch(`/api/admin/pharmacies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isOnGuard: !current }),
    })
    await fetchData()
  }

  const LEVEL_COLORS: Record<string, string> = {
    green: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-amber-500/20 text-amber-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); resetForm() }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.id ? 'bg-[#ff6b35] text-white' : 'bg-[#0c0c16] text-gray-400 border border-[#1e1e2e] hover:border-[#ff6b35]/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-[#ff6b35] text-white rounded-xl text-sm font-medium hover:bg-[#ff6b35]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#0c0c16] border border-[#ff6b35]/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">{editingId ? 'Modifier' : 'Nouveau'}</span>
            <button onClick={resetForm} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tab === 'pharmacies' && (
              <>
                <input value={pharmaForm.name} onChange={e => setPharmaForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <input value={pharmaForm.city} onChange={e => setPharmaForm(p => ({ ...p, city: e.target.value }))} placeholder="Ville" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <input value={pharmaForm.phone} onChange={e => setPharmaForm(p => ({ ...p, phone: e.target.value }))} placeholder="T\u00e9l\u00e9phone" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <input value={pharmaForm.address} onChange={e => setPharmaForm(p => ({ ...p, address: e.target.value }))} placeholder="Adresse" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
              </>
            )}
            {tab === 'urgences' && (
              <>
                <input value={emergencyForm.name} onChange={e => setEmergencyForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <input value={emergencyForm.phone} onChange={e => setEmergencyForm(p => ({ ...p, phone: e.target.value }))} placeholder="T\u00e9l\u00e9phone" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <select value={emergencyForm.type} onChange={e => setEmergencyForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]">
                  <option value="police">Police</option>
                  <option value="gendarmerie">Gendarmerie</option>
                  <option value="pompiers">Pompiers</option>
                  <option value="samu">SAMU</option>
                  <option value="hopital">H\u00f4pital</option>
                  <option value="ambassade">Ambassade</option>
                </select>
                <input value={emergencyForm.city} onChange={e => setEmergencyForm(p => ({ ...p, city: e.target.value }))} placeholder="Ville" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
              </>
            )}
            {tab === 'meteo' && (
              <>
                <select value={weatherForm.type} onChange={e => setWeatherForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]">
                  <option value="cyclone">Cyclone</option>
                  <option value="flood">Inondation</option>
                  <option value="storm">Temp\u00eate</option>
                  <option value="heatwave">Canicule</option>
                </select>
                <select value={weatherForm.level} onChange={e => setWeatherForm(p => ({ ...p, level: e.target.value }))} className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]">
                  <option value="green">Vert</option>
                  <option value="yellow">Jaune</option>
                  <option value="orange">Orange</option>
                  <option value="red">Rouge</option>
                </select>
                <input value={weatherForm.title} onChange={e => setWeatherForm(p => ({ ...p, title: e.target.value }))} placeholder="Titre" className="col-span-2 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <textarea value={weatherForm.message} onChange={e => setWeatherForm(p => ({ ...p, message: e.target.value }))} placeholder="Message" rows={2} className="col-span-2 px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35] resize-none" />
                <input value={weatherForm.regions} onChange={e => setWeatherForm(p => ({ ...p, regions: e.target.value }))} placeholder="R\u00e9gions (s\u00e9par\u00e9es par virgule)" className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
                <input type="date" value={weatherForm.startDate} onChange={e => setWeatherForm(p => ({ ...p, startDate: e.target.value }))} className="px-3 py-2 bg-[#080810] border border-[#1e1e2e] rounded-lg text-white text-sm focus:outline-none focus:border-[#ff6b35]" />
              </>
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[#ff6b35] text-white rounded-lg text-sm hover:bg-[#ff6b35]/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </motion.div>
      )}

      {/* Items list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {tab === 'pharmacies' && pharmacies.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-3 flex items-center gap-3 hover:border-[#ff6b35]/20 transition-all"
            >
              <Pill className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{p.city} {p.phone && `\u00b7 ${p.phone}`}</p>
              </div>
              <button onClick={() => toggleGuard(p.id, p.isOnGuard)} className={`p-1.5 rounded-lg transition-colors ${p.isOnGuard ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e1e2e] text-gray-600'}`} title={p.isOnGuard ? 'De garde' : 'Pas de garde'}>
                {p.isOnGuard ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}

          {tab === 'urgences' && emergencies.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-3 flex items-center gap-3 hover:border-[#ff6b35]/20 transition-all"
            >
              <Phone className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{e.name}</p>
                  <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">{e.type}</span>
                  {e.is24h && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">24h</span>}
                </div>
                <p className="text-xs text-gray-500">{e.phone} {e.city && `\u00b7 ${e.city}`}</p>
              </div>
              <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}

          {tab === 'meteo' && weatherAlerts.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-3 hover:border-[#ff6b35]/20 transition-all"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${w.level === 'red' ? 'text-red-400' : w.level === 'orange' ? 'text-orange-400' : 'text-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{w.title}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${LEVEL_COLORS[w.level] || ''}`}>{w.level}</span>
                    <span className="px-1.5 py-0.5 bg-[#1e1e2e] text-gray-400 rounded text-[10px]">{w.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{w.message.slice(0, 80)}{w.message.length > 80 ? '...' : ''}</p>
                  {w.regions && <p className="text-[10px] text-gray-600 mt-0.5">R\u00e9gions: {w.regions}</p>}
                </div>
                <button onClick={() => handleDelete(w.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}

          {((tab === 'pharmacies' && pharmacies.length === 0) ||
            (tab === 'urgences' && emergencies.length === 0) ||
            (tab === 'meteo' && weatherAlerts.length === 0)) && (
            <div className="text-center py-16 text-gray-500">
              <p>Aucun \u00e9l\u00e9ment</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
