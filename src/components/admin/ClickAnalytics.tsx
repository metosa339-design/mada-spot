'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MousePointer, Phone, MessageCircle, Mail, Globe, Loader2, TrendingUp } from 'lucide-react'

interface ClickData {
  total: number
  byType: Record<string, number>
  dailyChart: { date: string; count: number }[]
  topEstablishments: { id: string; name: string; type: string; city: string; clicks: number }[]
}

const TYPE_ICONS: Record<string, any> = {
  phone: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  website: Globe,
  facebook: Globe,
  instagram: Globe,
}

const TYPE_COLORS: Record<string, string> = {
  phone: '#06b6d4',
  whatsapp: '#10b981',
  email: '#8b5cf6',
  website: '#f59e0b',
  facebook: '#3b82f6',
  instagram: '#ec4899',
}

export default function ClickAnalytics() {
  const [data, setData] = useState<ClickData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats/clicks', { credentials: 'include' })
      .then(res => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-20 text-gray-500">Erreur de chargement</div>

  const maxDaily = Math.max(...(data.dailyChart.map(d => d.count) || [1]), 1)
  const topType = Object.entries(data.byType).sort((a, b) => b[1] - a[1])[0]
  const maxTypeValue = Math.max(...Object.values(data.byType), 1)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total clics (30j)', value: data.total, color: 'text-[#ff6b35]', bg: 'bg-[#ff6b35]/10' },
          { label: 'Type dominant', value: topType ? topType[0] : '-', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          { label: 'Établissements', value: data.topEstablishments.length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`${kpi.bg} border border-[#1e1e2e] rounded-xl p-4`}
          >
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ff6b35]" />
          Clics par jour (30 jours)
        </h3>
        <div className="overflow-x-auto">
          <svg width={Math.max(data.dailyChart.length * 20, 600)} height={180} className="w-full">
            {data.dailyChart.map((d, i) => {
              const barHeight = (d.count / maxDaily) * 140
              const x = (i / Math.max(data.dailyChart.length - 1, 1)) * (Math.max(data.dailyChart.length * 20, 600) - 40) + 20
              return (
                <g key={d.date}>
                  <motion.rect
                    x={x - 6}
                    y={160 - barHeight}
                    width={12}
                    height={barHeight}
                    rx={3}
                    fill="#ff6b35"
                    initial={{ height: 0, y: 160 }}
                    animate={{ height: barHeight, y: 160 - barHeight }}
                    transition={{ delay: i * 0.02, duration: 0.4 }}
                    opacity={0.8}
                  />
                  {i % 5 === 0 && (
                    <text x={x} y={175} textAnchor="middle" className="fill-gray-600 text-[9px]">
                      {d.date.slice(5)}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Type distribution */}
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4">Répartition par type</h3>
          <div className="space-y-3">
            {Object.entries(data.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const Icon = TYPE_ICONS[type] || MousePointer
              const color = TYPE_COLORS[type] || '#ff6b35'
              const width = (count / maxTypeValue) * 100
              return (
                <div key={type} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                  <span className="text-xs text-gray-400 w-20">{type}</span>
                  <div className="flex-1 h-6 bg-[#1e1e2e] rounded-full overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white font-medium">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top establishments */}
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4">Top 10 établissements</h3>
          <div className="space-y-2">
            {data.topEstablishments.map((est, i) => (
              <div key={est.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-gray-600 w-5">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate text-xs">{est.name}</p>
                  <p className="text-[10px] text-gray-600">{est.city}</p>
                </div>
                <span className="text-xs font-bold text-[#ff6b35]">{est.clicks}</span>
              </div>
            ))}
            {data.topEstablishments.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">Aucune donnée</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
