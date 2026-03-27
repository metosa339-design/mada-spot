import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — Mada Spot',
  description: 'Conditions générales d\'utilisation de la plateforme Mada Spot.',
};

export default function CGUPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : Février 2026</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800">1. Acceptation des conditions</h2>
              <p>
                En accédant et en utilisant le site <strong>Mada Spot</strong> (madaspot.com), vous acceptez
                sans réserve les présentes conditions générales d&apos;utilisation. Si vous n&apos;acceptez pas
                ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">2. Description des services</h2>
              <p>
                Mada Spot est une plateforme permettant aux utilisateurs de découvrir les meilleurs
                établissements à Madagascar. Nos services incluent :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>La recherche et la consultation de fiches d&apos;établissements (hôtels, restaurants, attractions)</li>
                <li>Les avis et évaluations des établissements</li>
                <li>Les informations culturelles, historiques et économiques sur Madagascar</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">3. Inscription et compte utilisateur</h2>
              <p>
                L&apos;inscription est gratuite et nécessite de fournir des informations exactes et à jour.
                Vous êtes responsable de la confidentialité de vos identifiants de connexion.
                Tout usage frauduleux de votre compte doit être signalé immédiatement.
              </p>
              <p>
                Mada Spot se réserve le droit de suspendre ou supprimer tout compte en cas de
                violation des présentes conditions ou de comportement inapproprié.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">4. Obligations des utilisateurs</h2>
              <p>En utilisant Mada Spot, vous vous engagez à :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Fournir des informations véridiques et exactes</li>
                <li>Ne pas publier de contenu diffamatoire, injurieux ou illicite</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Ne pas utiliser la plateforme à des fins de spam ou de harcèlement</li>
                <li>Ne pas tenter de contourner les mesures de sécurité du site</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">5. Obligations des établissements</h2>
              <p>
                Les établissements référencés sur Mada Spot s&apos;engagent à fournir des informations
                exactes sur leurs services, tarifs et disponibilités. Ils sont seuls responsables
                de la qualité de leurs prestations et du respect des lois malgaches en vigueur.
              </p>
              <p>
                Mada Spot agit uniquement en tant qu&apos;intermédiaire et ne garantit pas la
                qualité des services fournis par les établissements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">6. Propriété intellectuelle</h2>
              <p>
                L&apos;ensemble des éléments du site (design, textes, logos, images, code source) est
                la propriété exclusive de Mada Spot ou de ses partenaires. Toute reproduction,
                distribution ou modification sans autorisation écrite est strictement interdite.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">7. Limitation de responsabilité</h2>
              <p>
                Mada Spot ne saurait être tenu responsable des dommages directs ou indirects
                résultant de l&apos;utilisation du site, notamment :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Les interruptions de service ou dysfonctionnements techniques</li>
                <li>L&apos;exactitude des informations publiées par les établissements</li>
                <li>Les litiges entre utilisateurs et établissements</li>
                <li>Les pertes de données ou accès non autorisés à votre compte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">8. Modération du contenu</h2>
              <p>
                Mada Spot se réserve le droit de modérer, modifier ou supprimer tout contenu
                publié sur la plateforme (avis, commentaires, photos) qui enfreindrait les
                présentes conditions ou la législation en vigueur.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">9. Modification des conditions</h2>
              <p>
                Mada Spot peut modifier les présentes CGU à tout moment. Les utilisateurs seront
                informés des modifications significatives. L&apos;utilisation continue du site après
                modification vaut acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">10. Droit applicable</h2>
              <p>
                Les présentes conditions sont régies par le droit malgache. Tout litige sera soumis
                à la compétence des tribunaux d&apos;Antananarivo, Madagascar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">11. Contact</h2>
              <p>
                Pour toute question relative aux CGU, contactez-nous à :{' '}
                <a href="mailto:contact@madaspot.com" className="text-orange-500 underline">contact@madaspot.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
