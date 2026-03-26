import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Mentions Légales — Mada Spot',
  description: 'Mentions légales de la plateforme Mada Spot.',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions Légales</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800">1. Éditeur du site</h2>
            <p>
              Le site <strong>Mada Spot</strong> (madaspot.mg) est édité par :<br />
              Mada Spot SARL<br />
              Siège social : Antananarivo, Madagascar<br />
              Email : contact@madaspot.mg<br />
              Directeur de la publication : L'équipe Mada Spot
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">2. Hébergement</h2>
            <p>
              Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
              La base de données est hébergée par Neon (neon.tech).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus du site (textes, images, vidéos, logos, graphismes) est protégé
              par le droit d'auteur et la propriété intellectuelle. Toute reproduction, même partielle,
              est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">4. Données personnelles</h2>
            <p>
              Conformément à la loi sur la protection des données personnelles, vous disposez d'un droit
              d'accès, de rectification et de suppression de vos données. Consultez notre{' '}
              <Link href="/politique-confidentialite" className="text-orange-500 underline">
                politique de confidentialité
              </Link>{' '}
              pour plus de détails.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">5. Cookies</h2>
            <p>
              Le site utilise des cookies essentiels pour le fonctionnement du service (sessions
              d'authentification, préférences de langue et de devise). Aucun cookie publicitaire
              ou de suivi tiers n'est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">6. Responsabilité</h2>
            <p>
              Mada Spot met tout en œuvre pour fournir des informations fiables et à jour.
              Toutefois, des erreurs ou omissions peuvent survenir. Mada Spot ne saurait être tenu
              responsable de l'utilisation faite des informations publiées sur le site.
            </p>
            <p>
              Les avis publiés sur la plateforme sont la responsabilité de leurs auteurs respectifs.
              Mada Spot se réserve le droit de modérer ou supprimer tout contenu jugé inapproprié.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">7. Contact</h2>
            <p>
              Pour toute question relative aux mentions légales, contactez-nous à :{' '}
              <a href="mailto:contact@madaspot.mg" className="text-orange-500 underline">contact@madaspot.mg</a>
            </p>
          </section>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
