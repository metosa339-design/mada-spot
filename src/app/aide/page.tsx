'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle, ChevronDown, ArrowLeft, MessageSquare, Mail,
  BookOpen, Calendar, Heart, Star, Shield, UserPlus, CreditCard,
  MapPin, Phone,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSection {
  title: string
  icon: typeof BookOpen
  items: FAQItem[]
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'Général',
    icon: HelpCircle,
    items: [
      {
        question: 'Qu\'est-ce que Mada Spot ?',
        answer: 'Mada Spot est une plateforme en ligne qui regroupe les meilleurs hôtels, restaurants et attractions touristiques à Madagascar. Nous vous aidons à trouver, comparer et réserver les meilleures adresses.',
      },
      {
        question: 'L\'inscription est-elle gratuite ?',
        answer: 'Oui, l\'inscription est entièrement gratuite. Créez un compte pour accéder aux réservations, favoris et avis.',
      },
      {
        question: 'Mada Spot est-il disponible hors d\'Antananarivo ?',
        answer: 'Oui ! Nous couvrons plus de 20 villes à Madagascar, dont Antananarivo, Nosy Be, Toamasina, Mahajanga, Antsirabe, Fianarantsoa et bien d\'autres.',
      },
    ],
  },
  {
    title: 'Compte et inscription',
    icon: UserPlus,
    items: [
      {
        question: 'Comment créer un compte ?',
        answer: 'Cliquez sur "S\'inscrire" en haut de la page. Vous pouvez vous inscrire avec votre email ou votre numéro de téléphone et remplir vos informations.',
      },
      {
        question: 'J\'ai oublié mon mot de passe, que faire ?',
        answer: 'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Entrez votre email et vous recevrez un lien de réinitialisation valable 1 heure.',
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer: 'Rendez-vous dans les paramètres de votre compte et cliquez sur "Supprimer mon compte". Cette action est irréversible.',
      },
    ],
  },
  {
    title: 'Réservations',
    icon: Calendar,
    items: [
      {
        question: 'Comment réserver un hôtel ou un restaurant ?',
        answer: 'Trouvez l\'établissement qui vous intéresse, consultez sa fiche détaillée et cliquez sur "Réserver". Remplissez le formulaire avec vos dates et préférences. L\'établissement confirmera votre réservation.',
      },
      {
        question: 'Puis-je annuler une réservation ?',
        answer: 'Oui, vous pouvez annuler une réservation depuis votre espace client. Les conditions d\'annulation dépendent de l\'établissement.',
      },
      {
        question: 'Comment suivre mes réservations ?',
        answer: 'Rendez-vous dans votre espace client > Réservations pour voir toutes vos réservations en cours, passées et à venir.',
      },
    ],
  },
  {
    title: 'Avis et évaluations',
    icon: Star,
    items: [
      {
        question: 'Comment laisser un avis ?',
        answer: 'Après avoir visité un établissement, rendez-vous sur sa fiche et cliquez sur "Laisser un avis". Attribuez une note de 1 à 5 étoiles et rédigez votre commentaire.',
      },
      {
        question: 'Les avis sont-ils modérés ?',
        answer: 'Oui, tous les avis sont soumis à modération pour garantir leur authenticité. Les avis liés à une réservation reçoivent un badge "Vérifié".',
      },
    ],
  },
  {
    title: 'Sécurité et confidentialité',
    icon: Shield,
    items: [
      {
        question: 'Mes données personnelles sont-elles protégées ?',
        answer: 'Oui, nous prenons la protection de vos données très au sérieux. Vos mots de passe sont chiffrés, vos sessions sont sécurisées et nous n\'utilisons aucun cookie publicitaire.',
      },
      {
        question: 'Comment signaler un contenu inapproprié ?',
        answer: 'Utilisez le bouton "Signaler" présent sur chaque fiche, avis ou profil. Notre équipe de modération examinera votre signalement.',
      },
    ],
  },
]

const QUICK_LINKS = [
  { icon: Calendar, label: 'Mes réservations', href: '/client/bookings', color: '#0891b2' },
  { icon: Heart, label: 'Mes favoris', href: '/client/favorites', color: '#ef4444' },
  { icon: Star, label: 'Publier un avis', href: '/publier-avis', color: '#f59e0b' },
  { icon: CreditCard, label: 'Points fidélité', href: '/client/fidelite', color: '#8b5cf6' },
  { icon: MapPin, label: 'Explorer', href: '/bons-plans', color: '#10b981' },
  { icon: MessageSquare, label: 'Messages', href: '/client/messagerie', color: '#ec4899' },
]

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
}

function DarkAccordion({ sections }: { sections: FAQSection[] }) {
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
      {sections.map((section, sIdx) => {
        const SectionIcon = section.icon
        return (
          <motion.div key={section.title} variants={slideUp} custom={sIdx + 3} initial="hidden" animate="visible">
            <div className="flex items-center gap-2 mb-3">
              <SectionIcon className="w-4 h-4 text-[#ff6b35]" />
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
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
                      <span className="font-medium text-gray-200 pr-4">{item.question}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                        {item.answer}
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
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">

        {/* Header */}
        <motion.div variants={slideUp} custom={0} initial="hidden" animate="visible" className="mb-8">
          <Link href="/client" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mon espace
          </Link>

          <div className="relative overflow-hidden rounded-2xl border border-[#2a2a36] bg-gradient-to-br from-violet-500/10 via-[#0a0a0f] to-indigo-500/5 p-8">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Centre d&apos;aide</h1>
                  <p className="text-gray-400 text-sm">Trouvez rapidement les réponses à vos questions</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div variants={slideUp} custom={1} initial="hidden" animate="visible" className="mb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Accès rapide</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {QUICK_LINKS.map(link => (
              <Link key={link.label} href={link.href}>
                <div className="bg-[#1a1a24] border border-[#2a2a36] rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-[#ff6b35]/20 transition-all text-center">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${link.color}15` }}>
                    <link.icon className="w-4 h-4" style={{ color: link.color }} />
                  </div>
                  <span className="text-[11px] text-gray-400">{link.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* FAQ Sections */}
        <motion.div variants={slideUp} custom={2} initial="hidden" animate="visible" className="mb-10">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Questions fréquentes</h2>
        </motion.div>
        <DarkAccordion sections={FAQ_SECTIONS} />

        {/* Contact CTA */}
        <motion.div variants={slideUp} custom={10} initial="hidden" animate="visible" className="mt-12">
          <div className="bg-gradient-to-br from-[#ff6b35]/10 via-[#1a1a24] to-pink-500/5 border border-[#2a2a36] rounded-2xl p-8 text-center">
            <h2 className="text-lg font-bold text-white mb-2">Vous n&apos;avez pas trouvé votre réponse ?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Notre équipe est disponible pour vous aider.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                <Mail className="w-4 h-4" />
                Nous contacter
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
