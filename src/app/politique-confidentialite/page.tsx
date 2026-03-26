import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Mada Spot',
  description: 'Politique de confidentialité et protection des données personnelles de Mada Spot.',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : Février 2026</p>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800">1. Collecte des données</h2>
            <p>
              Mada Spot collecte les données personnelles suivantes lors de votre inscription et utilisation du service :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Données de navigation (cookies de session)</li>
              <li>Contenu généré (avis, réservations, messages)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">2. Finalité du traitement</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gérer votre compte et votre authentification</li>
              <li>Traiter vos réservations</li>
              <li>Afficher et gérer vos avis</li>
              <li>Vous envoyer des notifications relatives à vos activités</li>
              <li>Améliorer nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">3. Partage des données</h2>
            <p>
              Vos données personnelles ne sont pas vendues à des tiers. Elles peuvent être partagées avec :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Les établissements pour le traitement de vos réservations (nom, email, téléphone)</li>
              <li>Nos partenaires techniques (hébergement, email transactionnel)</li>
              <li>Les autorités compétentes en cas d'obligation légale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">4. Conservation des données</h2>
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. En cas de
              suppression de compte, toutes vos données sont effacées dans un délai de 30 jours,
              à l'exception des données que nous sommes légalement tenus de conserver.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">5. Vos droits</h2>
            <p>Conformément à la réglementation en vigueur, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Droit d'accès :</strong> Consulter vos données depuis votre espace client</li>
              <li><strong>Droit de rectification :</strong> Modifier vos informations dans vos paramètres</li>
              <li><strong>Droit de suppression :</strong> Supprimer votre compte et toutes vos données depuis les paramètres</li>
              <li><strong>Droit de portabilité :</strong> Demander l'export de vos données par email</li>
            </ul>
            <p>
              Pour exercer ces droits, rendez-vous dans{' '}
              <Link href="/client/settings" className="text-orange-500 underline">vos paramètres</Link>{' '}
              ou contactez-nous à{' '}
              <a href="mailto:privacy@madaspot.mg" className="text-orange-500 underline">privacy@madaspot.mg</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">6. Cookies</h2>
            <p>
              Mada Spot utilise uniquement des cookies essentiels :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>mada-spot-session :</strong> Session d'authentification (durée : 7 jours)</li>
              <li><strong>mada-spot-admin-session :</strong> Session administration (durée : 24h)</li>
              <li><strong>Préférences :</strong> Langue et devise (localStorage)</li>
            </ul>
            <p>Aucun cookie publicitaire ou de suivi tiers n'est utilisé.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">7. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité appropriées : chiffrement des mots de passe
              (bcrypt), sessions sécurisées (httpOnly, sameSite), protection CSRF, limitation de débit
              sur les endpoints sensibles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">8. Contact</h2>
            <p>
              Pour toute question relative à la protection de vos données :{' '}
              <a href="mailto:privacy@madaspot.mg" className="text-orange-500 underline">privacy@madaspot.mg</a>
            </p>
          </section>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
