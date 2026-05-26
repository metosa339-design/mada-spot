'use client';

import { motion } from 'framer-motion';
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
 * HeroClean — Booking-inspired light premium hero.
 *
 * - Bandeau bleu Booking (#003B95) avec headline + sous-titre
 * - Search box flottante blanche avec ombre douce
 * - Bordure orange MadaSpot sur le champ Destination (signature de marque)
 * - CTA primaire dark slate (élégant)
 * - Trust signals dessous
 * - Banner pros en bas avec accent orange
 */
export default function HeroClean() {
  const [tab, setTab] = useState<Tab>('hotels');

  return (
    <section className="relative bg-[#F8FAFC]">
      {/* Bandeau bleu foncé */}
      <div className="bg-[#003B95] pt-14 sm:pt-20 pb-40 sm:pb-44 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-center sm:text-left"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[12px] text-white/90 font-medium mb-5 border border-white/15">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
              <span>230+ établissements vérifiés à Madagascar</span>
            </div>

            <h1
              className="text-white text-[36px] sm:text-[52px] lg:text-[64px] font-bold leading-[1.05] tracking-[-0.025em] max-w-3xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Découvrez le vrai{' '}
              <span className="text-[#FF6B35]">Madagascar</span>
            </h1>
            <p className="mt-4 sm:mt-5 text-[16px] sm:text-[19px] text-white/85 max-w-xl leading-relaxed">
              Hôtels, restaurants, guides et activités vérifiés sur place. Réservation directe, sans intermédiaire.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search box flottante */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-28 sm:-mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,23,42,0.08)] border border-[#E2E8F0] overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-[#E2E8F0] overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-4 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-[#FF6B35] text-[#0F172A]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-2.5">
            {/* Destination (avec bordure orange signature) */}
            <label className="flex items-center gap-3 px-3.5 py-3 border-2 border-[#FF6B35] rounded-xl bg-white">
              <MapPin className="w-5 h-5 text-[#FF6B35] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  Destination
                </p>
                <input
                  type="text"
                  placeholder="Où voulez-vous aller ?"
                  className="w-full outline-none text-[15px] font-semibold text-[#0F172A] placeholder:text-[#94A3B8] placeholder:font-normal"
                />
              </div>
            </label>

            {/* Dates */}
            <label className="flex items-center gap-3 px-3.5 py-3 border border-[#E2E8F0] rounded-xl bg-white hover:border-[#CBD5E1] transition-colors cursor-pointer">
              <Calendar className="w-5 h-5 text-[#64748B] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                  Dates
                </p>
                <p className="text-[14px] font-semibold text-[#94A3B8]">Choisir</p>
              </div>
            </label>

            {/* Voyageurs */}
            <label className="flex items-center gap-3 px-3.5 py-3 border border-[#E2E8F0] rounded-xl bg-white hover:border-[#CBD5E1] transition-colors cursor-pointer">
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
              className="bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-[15px] flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Rechercher
            </button>
          </form>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
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
        <span
          className="text-[24px] sm:text-[28px] font-bold text-[#0F172A] tracking-[-0.02em] font-mono tabular-nums"
        >
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
