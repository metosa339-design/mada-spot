'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { useTrans } from '@/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * HeroV2 — Dark premium startup hero.
 *
 * Direction: Vercel/Linear dark mode + signature orange MadaSpot.
 *   - Background #0A0A0F (deep neutral, subtle blue cast)
 *   - Orange #FF6B35 reserved for action signals only (CTA + accent dot)
 *   - Plus Jakarta Sans (load via next/font in layout.tsx)
 *   - Subtle glow on primary CTA, no gradients on text
 *   - Animations slow, single-shot, no infinite loops
 */
export default function HeroV2() {
  const t = useTrans('home');

  return (
    <section className="relative bg-[#F8FAFC] overflow-hidden border-b border-[#E2E8F0]">
      {/* Ambient orange glow blob — barely visible, gives warmth */}
      <div
        aria-hidden
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.12] pointer-events-none"
        style={{ background: 'transparent' }}
      />
      <div
        aria-hidden
        className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.08] pointer-events-none"
        style={{ background: 'transparent' }}
      />

      {/* Grid pattern overlay — subtile, startup vibe */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-20">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-20 items-center">
          {/* Texte */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {/* Eyebrow — live badge */}
            <motion.div
              variants={{
                hidden: { y: 12, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE } },
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFF7ED] text-[#FDBA74] rounded-full text-[12px] font-medium border border-[#FF6B35]/20"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF6B35]" />
              </span>
              <span>230+ établissements vérifiés</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: EASE } },
              }}
              className="mt-7 sm:mt-9 text-[44px] sm:text-[64px] lg:text-[80px] leading-[0.98] font-semibold tracking-[-0.04em] text-[#0F172A]"
              style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
            >
              Voyagez plus.
              <br />
              <span className="text-[#94A3B8]">
                Découvrez{' '}
                <span className="text-[#FF6B35]">Madagascar</span>.
              </span>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p
              variants={{
                hidden: { y: 14, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE, delay: 0.05 } },
              }}
              className="mt-6 sm:mt-8 text-[15px] sm:text-[17px] text-[#64748B] max-w-md leading-[1.6]"
            >
              Hôtels, restaurants, guides, activités. Sélectionnés et vérifiés sur place.
              Réservation directe, sans intermédiaire.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={{
                hidden: { y: 14, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE, delay: 0.12 } },
              }}
              className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/attractions"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                Explorer les spots
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/inscrire-etablissement"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-white text-[#0F172A] rounded-lg text-[14px] font-medium border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
              >
                Référencer mon établissement
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            {/* Search bar */}
            <motion.div
              variants={{
                hidden: { y: 14, opacity: 0 },
                visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: EASE, delay: 0.2 } },
              }}
              className="mt-12"
            >
              <Link
                href="/search"
                className="group flex items-center gap-3 w-full max-w-md px-4 py-3.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-lg transition-colors"
              >
                <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <span className="flex-1 text-[14px] text-[#94A3B8] truncate">
                  Hôtel à Nosy Be, resto à Tana, guide Andasibe…
                </span>
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-white border border-[#E2E8F0] rounded text-[11px] font-mono text-[#64748B]">
                  ⌘ K
                </kbd>
              </Link>
            </motion.div>

            {/* Metrics row */}
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.7, ease: EASE, delay: 0.3 } },
              }}
              className="mt-12 sm:mt-16 grid grid-cols-3 gap-6 sm:gap-10 max-w-md"
            >
              <Metric value="230" suffix="+" label="établissements" />
              <Metric value="18" label="régions" />
              <Metric value="4.7" suffix="★" label="note moyenne" highlight />
            </motion.div>
          </motion.div>

          {/* Visuel */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
            className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white shadow-[0_24px_80px_-12px_rgba(255,107,53,0.15)]"
          >
            <Image
              src="/images/highlights/hero-pool-madagascar.jpg"
              alt="Madagascar"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Floating badges */}
            <div className="absolute top-4 left-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC]/80 backdrop-blur-xl rounded-full border border-[#E2E8F0]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-[12px] font-medium text-[#0F172A]">En ligne</span>
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider mb-1">
                  Spot du jour
                </p>
                <p className="text-[18px] font-semibold text-[#0F172A] leading-tight">
                  Nosy Be
                </p>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Nord-Ouest · 47 spots
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">
                  Latitude
                </p>
                <p className="text-[13px] font-mono text-[#0F172A]">-13.32°</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  value,
  suffix,
  label,
  highlight,
}: {
  value: string;
  suffix?: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.03em] text-[#0F172A] font-mono tabular-nums">
          {value}
        </span>
        {suffix && (
          <span
            className={`text-[20px] sm:text-[24px] font-mono ${
              highlight ? 'text-[#FF6B35]' : 'text-[#64748B]'
            }`}
          >
            {suffix}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] text-[#94A3B8] uppercase tracking-[0.08em]">
        {label}
      </div>
    </div>
  );
}
