'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hotel,
  UtensilsCrossed,
  Mountain,
  Briefcase,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Compass,
  Heart,
  Handshake,
  CalendarCheck,
  Star,
  Building2,
  MapPin,
  TrendingUp,
  Shield,
} from 'lucide-react'
import { REGISTRATION_CATEGORIES, type RegistrationCategory } from '@/data/registration-types'
import { useTrans } from '@/i18n'

const ICONS: Record<string, any> = {
  Hotel,
  UtensilsCrossed,
  Mountain,
  Briefcase,
}

type Mode = 'choose' | 'pro'

export default function RegisterChooserPage() {
  const t = useTrans('auth')
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('choose')
  const [expandedType, setExpandedType] = useState<string | null>(null)
  const [selectedSubtype, setSelectedSubtype] = useState<{ type: string; subtype: string } | null>(null)

  const handleToggle = (type: string) => {
    setExpandedType(expandedType === type ? null : type)
    setSelectedSubtype(null)
  }

  const handleSelectSubtype = (category: RegistrationCategory, subtypeValue: string) => {
    setSelectedSubtype({ type: category.type, subtype: subtypeValue })
  }

  const handleContinuePro = () => {
    if (!selectedSubtype) return
    sessionStorage.setItem(
      'mada-spot-registration-intent',
      JSON.stringify(selectedSubtype)
    )
    router.push(
      `/register-client?type=${selectedSubtype.type}&subtype=${encodeURIComponent(selectedSubtype.subtype)}`
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Header minimaliste */}
      <div className="border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Mada Spot" width={36} height={36} className="w-9 h-9 object-contain" />
            <span className="text-xl font-bold text-[#0F172A]">
              Mada<span className="text-[#FF6B35]"> Spot</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            {t.chooserAlreadyAccount} <span className="text-[#FF6B35] font-medium">{t.chooserLogIn}</span>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {mode === 'choose' ? (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Titre */}
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-3">
                  {t.chooserHeroTitle}
                </h1>
                <p className="text-[#64748B] max-w-lg mx-auto">
                  {t.chooserHeroDesc}
                </p>
              </div>

              {/* 2 gros choix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
                {/* Carte Voyageur */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/register-client')}
                  aria-label={t.chooserTravelerAriaLabel}
                  className="group relative bg-white rounded-2xl border-2 border-[#E2E8F0] hover:border-cyan-500/50 text-left transition-all overflow-hidden"
                >
                  {/* Photo header - 2 images side by side */}
                  <div className="relative h-40 w-full overflow-hidden grid grid-cols-2">
                    <div className="relative overflow-hidden">
                      <Image
                        src="/images/highlights/Voyageur 1.png"
                        alt={t.chooserTravelerImg1Alt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="relative overflow-hidden">
                      <Image
                        src="/images/highlights/Voyageur 2.png"
                        alt={t.chooserTravelerImg2Alt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>

                  {/* Icône flottante à cheval sur la photo */}
                  <div className="relative flex justify-center -mt-8 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border-4 border-white">
                      <Compass className="w-8 h-8 text-[#0F172A]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="px-8 pb-8 pt-4">
                    <h2 className="text-xl font-bold text-[#0F172A] mb-2 text-center">{t.chooserTravelerTitle}</h2>
                    <p className="text-[#64748B] text-sm mb-5 text-center">
                      {t.chooserTravelerDesc}
                    </p>
                    <div className="space-y-2">
                      {[
                        { icon: Heart, text: t.chooserTravelerBenefit1 },
                        { icon: CalendarCheck, text: t.chooserTravelerBenefit2 },
                        { icon: Star, text: t.chooserTravelerBenefit3 },
                        { icon: MapPin, text: t.chooserTravelerBenefit4 },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                          <item.icon className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                          {item.text}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-2 text-cyan-400 font-medium text-sm group-hover:gap-3 transition-all">
                      {t.chooserTravelerCta}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                </motion.button>

                {/* Carte Prestataire */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('pro')}
                  aria-label={t.chooserProAriaLabel}
                  className="group relative bg-white rounded-2xl border-2 border-[#E2E8F0] hover:border-[#FF6B35]/50 text-left transition-all overflow-hidden"
                >
                  {/* Photo header - 2 images side by side */}
                  <div className="relative h-40 w-full overflow-hidden grid grid-cols-2">
                    <div className="relative overflow-hidden">
                      <Image
                        src="/images/highlights/Guide.png"
                        alt={t.chooserProImg1Alt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="relative overflow-hidden">
                      <Image
                        src="/images/highlights/Chauffeur.png"
                        alt={t.chooserProImg2Alt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>

                  {/* Icône flottante à cheval sur la photo */}
                  <div className="relative flex justify-center -mt-8 z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-pink-500 flex items-center justify-center shadow-lg shadow-orange-500/30 border-4 border-white">
                      <Handshake className="w-8 h-8 text-[#0F172A]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="px-8 pb-8 pt-4">
                    <h2 className="text-xl font-bold text-[#0F172A] mb-2 text-center">{t.chooserProTitle}</h2>
                    <p className="text-[#64748B] text-sm mb-5 text-center">
                      {t.chooserProDesc}
                    </p>
                    <div className="space-y-2">
                      {[
                        { icon: Building2, text: t.chooserProBenefit1 },
                        { icon: TrendingUp, text: t.chooserProBenefit2 },
                        { icon: Shield, text: t.chooserProBenefit3 },
                        { icon: Sparkles, text: t.chooserProBenefit4 },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                          <item.icon className="w-4 h-4 text-[#FF6B35]" aria-hidden="true" />
                          {item.text}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-2 text-[#FF6B35] font-medium text-sm group-hover:gap-3 transition-all">
                      {t.chooserProCta}
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Texte rassurant */}
              <p className="text-center text-[#CBD5E1] text-sm">
                {t.chooserReassurance}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="pro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Bouton retour */}
              <button
                onClick={() => { setMode('choose'); setSelectedSubtype(null); setExpandedType(null) }}
                className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {t.chooserBackToChoice}
              </button>

              {/* Étapes indicateur */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FF6B35] text-[#0F172A] flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">{t.chooserStepType}</span>
                </div>
                <div className="w-8 h-px bg-white" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-[#94A3B8] flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <span className="text-sm text-[#94A3B8]">{t.chooserStepAccount}</span>
                </div>
                <div className="w-8 h-px bg-white" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white text-[#94A3B8] flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <span className="text-sm text-[#94A3B8]">{t.chooserStepPublication}</span>
                </div>
              </div>

              {/* Titre */}
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-3">
                  {t.chooserProStepTitle}
                </h2>
                <p className="text-[#64748B] max-w-lg mx-auto">
                  {t.chooserProStepDesc}
                </p>
              </div>

              {/* Catégories */}
              <div className="space-y-4 mb-8">
                {REGISTRATION_CATEGORIES.map((category) => {
                  const Icon = ICONS[category.icon] || Mountain
                  const isExpanded = expandedType === category.type
                  const hasSelection = selectedSubtype?.type === category.type

                  return (
                    <motion.div
                      key={category.type}
                      layout
                      className={`bg-white rounded-2xl border overflow-hidden transition-colors ${
                        hasSelection
                          ? 'border-[#FF6B35]/50 shadow-lg shadow-[#FF6B35]/5'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <button
                        onClick={() => handleToggle(category.type)}
                        className="w-full flex items-center gap-4 p-5 sm:p-6 text-left"
                      >
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${category.gradient} shrink-0`}
                        >
                          <Icon className="w-7 h-7 text-[#0F172A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-[#0F172A]">{category.label}</h2>
                            <span className="text-xs text-[#94A3B8] bg-white px-2 py-0.5 rounded-full">
                              {category.subtypes.length} {t.chooserSubtypesCount}
                            </span>
                          </div>
                          <p className="text-sm text-[#64748B] mt-0.5 truncate">{category.description}</p>
                          {hasSelection && (
                            <p className="text-xs text-[#FF6B35] mt-1 font-medium">
                              {category.subtypes.find((s) => s.value === selectedSubtype?.subtype)?.label}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-[#94A3B8] transition-transform shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                              <div className="border-t border-[#E2E8F0] pt-4">
                                <p className="text-xs text-[#94A3B8] mb-3 uppercase tracking-wider font-medium">
                                  {t.chooserSelectSubtype}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {category.subtypes.map((subtype) => {
                                    const isSelected =
                                      selectedSubtype?.type === category.type &&
                                      selectedSubtype?.subtype === subtype.value

                                    return (
                                      <button
                                        key={subtype.value}
                                        onClick={() => handleSelectSubtype(category, subtype.value)}
                                        className={`group relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                                          isSelected
                                            ? 'bg-[#FF6B35] text-[#0F172A] shadow-lg shadow-[#FF6B35]/20'
                                            : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155] hover:border-[#FF6B35]/40 hover:text-[#0F172A]'
                                        }`}
                                        title={subtype.description}
                                      >
                                        {subtype.label}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Bouton continuer */}
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={selectedSubtype ? { scale: 1.02 } : {}}
                  whileTap={selectedSubtype ? { scale: 0.98 } : {}}
                  onClick={handleContinuePro}
                  disabled={!selectedSubtype}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold transition-all ${
                    selectedSubtype
                      ? 'bg-gradient-to-r from-[#FF6B35] to-pink-500 text-[#0F172A] shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30'
                      : 'bg-white text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  {t.chooserContinueRegistration}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
