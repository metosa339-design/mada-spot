'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Phone, MessageCircle, Mail, AlertTriangle,
  Eye, EyeOff, UserX, XCircle, Loader2, RefreshCw, Filter
} from 'lucide-react'

interface ScanAlert {
  id: string
  messageId: string
  senderId: string
  receiverId: string
  content: string
  matchType: string
  matchValue: string
  status: string
  reviewedBy: string | null
  actionTaken: string | null
  createdAt: string
}

const MATCH_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  phone: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', icon: Phone },
  whatsapp: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: MessageCircle },
  email: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Mail },
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/20 text-amber-400',
  REVIEWED: 'bg-blue-500/20 text-blue-400',
  MASKED: 'bg-red-500/20 text-red-400',
  DISMISSED: 'bg-gray-500/20 text-gray-400',
}

export default function MessageScanAlerts() {
  const [alerts, setAlerts] = useState<ScanAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)
  const [stats, setStats] = useState({ pending: 0, today: 0, week: 0 })

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/admin/scan-alerts?${params}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setAlerts(data.alerts || [])
        setTotal(data.total || 0)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [statusFilter, typeFilter])

  const fetchStats = useCallback(async () => {
    try {
      // Fetch all to compute stats
      const res = await fetch('/api/admin/scan-alerts?limit=1000', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        const all: ScanAlert[] = data.alerts || []
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
        setStats({
          pending: all.filter(a => a.status === 'PENDING').length,
          today: all.filter(a => new Date(a.createdAt) >= todayStart).length,
          week: all.filter(a => new Date(a.createdAt) >= weekStart).length,
        })
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchAlerts(); fetchStats() }, [fetchAlerts, fetchStats])

  const handleAction = async (id: string, actionTaken: string) => {
    setActioning(id)
    try {
      await fetch(`/api/admin/scan-alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ actionTaken }),
      })
      await fetchAlerts()
      await fetchStats()
    } catch { /* ignore */ }
    finally { setActioning(null) }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'En attente', value: stats.pending, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertTriangle },
          { label: "Aujourd'hui", value: stats.today, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Shield },
          { label: 'Cette semaine', value: stats.week, color: 'text-purple-400', bg: 'bg-purple-500/10', icon: Eye },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${kpi.bg} border border-[#1e1e2e] rounded-xl p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
              <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-40`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="REVIEWED">Examin&eacute;</option>
          <option value="MASKED">Masqu&eacute;</option>
          <option value="DISMISSED">Rejet&eacute;</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-[#0c0c16] border border-[#1e1e2e] rounded-xl text-gray-300 text-sm focus:outline-none focus:border-[#ff6b35]"
        >
          <option value="">Tous les types</option>
          <option value="phone">T&eacute;l&eacute;phone</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </select>
        <button
          onClick={() => { fetchAlerts(); fetchStats() }}
          className="ml-auto p-2 text-gray-400 hover:text-[#ff6b35] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500">{total} alertes</span>
      </div>

      {/* Alerts list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Aucune alerte trouv&eacute;e</p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, index) => {
            const matchStyle = MATCH_COLORS[alert.matchType] || MATCH_COLORS.phone
            const MatchIcon = matchStyle.icon
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4 hover:border-[#ff6b35]/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Match type icon */}
                  <div className={`p-2 rounded-lg ${matchStyle.bg} flex-shrink-0`}>
                    <MatchIcon className={`w-4 h-4 ${matchStyle.text}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${matchStyle.bg} ${matchStyle.text}`}>
                        {alert.matchType}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${STATUS_COLORS[alert.status] || ''}`}>
                        {alert.status}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {new Date(alert.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-gray-300 mb-1">
                      {alert.content.length > 100 ? alert.content.slice(0, 100) + '...' : alert.content}
                    </p>

                    {/* Detected value */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">D&eacute;tect&eacute; :</span>
                      <span className={`font-mono px-2 py-0.5 rounded ${matchStyle.bg} ${matchStyle.text}`}>
                        {alert.matchValue}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {alert.status === 'PENDING' && (
                    <div className="flex gap-1 flex-shrink-0">
                      {actioning === alert.id ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleAction(alert.id, 'masked')}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Masquer le message"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAction(alert.id, 'suspended')}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                            title="Suspendre le compte"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAction(alert.id, 'dismissed')}
                            className="p-1.5 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors"
                            title="Rejeter l'alerte"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
