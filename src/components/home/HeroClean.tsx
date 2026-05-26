'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  Building2,
  UtensilsCrossed,
  Mountain,
  Briefcase,
} from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

type Tab = 'hotels' | 'restaurants' | 'attractions' | 'guides';

const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
  { key: 'hotels', label: 'Hébergements', icon: Building2 },
  { key: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed },
  { key: 'attractions', label: 'Activités', icon: Mountain },
  { key: 'guides', label: 'Guides', icon: Briefcase },
];

/**
 * HeroClean — Booking.com inspired hero.
 *
 * Structure :
 *  - Bandeau bleu avec tabs catégorie en haut + grid 2 cols (texte + image immersive)
 *  - Search bar simplifiée 1 ligne en bas, dépasse à cheval bleu/blanc
 *  - Bordure orange MadaSpot autour de la search box (signature)
 */
export default function HeroClean() {
  const [tab, setTab] = useState<Tab>('hotels');

  return (
    <section className="relative bg-[#F8FAFC]">
      {/* Bandeau bleu */}
      <div className="bg-[#003B95] px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Tabs catégorie */}
          <div className="pt-5 sm:pt-6 flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-[13px] sm:text-[14px] font-semibold whitespace-nowrap border transition-all ${
                  tab === t.key
                    ? 'bg-transparent text-white border-white'
                    : 'bg-transparent text-white/70 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenu hero : grid 2 cols (texte 45% / image 55%) */}
          <div className="grid lg:grid-cols-[9fr_11fr] gap-8 lg:gap-12 items-stretch mt-8 sm:mt-10">
            {/* Texte */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="text-center lg:text-left flex flex-col justify-center py-6 sm:py-10"
            >
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[12px] text-white/90 font-medium mb-5 border border-white/15 mx-auto lg:mx-0 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
                <span>230+ établissements vérifiés à Madagascar</span>
              </div>

              <h1
                className="text-white text-[36px] sm:text-[48px] lg:text-[56px] font-bold leading-[1.05] tracking-[-0.025em]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Découvrez le vrai{' '}
                <span className="text-[#FF6B35]">Madagascar</span>
              </h1>
              <p className="mt-4 sm:mt-5 text-[16px] sm:text-[18px] text-white/85 max-w-xl leading-relaxed mx-auto lg:mx-0">
                Hôtels, restaurants, guides et activités vérifiés sur place. Réservation directe, sans intermédiaire.
              </p>

              {/* CTA */}
              <div className="mt-6 sm:mt-8 flex justify-center lg:justify-start">
                <Link
                  href="/attractions"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold rounded-xl text-[15px] transition-all shadow-[0_8px_30px_rgba(255,107,53,0.30)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.45)]"
                >
                  Explorer Madagascar
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </motion.div>

            {/* Photo immersive */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
              className="relative h-[300px] sm:h-[400px] lg:h-full lg:min-h-[460px] w-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.4)] bg-[#0F172A]"
            >
              <Image
                src="/images/highlights/hero-pool-madagascar.jpg"
                alt="Madagascar"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search bar à cheval bleu/blanc (style Booking) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10 relative z-10">
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-0 bg-white rounded-xl border-2 border-[#FF6B35] shadow-[0_8px_24px_rgba(15,23,42,0.10)] overflow-hidden"
        >
          {/* Destination */}
          <label className="flex items-center gap-3 px-4 py-3.5 border-b md:border-b-0 md:border-r border-[#FF6B35]/30">
            <MapPin className="w-5 h-5 text-[#FF6B35] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Destination
              </p>
              <input
                type="text"
                placeholder="Où voulez-vous aller ?"
                className="w-full outline-none text-[14px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal bg-transparent"
              />
            </div>
          </label>

          {/* Dates */}
          <label className="flex items-center gap-3 px-4 py-3.5 border-b md:border-b-0 md:border-r border-[#FF6B35]/30 cursor-pointer">
            <Calendar className="w-5 h-5 text-[#64748B] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Dates
              </p>
              <p className="text-[14px] font-semibold text-[#94A3B8]">Choisir</p>
            </div>
          </label>

          {/* Voyageurs */}
          <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer md:border-r border-[#FF6B35]/30">
            <Users className="w-5 h-5 text-[#64748B] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                Voyageurs
              </p>
              <p className="text-[14px] font-semibold text-[#0F172A]">2 adultes</p>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </label>

          {/* CTA Rechercher */}
          <button
            type="submit"
            className="bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold px-6 py-3.5 transition-colors text-[15px] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            Rechercher
          </button>
        </motion.form>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
          className="mt-8 sm:mt-10 grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-8"
        >
          <TrustItem value="230+" label="Établissements vérifiés" />
          <TrustItem value="18" label="Régions couvertes" />
          <TrustItem value="4.7" suffix="★" label="Note moyenne" highlight />
          <TrustItem value="100%" label="Gratuit pour les pros" />
        </motion.div>
      </div>

      {/* Bandeau pros */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <p className="font-bold text-[16px] text-[#0F172A]">
                Vous gérez un établissement à Madagascar ?
              </p>
              <p className="text-[14px] text-[#64748B] mt-0.5 leading-relaxed">
                Inscrivez-vous gratuitement et recevez des contacts de voyageurs dès cette semaine.
              </p>
            </div>
          </div>
          <Link
            href="/inscrire-etablissement"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-semibold rounded-xl text-[14px] transition-colors whitespace-nowrap shadow-[0_4px_14px_rgba(255,107,53,0.25)]"
          >
            Devenir partenaire
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function TrustItem({
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
    <div className="flex flex-col">
      <div className="flex items-baseline gap-0.5">
        <span className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-mono tabular-nums">
          {value}
        </span>
        {suffix && (
          <span
            className={`text-[18px] sm:text-[22px] font-bold ${
              highlight ? 'text-[#FF6B35]' : 'text-[#64748B]'
            }`}
          >
            {suffix}
          </span>
        )}
      </div>
      <p className="text-[12px] sm:text-[13px] text-[#64748B] mt-1">{label}</p>
    </div>
  );
}
