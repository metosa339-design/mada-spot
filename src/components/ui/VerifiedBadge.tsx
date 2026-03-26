'use client';

import { BadgeCheck, Shield, Award, Star } from 'lucide-react';

type BadgeVariant = 'verified' | 'top-rated' | 'top-rated-plus' | 'level2' | 'level1' | 'new';

interface VerifiedBadgeProps {
  variant: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const config: Record<BadgeVariant, { icon: any; label: string; color: string; bg: string; border: string }> = {
  'verified': {
    icon: BadgeCheck,
    label: 'Vérifié',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  'top-rated-plus': {
    icon: Award,
    label: 'Top Rated Plus',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  'top-rated': {
    icon: Star,
    label: 'Top Rated',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  'level2': {
    icon: Shield,
    label: 'Niveau 2',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  'level1': {
    icon: Shield,
    label: 'Niveau 1',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
  },
  'new': {
    icon: Star,
    label: 'Nouveau',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
  },
};

const sizes = {
  sm: { icon: 'w-3 h-3', text: 'text-[10px]', px: 'px-1.5 py-0.5', gap: 'gap-0.5' },
  md: { icon: 'w-3.5 h-3.5', text: 'text-xs', px: 'px-2 py-1', gap: 'gap-1' },
  lg: { icon: 'w-4 h-4', text: 'text-sm', px: 'px-3 py-1.5', gap: 'gap-1.5' },
};

export default function VerifiedBadge({ variant, size = 'md', showLabel = true }: VerifiedBadgeProps) {
  const c = config[variant];
  const s = sizes[size];
  const Icon = c.icon;

  return (
    <span className={`inline-flex items-center ${s.gap} ${s.px} ${c.bg} ${c.color} ${c.border} border rounded-full font-medium ${s.text}`}>
      <Icon className={s.icon} />
      {showLabel && <span>{c.label}</span>}
    </span>
  );
}

export function getSellerBadgeVariant(sellerLevel: string | null | undefined, verified: boolean): BadgeVariant {
  if (sellerLevel === 'Top Rated Plus') return 'top-rated-plus';
  if (sellerLevel === 'Top Rated') return 'top-rated';
  if (sellerLevel === 'Level 2') return 'level2';
  if (sellerLevel === 'Level 1') return 'level1';
  if (verified) return 'verified';
  return 'new';
}
