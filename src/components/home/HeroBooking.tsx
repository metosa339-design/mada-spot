'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, MapPin, Calendar, Users, ChevronDown, Star } from 'lucide-react';
import { useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * HeroBooking — Booking.com inspired hero
 *
 * - Bleu foncé Booking (#003580) en bandeau top
 * - Search box flottante centrale en blanc avec ombre
 * - CTA jaune Booking (#FEBB02) "Rechercher"
 * - Trust signals dessous (10K+ voyageurs, 230+ partenaires)
 *
 * Brancher dans src/app/page.tsx :
 *   - remplacer  <HeroV2 />  par  <HeroBooking />
 *   - changer le bg parent <main> de bg-[#F8FAFC] vers bg-white
 */
export default function HeroBooking() {
  const [tab, setTab] = useState<'hotels' | 'restaurants' | 'activities' | 'guides'>('hotels');

  return (
    <section className="relative bg-white">
      {/* Top bandeau bleu foncé Booking */}
      <div className="bg-[#003580] text-white pt-12 sm:pt-16 pb-32 sm:pb-36 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-center sm:text-left"
          >
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold leading-[1.05] tracking-[-0.02em]">
              Trouvez votre prochaine
              <br />
              <span className="text-[#FEBB02]">aventure à Madagascar</span>
            </h1>
            <p className="mt-4 sm:mt-5 text-[16px] sm:text-[18px] text-white/90 max-w-xl mx-auto sm:mx-0">
              Hôtels, restaurants, activités et guides locaux. Réservez directement, sans intermédiaire.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search box flottante */}
      <div className="max-w-6xl mx-auto px-4 -mt-24 sm:-mt-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          className="bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#FEBB02]/40 overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-[#E7E7E7] overflow-x-auto scrollbar-hide">
            {[
              { key: 'hotels' as const, label: 'Hébergements' },
              { key: 'restaurants' as const, label: 'Restaurants' },
              { key: 'activities' as const, label: 'Activités' },
              { key: 'guides' as const, label: 'Guides' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3.5 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  tab === t.key
                    ? 'border-[#FEBB02] text-[#003580]'
                    : 'border-transparent text-[#595959] hover:text-[#1A1A1A]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 sm:gap-3">
            {/* Destination */}
            <label className="flex items-center gap-2.5 px-3 py-3 border-2 border-[#FEBB02] rounded-md bg-white">
              <MapPin className="w-5 h-5 text-[#003580] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#595959] uppercase tracking-wide">Destination</p>
                <input
                  type="text"
                  placeholder="Où allez-vous ?"
                  className="w-full outline-none text-[15px] font-semibold text-[#1A1A1A] placeholder:text-[#767676] placeholder:font-normal"
                />
              </div>
            </label>

            {/* Dates */}
            <label className="flex items-center gap-2.5 px-3 py-3 border border-[#E7E7E7] rounded-md bg-white">
              <Calendar className="w-5 h-5 text-[#003580] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#595959] uppercase tracking-wide">Dates</p>
                <p className="text-[15px] font-semibold text-[#767676]">Choisir</p>
              </div>
            </label>

            {/* Voyageurs */}
            <label className="flex items-center gap-2.5 px-3 py-3 border border-[#E7E7E7] rounded-md bg-white">
              <Users className="w-5 h-5 text-[#003580] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#595959] uppercase tracking-wide">Voyageurs</p>
                <p className="text-[15px] font-semibold text-[#1A1A1A]">2 adultes</p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#595959]" />
            </label>

            {/* CTA jaune */}
            <button
              type="submit"
              className="bg-[#0071C2] hover:bg-[#005EA8] text-white font-bold px-6 py-3 rounded-md transition-colors text-[16px] whitespace-nowrap"
            >
              Rechercher
            </button>
          </form>
        </motion.div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
          className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left"
        >
          <TrustItem icon="🏨" value="230+" label="établissements" />
          <TrustItem icon="🗺️" value="18" label="régions couvertes" />
          <TrustItem icon="⭐" value="4.7/5" label="note moyenne" />
          <TrustItem icon="✓" value="100%" label="gratuit pour les pros" />
        </motion.div>
      </div>

      {/* Bouton inscription pros — bandeau secondaire */}
      <div className="max-w-6xl mx-auto px-4 mt-10 sm:mt-12">
        <div className="bg-[#FFF8E1] border border-[#FEBB02]/40 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-[#FEBB02] flex items-center justify-center shrink-0 text-xl">
              🏨
            </div>
            <div>
              <p className="font-bold text-[15px] text-[#1A1A1A]">Vous gérez un hôtel, un restaurant ou une activité ?</p>
              <p className="text-[13px] text-[#595959] mt-0.5">Inscrivez votre établissement gratuitement et recevez des réservations en quelques minutes.</p>
            </div>
          </div>
          <Link
            href="/inscrire-etablissement"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-[#003580] hover:bg-[#002B65] text-white font-bold rounded-md text-[14px] transition-colors whitespace-nowrap"
          >
            Devenir partenaire
          </Link>
        </div>
      </div>
    </section>
  );
}

function TrustItem({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-[16px] font-bold text-[#1A1A1A] leading-tight">{value}</p>
        <p className="text-[12px] text-[#595959]">{label}</p>
      </div>
    </div>
  );
}
