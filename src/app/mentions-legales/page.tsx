import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Mentions Légales — Mada Spot | Plateforme Tourisme Madagascar',
  description: 'Mentions légales complètes du site madaspot.com : éditeur, hébergement, propriété intellectuelle, protection des données et conditions d\'utilisation de la plateforme touristique Mada Spot.',
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft className="w-4 h-4" /> Retour à l&apos;accueil
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions Légales</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : mars {currentYear}</p>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800">1. Éditeur du site</h2>
            <p>
              Le site <strong>Mada Spot</strong> accessible à l&apos;adresse <a href="https://madaspot.com" className="text-orange-500 underline">https://madaspot.com</a> est édité par :
            </p>
            <ul className="list-none space-y-1 pl-0">
              <li><strong>Raison sociale :</strong> Mada Spot</li>
              <li><strong>Forme juridique :</strong> Entreprise individuelle</li>
              <li><strong>Siège social :</strong> Ampandrana, Antananarivo 101, Madagascar</li>
              <li><strong>Adresse e-mail :</strong> <a href="mailto:contact@madaspot.com" className="text-orange-500 underline">contact@madaspot.com</a></li>
              <li><strong>Directeur de la publication :</strong> Metosaela RANDRIAMAZAORO</li>
              <li><strong>Activité :</strong> Plateforme de mise en relation entre voyageurs et prestataires touristiques à Madagascar (hôtels, restaurants, attractions, guides)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">2. Hébergement du site</h2>
            <p>Le site madaspot.com est hébergé par :</p>
            <ul className="list-none space-y-1 pl-0">
              <li><strong>Hébergeur principal :</strong> IONOS SE</li>
              <li><strong>Adresse :</strong> Elgendorfer Str. 57, 56410 Montabaur, Allemagne</li>
              <li><strong>Adresse IP du serveur :</strong> 82.165.65.111</li>
              <li><strong>Site web :</strong> <a href="https://www.ionos.fr" target="_blank" rel="noopener noreferrer" className="text-orange-500 underline">www.ionos.fr</a></li>
            </ul>
            <p className="mt-3"><strong>Services tiers utilisés :</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Base de données :</strong> Neon (neon.tech) — PostgreSQL managé, hébergé dans la région US East (AWS)</li>
              <li><strong>CDN et optimisation :</strong> Next.js avec Turbopack</li>
              <li><strong>Service e-mail transactionnel :</strong> IONOS SMTP (contact@madaspot.com)</li>
              <li><strong>Certificat SSL :</strong> Let&apos;s Encrypt — connexion chiffrée HTTPS</li>
              <li><strong>Nom de domaine :</strong> Enregistré chez IONOS SE</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">3. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble des éléments constituant le site madaspot.com (textes, images, photographies,
              vidéos, logos, icônes, graphismes, charte graphique, base de données, code source, logiciels)
              est la propriété exclusive de Mada Spot ou de ses partenaires, et est protégé par les lois
              françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle,
              de ces éléments, quel que soit le moyen ou le procédé utilisé, est interdite sans l&apos;autorisation
              écrite préalable de Mada Spot.
            </p>
            <p>
              La marque « Mada Spot », le logo et les éléments graphiques associés sont des marques déposées.
              Leur utilisation sans autorisation est passible de poursuites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">4. Protection des données personnelles (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679)
              et à la loi malgache sur la protection des données personnelles, Mada Spot s&apos;engage à protéger
              la vie privée de ses utilisateurs.
            </p>
            <p><strong>Données collectées :</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Données d&apos;identification : nom, prénom, adresse e-mail, numéro de téléphone</li>
              <li>Données de connexion : adresse IP, type de navigateur, pages consultées</li>
              <li>Données de réservation : dates, préférences, établissements consultés</li>
              <li>Contenus publiés : avis, photos, messages échangés sur la plateforme</li>
            </ul>
            <p className="mt-3"><strong>Finalités du traitement :</strong></p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Gestion des comptes utilisateurs et authentification sécurisée</li>
              <li>Traitement des réservations et mise en relation avec les prestataires</li>
              <li>Envoi de notifications et communications liées au service</li>
              <li>Amélioration continue de la plateforme et analyse anonymisée d&apos;usage</li>
            </ul>
            <p className="mt-3">
              <strong>Durée de conservation :</strong> Les données sont conservées pendant la durée du compte actif,
              puis supprimées dans un délai de 12 mois après la fermeture du compte.
            </p>
            <p>
              <strong>Vos droits :</strong> Vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression,
              de portabilité et d&apos;opposition sur vos données personnelles. Pour exercer ces droits, contactez-nous à :{' '}
              <a href="mailto:contact@madaspot.com" className="text-orange-500 underline">contact@madaspot.com</a>
            </p>
            <p>
              Pour plus de détails, consultez notre{' '}
              <Link href="/politique-confidentialite" className="text-orange-500 underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">5. Cookies</h2>
            <p>
              Le site madaspot.com utilise des cookies strictement nécessaires au fonctionnement du service :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Cookie de session</strong> (<code>mada-spot-session</code>) : authentification sécurisée, durée 7 jours</li>
              <li><strong>Préférences utilisateur</strong> : langue (FR/EN), devise (MGA/EUR/USD)</li>
              <li><strong>Cookie de consentement</strong> : mémorisation de votre choix concernant les cookies</li>
            </ul>
            <p className="mt-3">
              <strong>Aucun cookie publicitaire ou de tracking tiers</strong> n&apos;est utilisé. Google Analytics est
              utilisé à des fins de mesure d&apos;audience anonymisée uniquement, dans le respect du RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">6. Limitation de responsabilité</h2>
            <p>
              Mada Spot met tout en œuvre pour fournir des informations fiables et à jour sur les établissements
              référencés. Toutefois, Mada Spot ne saurait être tenu responsable :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Des erreurs, omissions ou inexactitudes dans les informations fournies par les prestataires</li>
              <li>De l&apos;indisponibilité temporaire du site pour des raisons de maintenance ou techniques</li>
              <li>Des contenus et avis publiés par les utilisateurs, qui relèvent de leur seule responsabilité</li>
              <li>Des transactions effectuées directement entre utilisateurs et prestataires</li>
            </ul>
            <p className="mt-3">
              Mada Spot agit en qualité de plateforme de mise en relation et non en tant que prestataire
              de services touristiques. Les réservations et transactions sont conclues directement entre
              le voyageur et l&apos;établissement concerné.
            </p>
            <p>
              Mada Spot se réserve le droit de modérer, modifier ou supprimer tout contenu publié sur
              la plateforme qui contreviendrait aux{' '}
              <Link href="/cgu" className="text-orange-500 underline">Conditions Générales d&apos;Utilisation</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">7. Liens hypertextes</h2>
            <p>
              Le site madaspot.com peut contenir des liens vers des sites tiers (établissements partenaires,
              réseaux sociaux, services de cartographie). Mada Spot n&apos;exerce aucun contrôle sur ces sites
              et décline toute responsabilité quant à leur contenu ou leurs pratiques en matière de protection
              des données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">8. Droit applicable et juridiction</h2>
            <p>
              Les présentes mentions légales sont régies par le droit malgache. En cas de litige relatif
              à l&apos;utilisation du site, les parties s&apos;engagent à rechercher une solution amiable avant
              toute action judiciaire. À défaut, les tribunaux compétents d&apos;Antananarivo seront seuls
              compétents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800">9. Contact</h2>
            <p>
              Pour toute question relative aux mentions légales, à la protection de vos données ou au
              fonctionnement de la plateforme :
            </p>
            <ul className="list-none space-y-1 pl-0">
              <li><strong>E-mail :</strong> <a href="mailto:contact@madaspot.com" className="text-orange-500 underline">contact@madaspot.com</a></li>
              <li><strong>Formulaire de contact :</strong> <Link href="/contact" className="text-orange-500 underline">madaspot.com/contact</Link></li>
              <li><strong>Adresse postale :</strong> Mada Spot — Ampandrana, Antananarivo 101, Madagascar</li>
            </ul>
          </section>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
