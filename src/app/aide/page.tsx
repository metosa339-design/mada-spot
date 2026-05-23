'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle, ChevronDown, ArrowLeft, MessageSquare, Mail,
  Calendar, Heart, Star, Shield, UserPlus, CreditCard,
  MapPin, Phone, type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTrans } from '@/i18n'

type HelpTrans = ReturnType<typeof useTrans<'helpPage'>>

interface FAQItem {
  questionKey: string
  answerKey: string
}

interface FAQSectionRaw {
  titleKey: string
  icon: LucideIcon
  items: FAQItem[]
}

const FAQ_SECTIONS_RAW: FAQSectionRaw[] = [
  {
    titleKey: 'sectionGeneral',
    icon: HelpCircle,
    items: [
      { questionKey: 'q1', answerKey: 'a1' },
      { questionKey: 'q2', answerKey: 'a2' },
      { questionKey: 'q3', answerKey: 'a3' },
    ],
  },
  {
    titleKey: 'sectionAccount',
    icon: UserPlus,
    items: [
      { questionKey: 'q4', answerKey: 'a4' },
      { questionKey: 'q5', answerKey: 'a5' },
      { questionKey: 'q6', answerKey: 'a6' },
    ],
  },
  {
    titleKey: 'sectionBookings',
    icon: Calendar,
    items: [
      { questionKey: 'q7', answerKey: 'a7' },
      { questionKey: 'q8', answerKey: 'a8' },
      { questionKey: 'q9', answerKey: 'a9' },
    ],
  },
  {
    titleKey: 'sectionReviews',
    icon: Star,
    items: [
      { questionKey: 'q10', answerKey: 'a10' },
      { questionKey: 'q11', answerKey: 'a11' },
    ],
  },
  {
    titleKey: 'sectionSecurity',
    icon: Shield,
    items: [
      { questionKey: 'q12', answerKey: 'a12' },
      { questionKey: 'q13', answerKey: 'a13' },
    ],
  },
]

const QUICK_LINKS: { icon: LucideIcon; labelKey: string; href: string; color: string }[] = [
  { icon: Calendar, labelKey: 'qlBookings', href: '/client/bookings', color: '#0891b2' },
  { icon: Heart, labelKey: 'qlFavorites', href: '/client/favorites', color: '#ef4444' },
  { icon: Star, labelKey: 'qlPublishReview', href: '/publier-avis', color: '#f59e0b' },
  { icon: CreditCard, labelKey: 'qlLoyalty', href: '/client/fidelite', color: '#8b5cf6' },
  { icon: MapPin, labelKey: 'qlExplore', href: '/bons-plans', color: '#10b981' },
  { icon: MessageSquare, labelKey: 'qlMessages', href: '/client/messagerie', color: '#ec4899' },
]

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function DarkAccordion({ t }: { t: HelpTrans }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-8">
      {FAQ_SECTIONS_RAW.map((section, sIdx) => {
        const SectionIcon = section.icon
        return (
          <motion.div key={section.titleKey} variants={slideUp} custom={sIdx + 3} initial="hidden" animate="visible">
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon className="w-4 h-4 text-[#ff6b35]" />
              <h2 className="text-lg font-bold text-white">{t[section.titleKey]}</h2>
            </div>
            <div className="space-y-2">
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`
                const isOpen = openItems.has(key)
                return (
                  <div
                    key={key}
                    className="bg-[#1a1a24] rounded-xl border border-[#2a2a36] overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="font-medium text-gray-200 pr-4">{t[item.questionKey]}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                        {t[item.answerKey]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function AidePage() {
  const t = useTrans('helpPage')

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <motion.div variants={slideUp} custom={0} initial="hidden" animate="visible" className="mb-8">
          <Link href="/client" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {t.backToClient}
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-[#2a2a36] bg-gradient-to-br from-violet-500/10 via-[#0a0a0f] to-indigo-500/5 p-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <p className="text-gray-400 text-sm">{t.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={slideUp} custom={1} initial="hidden" animate="visible" className="mb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{t.quickActions}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon
              return (
                <Link key={link.labelKey} href={link.href}>
                  <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-[#ff6b35]/20 transition-all text-center">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${link.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: link.color }} />
                    </div>
                    <span className="text-[11px] text-gray-400">{t[link.labelKey]}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div variants={slideUp} custom={2} initial="hidden" animate="visible" className="mb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.popularTopics}</h2>
        </motion.div>
        <DarkAccordion t={t} />

        {/* Contact CTA */}
        <motion.div variants={slideUp} custom={10} initial="hidden" animate="visible" className="mt-12">
          <div className="bg-gradient-to-br from-[#ff6b35]/10 via-[#1a1a24] to-pink-500/5 border border-[#2a2a36] rounded-2xl p-8 text-center">
            <h2 className="text-lg font-bold text-white mb-2">{t.needMore}</h2>
            <p className="text-gray-400 text-sm mb-6">
              {t.needMoreDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t.contactBtn}
              </Link>
              <a
                href="tel:+261340000000"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                <Phone className="w-4 h-4" />
                +261 34 00 000 00
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
