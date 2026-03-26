'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  UserPlus,
  FileCheck,
  Rocket,
  Star,
  CheckCircle2,
  Search,
  MapPin,
  Zap,
  type LucideIcon,
} from 'lucide-react';

interface Step {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const STEPS_ETABLISSEMENT: Step[] = [
  { step: 1, title: 'Créez votre compte', description: "Inscrivez-vous gratuitement en quelques minutes. Renseignez votre type d'établissement et vos informations de base.", icon: UserPlus, color: '#00ff88' },
  { step: 2, title: 'Complétez votre profil', description: 'Ajoutez des photos, votre localisation, vos horaires et une description attractive de votre établissement.', icon: FileCheck, color: '#ff6b35' },
  { step: 3, title: 'Validation par notre équipe', description: 'Notre équipe vérifie votre annonce sous 24-48h pour garantir la qualité de la plateforme.', icon: CheckCircle2, color: '#3b82f6' },
  { step: 4, title: 'Publiez et attirez des clients', description: 'Votre établissement est visible ! Créez des Flash Deals, gérez vos avis et suivez vos performances.', icon: Rocket, color: '#ff1493' },
];

export const STEPS_VISITEUR: Step[] = [
  { step: 1, title: 'Explorez Madagascar', description: 'Parcourez les meilleurs hôtels, restaurants, activités et bons plans classés par région.', icon: Search, color: '#8b5cf6' },
  { step: 2, title: 'Trouvez le bon plan', description: "Utilisez la carte interactive, les filtres par catégorie et les avis pour trouver l'offre parfaite.", icon: MapPin, color: '#22c55e' },
  { step: 3, title: 'Profitez des Flash Deals', description: 'Bénéficiez de réductions exclusives et limitées dans le temps proposées par nos établissements.', icon: Zap, color: '#f59e0b' },
  { step: 4, title: 'Partagez votre expérience', description: 'Laissez un avis pour aider les autres voyageurs et contribuez à la communauté Mada Spot.', icon: Star, color: '#ec4899' },
];

export function AnimatedHero({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StepsGrid({ type }: { type: 'etablissement' | 'visiteur' }) {
  const steps = type === 'etablissement' ? STEPS_ETABLISSEMENT : STEPS_VISITEUR;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((item, i) => (
        <AnimatedStepCard key={item.step} item={item} index={i} totalSteps={steps.length} />
      ))}
    </div>
  );
}

function AnimatedStepCard({ item, index, totalSteps }: { item: Step; index: number; totalSteps: number }) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative bg-[#1a1a24] border border-[#2a2a36] rounded-2xl p-6 hover:border-[#2a2a36]/80 transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${item.color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color: item.color }} />
        </div>
        <span className="text-3xl font-bold text-gray-300">{item.step}</span>
      </div>
      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
      {index < totalSteps - 1 && (
        <ArrowRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 z-10" />
      )}
    </motion.div>
  );
}
