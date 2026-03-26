'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Hammer,
  Monitor,
  Camera,
  GraduationCap,
  Utensils,
  Sparkles,
  ArrowRight,
  Play,
  Users,
  Star,
  Zap,
} from 'lucide-react';
import { MadaGradientText } from './AnimatedGradientText';
import { LiveDot } from './AvailabilityBadge';

const services = [
  {
    icon: Hammer,
    title: 'BTP & Maison',
    description: 'Plombiers, électriciens, maçons...',
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    href: '/univers/btp-maison',
    count: '2,340+',
  },
  {
    icon: Monitor,
    title: 'Tech & Digital',
    description: 'Développeurs, designers, marketing...',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    href: '/univers/tech-digital',
    count: '1,890+',
  },
  {
    icon: Camera,
    title: 'Créatifs',
    description: 'Photographes, vidéastes, graphistes...',
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    href: '/univers/creatifs',
    count: '956+',
  },
  {
    icon: GraduationCap,
    title: 'Éducation',
    description: 'Professeurs, coachs, formateurs...',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    href: '/univers/education',
    count: '1,234+',
  },
  {
    icon: Utensils,
    title: 'Événementiel',
    description: 'Traiteurs, DJ, décorateurs...',
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50',
    href: '/univers/evenementiel',
    count: '678+',
  },
];

const stats = [
  { value: '500+', label: 'Établissements', icon: Users },
  { value: '4.8', label: 'Note moyenne', icon: Star },
  { value: '20+', label: 'Villes', icon: Zap },
];

export default function BentoHero() {
  return (
    <section className="relative min-h-screen bg-slate-900 overflow-hidden">
      {/* Video Background avec overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 z-10" />
        {/* Animated gradient orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 -left-40 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-4 pt-32 pb-20">
        {/* Header avec stats en direct */}
        <div className="flex items-center justify-center gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
            >
              <stat.icon className="w-4 h-4 text-orange-400" />
              <span className="text-white font-bold">{stat.value}</span>
              <span className="text-white/60 text-sm">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Titre principal avec gradient animé */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            La <MadaGradientText className="font-black">Force</MadaGradientText> de
            <br />
            Madagascar au travail
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Trouvez les meilleurs établissements de l'île en quelques clics.
            <span className="text-emerald-400 font-medium"> Hôtels, restaurants et attractions vérifiés</span> pour votre séjour.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/register"
                className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-2xl hover:shadow-orange-500/25 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Trouver un pro maintenant
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-6 py-4 bg-white/10 backdrop-blur-sm text-white font-medium rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
            >
              <Play className="w-5 h-5" />
              Voir comment ça marche
            </motion.button>
          </div>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[120px]">
          {/* Grande carte - BTP */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 row-span-2"
          >
            <Link
              href={services[0].href}
              className="group relative h-full w-full flex flex-col justify-end p-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl overflow-hidden"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                <LiveDot />
                <span className="text-white text-xs font-medium">{services[0].count} pros</span>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-6 left-6"
              >
                <Hammer className="w-12 h-12 text-white/30" />
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-1">{services[0].title}</h3>
              <p className="text-white/80 text-sm">{services[0].description}</p>
              <ArrowRight className="absolute bottom-6 right-6 w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          {/* Tech & Digital */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 row-span-1"
          >
            <Link
              href={services[1].href}
              className="group relative h-full w-full flex items-center gap-4 p-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl overflow-hidden"
            >
              <Monitor className="w-10 h-10 text-white/80" />
              <div>
                <h3 className="text-lg font-bold text-white">{services[1].title}</h3>
                <p className="text-white/70 text-sm">{services[1].count} pros</p>
              </div>
              <ArrowRight className="absolute right-5 w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          {/* Créatifs */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 row-span-1"
          >
            <Link
              href={services[2].href}
              className="group relative h-full w-full flex items-center gap-4 p-5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl overflow-hidden"
            >
              <Camera className="w-10 h-10 text-white/80" />
              <div>
                <h3 className="text-lg font-bold text-white">{services[2].title}</h3>
                <p className="text-white/70 text-sm">{services[2].count} pros</p>
              </div>
              <ArrowRight className="absolute right-5 w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          {/* Éducation - Tall */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 row-span-1"
          >
            <Link
              href={services[3].href}
              className="group relative h-full w-full flex items-center gap-4 p-5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl overflow-hidden"
            >
              <GraduationCap className="w-10 h-10 text-white/80" />
              <div>
                <h3 className="text-lg font-bold text-white">{services[3].title}</h3>
                <p className="text-white/70 text-sm">{services[3].count} pros</p>
              </div>
              <ArrowRight className="absolute right-5 w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>

          {/* Événementiel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="col-span-2 row-span-1"
          >
            <Link
              href={services[4].href}
              className="group relative h-full w-full flex items-center gap-4 p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl overflow-hidden"
            >
              <Utensils className="w-10 h-10 text-white/80" />
              <div>
                <h3 className="text-lg font-bold text-white">{services[4].title}</h3>
                <p className="text-white/70 text-sm">{services[4].count} pros</p>
              </div>
              <ArrowRight className="absolute right-5 w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </Link>
          </motion.div>
        </div>

        {/* Filtres rapides "Mood" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3 mt-10"
        >
          <span className="text-white/50 text-sm">Filtres express :</span>
          {[
            { label: 'Besoin urgent ⚡', color: 'from-red-500 to-orange-500' },
            { label: 'Projets Créatifs 🎨', color: 'from-pink-500 to-purple-500' },
            { label: 'Top Qualité ⭐', color: 'from-amber-500 to-yellow-500' },
            { label: 'Petit budget 💰', color: 'from-emerald-500 to-teal-500' },
          ].map((filter) => (
            <motion.button
              key={filter.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 bg-gradient-to-r ${filter.color} text-white text-sm font-medium rounded-full hover:shadow-lg transition-all`}
            >
              {filter.label}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
