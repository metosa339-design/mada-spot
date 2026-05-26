'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Shield } from 'lucide-react';

export default function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Partie gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/70" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/" className="flex items-center gap-3 mb-8">
              <Image src="/logo.png" alt="Mada Spot" width={44} height={44} className="w-11 h-11 object-contain" />
              <span className="text-[24px] font-semibold tracking-[-0.02em] text-[#0F172A]">
                Mada<span className="text-[#FF6B35]"> Spot</span>
              </span>
            </Link>

            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Bienvenue</p>
            <h1 className="text-[36px] xl:text-[48px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-6 leading-[1.05]">
              Explorez<br />
              <span className="text-[#FF6B35]">Madagascar</span>
            </h1>

            <p className="text-[15px] text-[#334155] mb-10 max-w-md leading-relaxed">
              Découvrez les meilleurs hôtels, restaurants et attractions de Madagascar.
            </p>

            <div className="space-y-3">
              {[
                { icon: MapPin, title: 'Bons plans locaux', desc: 'Les meilleures adresses de Madagascar' },
                { icon: Star, title: 'Avis vérifiés', desc: 'Des retours authentiques' },
                { icon: Shield, title: 'Réservation facile', desc: 'Réservez en quelques clics' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur-md border border-[#E2E8F0] rounded-lg">
                  <div className="w-9 h-9 rounded-md bg-[#FFF7ED] border border-[#FF6B35]/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-[#0F172A] font-medium text-[13px]">{title}</p>
                    <p className="text-[11px] text-[#64748B]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#F8FAFC]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="Mada Spot" width={36} height={36} className="w-9 h-9 object-contain" />
              <span className="text-[20px] font-semibold tracking-[-0.02em] text-[#0F172A]">
                Mada<span className="text-[#FF6B35]"> Spot</span>
              </span>
            </Link>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
