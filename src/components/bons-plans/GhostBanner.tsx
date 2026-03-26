'use client'

import { Sparkles, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

interface GhostBannerProps {
  isClaimed: boolean
  establishmentId: string
}

export default function GhostBanner({ isClaimed, establishmentId }: GhostBannerProps) {
  return (
    <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-violet-300">Fiche communautaire</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Ce lieu a été ajouté par un voyageur et est en attente de vérification par notre équipe.
          </p>
          {!isClaimed && (
            <Link
              href={`/bons-plans/claim?id=${establishmentId}`}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Vous êtes le propriétaire ? Prenez le contrôle ici
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
