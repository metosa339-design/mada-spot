'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, AlertTriangle, Loader2, Hash } from 'lucide-react'

interface SEOData {
  topKeywords: { keyword: string; count: number }[]
  volumeChart: { date: string; count: number }[]
  zeroResultQueries: { query: string; count: number }[]
}

export default function SEOTrends() {
  const [data, setData] = useState<SEOData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats/search-trends', { credentials: 'include' })
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

  const maxVolume = Math.max(...(data.volumeChart.map(d => d.count) || [1]), 1)
  const maxKeyword = Math.max(...(data.topKeywords.map(k => k.count) || [1]), 1)

  // Generate SVG path for line chart
  const chartWidth = 560
  const chartHeight = 140
  const points = data.volumeChart.map((d, i) => {
    const x = data.volumeChart.length > 1 ? (i / (data.volumeChart.length - 1)) * chartWidth : chartWidth / 2
    const y = chartHeight - (d.count / maxVolume) * (chartHeight - 20) - 10
    return `${x},${y}`
  })
  const linePath = points.length > 0 ? `M ${points.join(' L ')}` : ''
  const areaPath = linePath ? `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z` : ''

  return (
    <div className="space-y-6">
      {/* Volume chart */}
      <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#ff6b35]" />
          Volume de recherches (30 jours)
        </h3>
        {data.volumeChart.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8">Aucune donnée de recherche</p>
        ) : (
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full" preserveAspectRatio="none">
            {/* Area */}
            <motion.path
              d={areaPath}
              fill="url(#seoGradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ duration: 0.8 }}
            />
            {/* Line */}
            <motion.path
              d={linePath}
              fill="none"
              stroke="#ff6b35"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
            {/* Date labels */}
            {data.volumeChart.filter((_, i) => i % 7 === 0).map((d) => {
              const idx = data.volumeChart.indexOf(d)
              const x = data.volumeChart.length > 1 ? (idx / (data.volumeChart.length - 1)) * chartWidth : chartWidth / 2
              return (
                <text key={idx} x={x} y={chartHeight + 15} textAnchor="middle" className="fill-gray-600 text-[9px]">
                  {d.date.slice(5)}
                </text>
              )
            })}
            <defs>
              <linearGradient id="seoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top keywords */}
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            Top 10 mots-clés (7 jours)
          </h3>
          {data.topKeywords.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">Aucune recherche</p>
          ) : (
            <div className="space-y-2">
              {data.topKeywords.map((kw, i) => {
                const width = (kw.count / maxKeyword) * 100
                return (
                  <div key={kw.keyword} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 relative">
                      <motion.div
                        className="h-7 bg-cyan-500/10 rounded-lg"
                        initial={{ width: 0 }}
                        animate={{ width: `${width}%` }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-300">{kw.keyword}</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 w-10 text-right">{kw.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Zero-result queries */}
        <div className="bg-[#0c0c16] border border-[#1e1e2e] rounded-xl p-4">
          <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Recherches sans résultat
          </h3>
          {data.zeroResultQueries.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">Aucune recherche sans résultat</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {data.zeroResultQueries.map((q) => (
                <div key={q.query} className="flex items-center gap-2 p-2 bg-[#080810] rounded-lg">
                  <Hash className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-gray-300 flex-1 truncate">{q.query}</span>
                  <span className="text-[10px] text-gray-500">{q.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
