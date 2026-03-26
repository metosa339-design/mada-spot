import Link from 'next/link';
import { ArrowLeft, Zap, Target, Users, Heart, Globe, Shield } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'À propos de Mada Spot — Plateforme Tourisme Madagascar',
  description: 'Mada Spot est la plateforme n°1 du tourisme à Madagascar. Découvrez notre mission : connecter voyageurs et établissements malgaches pour promouvoir la Grande Île.',
  keywords: ['à propos Mada Spot', 'tourisme Madagascar', 'plateforme touristique Madagascar', 'voyage Madagascar'],
  alternates: {
    canonical: '/a-propos',
  },
};

const VALUES = [
  {
    icon: Target,
    title: 'Notre mission',
    description: 'Connecter les voyageurs et résidents avec les meilleurs établissements de Madagascar, en rendant l\'information accessible et fiable.',
  },
  {
    icon: Globe,
    title: 'Promouvoir Madagascar',
    description: 'Mettre en valeur la richesse culturelle, historique et naturelle de la Grande Île à travers du contenu éducatif et informatif.',
  },
  {
    icon: Users,
    title: 'Soutenir les locaux',
    description: 'Donner aux établissements malgaches une vitrine professionnelle pour développer leur activité et atteindre plus de clients.',
  },
  {
    icon: Shield,
    title: 'Confiance et transparence',
    description: 'Garantir des avis vérifiés, des informations à jour et un système de mise en relation sécurisé pour tous nos utilisateurs.',
  },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#ff6b35] via-orange-500 to-[#ff1493] text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-7 h-7" />
              </div>
              <span className="text-white/80 text-lg">Notre histoire</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">À propos de Mada Spot</h1>
            <p className="text-xl text-white/90 max-w-2xl">
              La plateforme de référence pour découvrir, explorer et profiter de tout ce que
              Madagascar a de meilleur à offrir.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="prose prose-gray max-w-none space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Pourquoi Mada Spot ?</h2>
              <p>
                Madagascar regorge de trésors : des hôtels de charme nichés dans des paysages
                époustouflants, des restaurants aux saveurs uniques, des artisans talentueux et
                des attractions uniques. Pourtant, trouver le bon établissement reste souvent un défi.
              </p>
              <p>
                <strong>Mada Spot</strong> est né de ce constat simple : il manquait un espace
                centralisé, fiable et moderne pour connecter ceux qui cherchent avec ceux qui
                proposent. Que vous soyez touriste planifiant votre séjour, résident cherchant
                un bon restaurant, ou propriétaire souhaitant développer votre clientèle,
                Mada Spot est fait pour vous.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8">Plus qu&apos;un annuaire</h2>
              <p>
                Au-delà de la mise en relation, Mada Spot est une fenêtre sur Madagascar.
                Notre plateforme propose du contenu riche sur l&apos;histoire, l&apos;économie,
                la culture et la biodiversité de la Grande Île, pour que chaque visiteur
                reparte avec une compréhension plus profonde de ce pays extraordinaire.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Nos valeurs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VALUES.map((value) => (
                <div key={value.title} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <value.icon className="w-10 h-10 text-[#ff6b35] mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Mada Spot en chiffres</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">500+</div>
                <div className="text-sm text-gray-600">Établissements référencés</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">1000+</div>
                <div className="text-sm text-gray-600">Avis vérifiés</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">20+</div>
                <div className="text-sm text-gray-600">Villes couvertes</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">50+</div>
                <div className="text-sm text-gray-600">Catégories de services</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-gradient-to-r from-[#1a1a2e] to-[#16213e]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Heart className="w-10 h-10 text-[#ff6b35] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Rejoignez l&apos;aventure</h2>
            <p className="text-gray-400 mb-6">
              Que vous soyez propriétaire d&apos;un établissement ou visiteur, faites partie de la communauté Mada Spot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/bons-plans"
                className="px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                Découvrir les bons plans
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
