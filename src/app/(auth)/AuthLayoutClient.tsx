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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a1a24] to-[#0a0a0f] flex">
      {/* Partie gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]/40" />

        {/* Cercles décoratifs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-8">
              <Image src="/logo.png" alt="Mada Spot" width={48} height={48} className="w-12 h-12 object-contain" />
              <span className="text-3xl font-bold text-white">
                Mada<span className="text-orange-500"> Spot</span>
              </span>
            </Link>

            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Bienvenue sur<br />
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Mada Spot</span>
            </h1>

            <p className="text-lg text-gray-300 mb-10 max-w-md">
              Découvrez les meilleurs hôtels, restaurants et attractions
              de Madagascar.
            </p>

            {/* Avantages */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Bons plans locaux</p>
                  <p className="text-sm text-gray-400">Les meilleures adresses de Madagascar</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <Star className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Avis vérifiés</p>
                  <p className="text-sm text-gray-400">Des retours authentiques</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Réservation facile</p>
                  <p className="text-sm text-gray-400">Réservez en quelques clics</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="Mada Spot" width={40} height={40} className="w-10 h-10 object-contain" />
              <span className="text-2xl font-bold text-white">
                Mada<span className="text-orange-500"> Spot</span>
              </span>
            </Link>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}
