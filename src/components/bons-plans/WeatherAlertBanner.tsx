'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X, CloudLightning, Droplets, Wind, Thermometer } from 'lucide-react'

interface WeatherAlert {
  id: string
  type: string
  level: string
  title: string
  message: string
  regions: string | null
  startDate: string
  endDate: string | null
}

const LEVEL_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  red:    { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', icon: 'text-red-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', icon: 'text-orange-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', icon: 'text-yellow-400' },
  green:  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300', icon: 'text-emerald-400' },
}

const TYPE_ICONS: Record<string, typeof AlertTriangle> = {
  cyclone: CloudLightning,
  flood: Droplets,
  storm: Wind,
  heatwave: Thermometer,
}

export default function WeatherAlertBanner() {
  const [alert, setAlert] = useState<WeatherAlert | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/weather/alerts')
      .then(r => r.json())
      .then(data => {
        if (data?.alert) setAlert(data.alert)
      })
      .catch(() => {})
  }, [])

  if (!alert || dismissed.has(alert.id)) return null

  const style = LEVEL_STYLES[alert.level] || LEVEL_STYLES.yellow
  const TypeIcon = TYPE_ICONS[alert.type] || AlertTriangle

  return (
    <div className={`${style.bg} border-b ${style.border}`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <TypeIcon className={`w-5 h-5 ${style.icon} shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${style.text}`}>
            {alert.title}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {alert.message}
            {alert.regions && <span className="ml-2 text-gray-500">— {alert.regions}</span>}
          </p>
        </div>
        <button
          onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
          className="p-1 text-gray-500 hover:text-white transition-colors shrink-0"
          aria-label="Fermer l'alerte"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
