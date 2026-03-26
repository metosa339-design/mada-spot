'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tag, CalendarX, MessageSquare } from 'lucide-react'

export default function QuickActionBar() {
  const actions = [
    { label: 'Changer mes tarifs', href: '/dashboard/tarifs', icon: Tag, color: '#0891b2' },
    { label: 'Signaler fermeture', href: '/dashboard/calendrier', icon: CalendarX, color: '#ef4444' },
    { label: 'Messagerie', href: '/dashboard/messagerie', icon: MessageSquare, color: '#8b5cf6' },
  ]

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', damping: 20 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:left-[calc(50%+130px)]"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1a1a24]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors hover:bg-white/5"
            >
              <action.icon className="w-4 h-4" style={{ color: action.color }} />
              <span className="hidden sm:inline">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  )
}
