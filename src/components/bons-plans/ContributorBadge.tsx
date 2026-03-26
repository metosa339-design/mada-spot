'use client'

import { motion } from 'framer-motion'
import { Sparkles, CheckCircle, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ContributorBadgeProps {
  establishmentName: string
  slug?: string
}

export default function ContributorBadge({ establishmentName, slug }: ContributorBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', damping: 10 }}
        className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Sparkles className="w-8 h-8 text-violet-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white">Merci pour votre contribution !</h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Vous avez enrichi la carte de Madagascar en ajoutant
          <span className="text-violet-400 font-medium"> {establishmentName}</span>
        </p>

        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-500/10 rounded-xl inline-flex">
          <MapPin className="w-4 h-4 text-violet-400" />
          <span className="text-xs text-violet-300">Votre lieu sera visible après modération par notre équipe</span>
        </div>

        {slug && (
          <Link
            href={`/bons-plans/lieu/${slug}`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#ff6b35] hover:text-orange-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Voir la fiche communautaire
          </Link>
        )}
      </motion.div>
    </motion.div>
  )
}
