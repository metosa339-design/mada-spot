'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tag, CalendarX, MessageSquare } from 'lucide-react'

export default function QuickActionBar() {
  const actions = [
    { label: 'Changer mes tarifs', href: '/dashboard/tarifs', icon: Tag, color: '#06B6D4' },
    { label: 'Signaler fermeture', href: '/dashboard/calendrier', icon: CalendarX, color: '#EF4444' },
    { label: 'Messagerie', href: '/dashboard/messagerie', icon: MessageSquare, color: '#FF6B35' },
  ]

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', damping: 20 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 lg:left-[calc(50%+130px)]"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-[#111114]/95 backdrop-blur-xl border border-[#27272A] rounded-2xl shadow-2xl shadow-black/50">
        {actions.map((action) => (
          <Link key={action.href} href={action.href}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors hover:bg-[#1A1A1F]"
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
