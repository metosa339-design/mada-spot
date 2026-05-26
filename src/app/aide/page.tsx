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

const QUICK_LINKS: { icon: LucideIcon; labelKey: string; href: string }[] = [
  { icon: Calendar, labelKey: 'qlBookings', href: '/client/bookings' },
  { icon: Heart, labelKey: 'qlFavorites', href: '/client/favorites' },
  { icon: Star, labelKey: 'qlPublishReview', href: '/publier-avis' },
  { icon: CreditCard, labelKey: 'qlLoyalty', href: '/client/fidelite' },
  { icon: MapPin, labelKey: 'qlExplore', href: '/bons-plans' },
  { icon: MessageSquare, labelKey: 'qlMessages', href: '/client/messagerie' },
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
    <div className="space-y-10">
      {FAQ_SECTIONS_RAW.map((section, sIdx) => {
        const SectionIcon = section.icon
        return (
          <motion.div key={section.titleKey} variants={slideUp} custom={sIdx + 3} initial="hidden" animate="visible">
            <div className="flex items-center gap-2 mb-4">
              <SectionIcon className="w-4 h-4 text-[#FF6B35]" />
              <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-[#0F172A]">{t[section.titleKey]}</h2>
            </div>
            <div className="space-y-2.5">
              {section.items.map((item, iIdx) => {
                const key = `${sIdx}-${iIdx}`
                const isOpen = openItems.has(key)
                return (
                  <div
                    key={key}
                    className="bg-white rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white transition-colors"
                    >
                      <span className="font-medium text-[#0F172A] text-[14px] pr-4">{t[item.questionKey]}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#64748B] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-[#334155] text-[13px] leading-relaxed border-t border-[#E2E8F0] pt-4">
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <motion.div variants={slideUp} custom={0} initial="hidden" animate="visible" className="mb-8">
          <Link href="/client" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.backToClient}
          </Link>

          <div className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-8">
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-[#FFF7ED] border border-[#FF6B35]/25 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#0F172A]">{t.title}</h1>
                  <p className="text-[#64748B] text-[13px] mt-0.5">{t.subtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={slideUp} custom={1} initial="hidden" animate="visible" className="mb-10">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">{t.quickActions}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon
              return (
                <Link key={link.labelKey} href={link.href}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex flex-col items-center gap-2 hover:border-[#CBD5E1] transition-colors text-center"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FFF7ED] border border-[#FF6B35]/20">
                      <Icon className="w-3.5 h-3.5 text-[#FF6B35]" />
                    </div>
                    <span className="text-[11px] text-[#334155]">{t[link.labelKey]}</span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div variants={slideUp} custom={2} initial="hidden" animate="visible" className="mb-8">
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35]">{t.popularTopics}</h2>
        </motion.div>
        <DarkAccordion t={t} />

        {/* Contact CTA */}
        <motion.div variants={slideUp} custom={10} initial="hidden" animate="visible" className="mt-12">
          <div className="relative bg-white border border-[#E2E8F0] rounded-xl p-8 text-center overflow-hidden">
            <div className="relative">
              <h2 className="text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-2">{t.needMore}</h2>
              <p className="text-[#64748B] text-[13px] mb-6 leading-relaxed">
                {t.needMoreDesc}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
                >
                  <Mail className="w-4 h-4" />
                  {t.contactBtn}
                </Link>
                <a
                  href="tel:+261340000000"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F172A] rounded-lg text-[14px] font-medium transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span className="font-mono">+261 34 00 000 00</span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
