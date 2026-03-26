'use client'

import { motion } from 'framer-motion'
import { WifiOff, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1a1a24] border border-[#2a2a36] flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-[#ff6b35]" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Vous êtes hors ligne</h1>
        <p className="text-gray-400 mb-8">
          Vérifiez votre connexion internet et réessayez.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Réessayer
        </button>

        <div className="mt-8 pt-6 border-t border-[#2a2a36]">
          <p className="text-sm text-gray-500 mb-3">Pages disponibles hors ligne :</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/"
              className="px-3 py-1.5 bg-[#1a1a24] border border-[#2a2a36] rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
            >
              Accueil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
