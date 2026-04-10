'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Hotel, UtensilsCrossed, Mountain, Briefcase, ArrowRight,
  CheckCircle, BarChart3, Globe, MessageSquare, Star,
  Camera, Clock, Shield, TrendingUp, Users, Zap,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const stats = [
  { value: '175+', label: 'Établissements référencés' },
  { value: '10K+', label: 'Visiteurs par mois' },
  { value: '100%', label: 'Gratuit, sans engagement' },
  { value: '5 min', label: "Temps d'inscription" },
];

const steps = [
  {
    icon: Clock,
    title: 'Inscrivez-vous en 5 minutes',
    description: 'Créez votre compte gratuitement. Renseignez le nom, le type et la localisation de votre établissement.',
  },
  {
    icon: Camera,
    title: 'Ajoutez vos photos',
    description: 'Mettez en valeur votre établissement avec de belles photos. Les fiches avec 5+ photos reçoivent 3x plus de contacts.',
  },
  {
    icon: Globe,
    title: 'Soyez visible dans le monde entier',
    description: 'Votre fiche est publiée sur Mada Spot et accessible aux voyageurs du monde entier qui planifient leur séjour à Madagascar.',
  },
  {
    icon: MessageSquare,
    title: 'Recevez des réservations',
    description: 'Les voyageurs vous contactent directement. Gérez vos réservations et vos avis depuis votre tableau de bord.',
  },
];

const categories = [
  {
    icon: Hotel,
    title: 'Hôtels & Hébergements',
    description: 'Hôtels, lodges, maisons d\'hôtes, bungalows, campings, villas...',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: UtensilsCrossed,
    title: 'Restaurants & Cuisine',
    description: 'Restaurants, cafés, street food, traiteurs, bars...',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Mountain,
    title: 'Attractions & Activités',
    description: 'Parcs nationaux, plages, réserves, sites historiques, musées...',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Briefcase,
    title: 'Prestataires de Services',
    description: 'Guides touristiques, chauffeurs, photographes, agences de voyage...',
    gradient: 'from-purple-500 to-pink-500',
  },
];

const benefits = [
  { icon: Zap, title: 'Visibilité immédiate', text: 'Votre établissement apparaît sur la plateforme dès validation.' },
  { icon: BarChart3, title: 'Statistiques détaillées', text: 'Suivez vos vues, clics et réservations en temps réel.' },
  { icon: Star, title: 'Avis vérifiés', text: 'Collectez des avis clients pour renforcer votre crédibilité.' },
  { icon: Shield, title: 'Fiche vérifiée', text: 'Badge de confiance pour rassurer les voyageurs.' },
  { icon: TrendingUp, title: 'SEO optimisé', text: 'Votre fiche est optimisée pour apparaître sur Google.' },
  { icon: Users, title: 'Audience internationale', text: 'Touchez des voyageurs de France, Europe, USA et du monde entier.' },
];

const faqs = [
  {
    q: "Est-ce que l'inscription est vraiment gratuite ?",
    a: "Oui, 100% gratuite et sans engagement. Vous pouvez inscrire votre établissement, ajouter des photos et recevoir des contacts sans aucun frais.",
  },
  {
    q: "Combien de temps faut-il pour s'inscrire ?",
    a: "L'inscription prend environ 5 minutes. Vous remplissez un formulaire simple avec les informations de votre établissement et vos photos.",
  },
  {
    q: "Qui peut s'inscrire sur Mada Spot ?",
    a: "Tout professionnel du tourisme à Madagascar : hôtels, restaurants, guides touristiques, chauffeurs, agences de voyage, attractions, activités nautiques, etc.",
  },
  {
    q: "Comment les voyageurs me trouvent-ils ?",
    a: "Votre établissement apparaît dans les résultats de recherche sur Mada Spot, sur Google, et sur la carte interactive. Les voyageurs peuvent filtrer par ville, type, prix et avis.",
  },
  {
    q: "Puis-je gérer mes réservations depuis Mada Spot ?",
    a: "Oui, votre tableau de bord professionnel vous permet de gérer vos réservations, répondre aux messages, suivre vos statistiques et mettre à jour votre fiche.",
  },
  {
    q: "Combien de photos puis-je ajouter ?",
    a: "Vous pouvez ajouter jusqu'à 10 photos. Nous recommandons au minimum 5 photos pour maximiser votre visibilité et vos chances d'être contacté.",
  },
];

export default function InscrireEtablissementPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D241E]">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a24] via-[#0a0a0f] to-[#1a1a24] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#ff6b35_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#ff1493_0%,transparent_50%)]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm text-orange-300 font-medium mb-6">
              100% Gratuit — Sans engagement
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              Référencez votre établissement sur{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                Mada Spot
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              Inscrivez gratuitement votre hôtel, restaurant ou activité touristique à Madagascar.
              Gagnez en visibilité auprès de milliers de voyageurs internationaux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                Inscrire mon établissement gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-orange-400">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Quel type d&apos;établissement avez-vous ?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Mada Spot accueille tous les professionnels du tourisme à Madagascar.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white rounded-2xl border border-[#E8E0D4] p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-4`}>
                <cat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{cat.title}</h3>
              <p className="text-sm text-gray-600">{cat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#E8E0D4]">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Comment inscrire mon établissement ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              4 étapes simples pour être visible sur la première plateforme touristique de Madagascar.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">Étape {i + 1}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Pourquoi rejoindre Mada Spot ?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Des outils professionnels gratuits pour développer votre activité touristique.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex gap-4 p-5 bg-white rounded-xl border border-[#E8E0D4]"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <b.icon className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{b.title}</h3>
                <p className="text-sm text-gray-600">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Schema + Section */}
      <section className="bg-white border-y border-[#E8E0D4]">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Questions fréquentes</h2>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group bg-[#FDFBF7] rounded-xl border border-[#E8E0D4] overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-[#2D241E] hover:text-orange-600 transition-colors">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 rotate-90 group-open:rotate-[270deg] transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>

          {/* FAQ JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.q,
                  acceptedAnswer: { '@type': 'Answer', text: faq.a },
                })),
              }),
            }}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-[#1a1a24] to-[#0a0a0f] rounded-3xl p-8 sm:p-12 text-white"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Prêt à développer votre activité ?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Rejoignez les 175+ établissements déjà référencés sur Mada Spot.
            Inscription gratuite en 5 minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            Inscrire mon établissement maintenant
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            Gratuit — Sans carte bancaire — Sans engagement
          </p>
        </motion.div>
      </section>
    </div>
  );
}
