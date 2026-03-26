'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Calendar } from 'lucide-react';

export default function SoumettreEvenementPage() {
  return (
    <div className="min-h-screen bg-[#070710]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <Link
          href="/evenements"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>

        <div className="bg-[#0c0c16] rounded-2xl border border-[#1e1e2e] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Événements gérés par l&apos;administration
          </h1>
          <p className="text-gray-400 mb-6">
            La création d&apos;événements est réservée aux administrateurs de MadaSpot.
            Consultez les événements disponibles sur la page dédiée.
          </p>
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-orange-500/25 transition-all text-sm"
          >
            <Calendar className="w-4 h-4" />
            Voir les événements
          </Link>
        </div>
      </div>
    </div>
  );
}
