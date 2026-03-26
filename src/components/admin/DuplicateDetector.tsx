'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Search, Loader2, ArrowRight, CheckCircle, Merge } from 'lucide-react'

interface DuplicatePair {
  a: { id: string; name: string; city: string; type: string }
  b: { id: string; name: string; city: string; type: string }
  score: number
}

const TYPE_LABELS: Record<string, string> = {
  HOTEL: 'Hôtel',
  RESTAURANT: 'Restaurant',
  ATTRACTION: 'Attraction',
  PROVIDER: 'Prestataire',
}

export default function DuplicateDetector() {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [merging, setMerging] = useState<string | null>(null)
  const [mergedPairs, setMergedPairs] = useState<Set<string>>(new Set())

  const scan = async () => {
    setScanning(true)
    setScanned(false)
    setMergedPairs(new Set())
    try {
      const res = await fetch('/api/admin/duplicates', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDuplicates(data.duplicates || [])
        setScanned(true)
      }
    } catch { /* ignore */ }
    finally { setScanning(false) }
  }

  const merge = async (keepId: string, removeId: string, pairKey: string) => {
    if (!confirm(`Fusionner les doublons ? L'établissement secondaire sera archivé et ses données transférées.`)) return
    setMerging(pairKey)
    try {
      const res = await fetch('/api/admin/duplicates/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keepId, removeId }),
      })
      if (res.ok) {
        setMergedPairs(prev => new Set([...prev, pairKey]))
      }
    } catch { /* ignore */ }
    finally { setMerging(null) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Copy className="w-5 h-5 text-[#ff6b35]" />
          <div>
            <h3 className="text-sm font-medium text-white">Détection de doublons</h3>
            <p className="text-xs text-gray-500">Identifiez et fusionnez les fiches en double</p>
          </div>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ff6b35] text-white rounded-xl text-sm font-medium hover:bg-[#ff6b35]/90 disabled:opacity-50 transition-colors"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Scanner les doublons
        </button>
      </div>

      {/* Results */}
      {scanning && (
        <div className="flex flex-col items-center py-16 text-gray-500">
          <Loader2 className="w-8 h-8 text-[#ff6b35] animate-spin mb-3" />
          <p className="text-sm">Analyse en cours...</p>
        </div>
      )}

      {scanned && !scanning && duplicates.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-medium">Aucun doublon détecté</p>
          <p className="text-xs text-gray-500 mt-1">Votre base de données est propre</p>
        </div>
      )}

      {scanned && duplicates.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{duplicates.length} paire(s) suspecte(s) trouvée(s)</p>
          <AnimatePresence>
            {duplicates.map((pair, index) => {
              const pairKey = `${pair.a.id}-${pair.b.id}`
              const isMerged = mergedPairs.has(pairKey)
              return (
                <motion.div
                  key={pairKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isMerged ? 0.4 : 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-[#0c0c16] border rounded-xl p-4 ${isMerged ? 'border-emerald-500/30' : 'border-[#1e1e2e]'}`}
                >
                  {isMerged ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Fusionné avec succès
                    </div>
                  ) : (
                    <>
                      {/* Similarity score */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500">Similarité</span>
                        <span className={`text-sm font-bold ${pair.score >= 0.9 ? 'text-red-400' : pair.score >= 0.8 ? 'text-amber-400' : 'text-yellow-400'}`}>
                          {Math.round(pair.score * 100)}%
                        </span>
                      </div>

                      {/* Side-by-side comparison */}
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                        {/* Left */}
                        <div className="p-3 bg-[#080810] rounded-lg">
                          <p className="text-sm font-medium text-white truncate">{pair.a.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                              {TYPE_LABELS[pair.a.type] || pair.a.type}
                            </span>
                            <span className="text-[10px] text-gray-500">{pair.a.city}</span>
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-600" />

                        {/* Right */}
                        <div className="p-3 bg-[#080810] rounded-lg">
                          <p className="text-sm font-medium text-white truncate">{pair.b.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px]">
                              {TYPE_LABELS[pair.b.type] || pair.b.type}
                            </span>
                            <span className="text-[10px] text-gray-500">{pair.b.city}</span>
                          </div>
                        </div>
                      </div>

                      {/* Merge buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => merge(pair.a.id, pair.b.id, pairKey)}
                          disabled={merging === pairKey}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#ff6b35]/10 border border-[#ff6b35]/30 text-[#ff6b35] rounded-lg text-xs hover:bg-[#ff6b35]/20 disabled:opacity-50 transition-colors"
                        >
                          {merging === pairKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                          Garder &quot;{pair.a.name.slice(0, 20)}&quot;
                        </button>
                        <button
                          onClick={() => merge(pair.b.id, pair.a.id, pairKey)}
                          disabled={merging === pairKey}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-lg text-xs hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
                        >
                          {merging === pairKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                          Garder &quot;{pair.b.name.slice(0, 20)}&quot;
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
