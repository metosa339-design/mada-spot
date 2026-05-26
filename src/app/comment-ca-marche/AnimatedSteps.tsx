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
import { useTrans } from '@/i18n';

interface StepRaw {
  step: number;
  titleKey: 'step1EstabTitle' | 'step2EstabTitle' | 'step3EstabTitle' | 'step4EstabTitle' | 'step1VisitorTitle' | 'step2VisitorTitle' | 'step3VisitorTitle' | 'step4VisitorTitle';
  descKey: 'step1EstabDesc' | 'step2EstabDesc' | 'step3EstabDesc' | 'step4EstabDesc' | 'step1VisitorDesc' | 'step2VisitorDesc' | 'step3VisitorDesc' | 'step4VisitorDesc';
  icon: LucideIcon;
  color: string;
}

const STEPS_ETABLISSEMENT_RAW: StepRaw[] = [
  { step: 1, titleKey: 'step1EstabTitle', descKey: 'step1EstabDesc', icon: UserPlus, color: '#00ff88' },
  { step: 2, titleKey: 'step2EstabTitle', descKey: 'step2EstabDesc', icon: FileCheck, color: '#ff6b35' },
  { step: 3, titleKey: 'step3EstabTitle', descKey: 'step3EstabDesc', icon: CheckCircle2, color: '#3b82f6' },
  { step: 4, titleKey: 'step4EstabTitle', descKey: 'step4EstabDesc', icon: Rocket, color: '#ff1493' },
];

const STEPS_VISITEUR_RAW: StepRaw[] = [
  { step: 1, titleKey: 'step1VisitorTitle', descKey: 'step1VisitorDesc', icon: Search, color: '#8b5cf6' },
  { step: 2, titleKey: 'step2VisitorTitle', descKey: 'step2VisitorDesc', icon: MapPin, color: '#22c55e' },
  { step: 3, titleKey: 'step3VisitorTitle', descKey: 'step3VisitorDesc', icon: Zap, color: '#f59e0b' },
  { step: 4, titleKey: 'step4VisitorTitle', descKey: 'step4VisitorDesc', icon: Star, color: '#ec4899' },
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
  const t = useTrans('commentCaMarche');
  const steps = type === 'etablissement' ? STEPS_ETABLISSEMENT_RAW : STEPS_VISITEUR_RAW;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {steps.map((item, i) => (
        <AnimatedStepCard
          key={item.step}
          item={item}
          index={i}
          totalSteps={steps.length}
          title={t[item.titleKey]}
          description={t[item.descKey]}
        />
      ))}
    </div>
  );
}

function AnimatedStepCard({
  item,
  index,
  totalSteps,
  title,
  description,
}: {
  item: StepRaw;
  index: number;
  totalSteps: number;
  title: string;
  description: string;
}) {
  const Icon = item.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative bg-[#111114] border border-[#27272A] hover:border-[#3F3F46] rounded-xl p-6 transition-colors"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#FF6B35]" />
        </div>
        <span className="text-[28px] font-semibold font-mono text-[#3F3F46]">{item.step}</span>
      </div>
      <h3 className="text-[16px] font-semibold text-[#FAFAFA] mb-2">{title}</h3>
      <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{description}</p>
      {index < totalSteps - 1 && (
        <ArrowRight className="hidden lg:block absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3F3F46] z-10" />
      )}
    </motion.div>
  );
}
