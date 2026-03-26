import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FAQAccordion from './FAQAccordion';

export const metadata: Metadata = {
  title: 'Questions Fréquentes (FAQ) — Mada Spot | Tourisme Madagascar',
  description: 'Trouvez les réponses à vos questions sur Mada Spot : inscription, réservation d\'hôtels et restaurants à Madagascar, attractions touristiques et plus.',
  keywords: ['FAQ Madagascar', 'questions tourisme Madagascar', 'aide réservation hôtel Madagascar', 'Mada Spot aide'],
  alternates: {
    canonical: '/faq',
  },
};

const FAQ_SECTIONS = [
  {
    title: 'Général',
    items: [
      {
        question: 'Qu\'est-ce que Mada Spot ?',
        answer: 'Mada Spot est une plateforme en ligne qui regroupe les meilleurs hôtels, restaurants et attractions touristiques à Madagascar. Nous vous aidons à trouver, comparer et réserver les meilleures adresses.',
      },
      {
        question: 'L\'inscription est-elle gratuite ?',
        answer: 'Oui, l\'inscription est entièrement gratuite. Créez un compte pour accéder aux réservations, favoris et avis.',
      },
      {
        question: 'Mada Spot est-il disponible hors d\'Antananarivo ?',
        answer: 'Oui ! Nous couvrons plus de 20 villes à Madagascar, dont Antananarivo, Nosy Be, Toamasina, Mahajanga, Antsirabe, Fianarantsoa et bien d\'autres. Notre couverture s\'étend continuellement.',
      },
    ],
  },
  {
    title: 'Compte et inscription',
    items: [
      {
        question: 'Comment créer un compte ?',
        answer: 'Cliquez sur "S\'inscrire" en haut de la page. Vous pouvez vous inscrire avec votre email ou votre numéro de téléphone et remplir vos informations.',
      },
      {
        question: 'J\'ai oublié mon mot de passe, que faire ?',
        answer: 'Rendez-vous sur la page de connexion et cliquez sur "Mot de passe oublié". Entrez votre email et vous recevrez un lien de réinitialisation valable 1 heure.',
      },
      {
        question: 'Comment supprimer mon compte ?',
        answer: 'Rendez-vous dans les paramètres de votre compte et cliquez sur "Supprimer mon compte". Cette action est irréversible et entraîne la suppression de toutes vos données.',
      },
    ],
  },
  {
    title: 'Réservations',
    items: [
      {
        question: 'Comment réserver un hôtel ou un restaurant ?',
        answer: 'Trouvez l\'établissement qui vous intéresse, consultez sa fiche détaillée et cliquez sur "Réserver". Remplissez le formulaire avec vos dates et préférences. L\'établissement confirmera votre réservation.',
      },
      {
        question: 'Puis-je annuler une réservation ?',
        answer: 'Oui, vous pouvez annuler une réservation depuis votre espace client. Les conditions d\'annulation dépendent de l\'établissement.',
      },
    ],
  },
  {
    title: 'Avis et évaluations',
    items: [
      {
        question: 'Comment laisser un avis ?',
        answer: 'Après avoir utilisé un service ou visité un établissement, rendez-vous sur sa fiche et cliquez sur "Laisser un avis". Attribuez une note de 1 à 5 étoiles et rédigez votre commentaire.',
      },
      {
        question: 'Les avis sont-ils modérés ?',
        answer: 'Oui, tous les avis sont soumis à modération pour garantir leur authenticité et éviter les contenus inappropriés. Les avis liés à un service réellement effectué reçoivent un badge "Vérifié".',
      },
    ],
  },
  {
    title: 'Sécurité et confidentialité',
    items: [
      {
        question: 'Mes données personnelles sont-elles protégées ?',
        answer: 'Oui, nous prenons la protection de vos données très au sérieux. Vos mots de passe sont chiffrés, vos sessions sont sécurisées et nous n\'utilisons aucun cookie publicitaire. Consultez notre politique de confidentialité pour plus de détails.',
      },
      {
        question: 'Comment signaler un contenu inapproprié ?',
        answer: 'Utilisez le bouton "Signaler" présent sur chaque fiche, avis ou profil. Notre équipe de modération examinera votre signalement dans les meilleurs délais.',
      },
    ],
  },
];

function FAQJsonLd() {
  const allItems = FAQ_SECTIONS.flatMap(s => s.items);
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allItems.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
    />
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <FAQJsonLd />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8" />
              <span className="text-blue-200 text-lg">Centre d&apos;aide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Questions fréquentes</h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              Trouvez rapidement les réponses à vos questions sur Mada Spot.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <FAQAccordion sections={FAQ_SECTIONS} />
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vous n&apos;avez pas trouvé votre réponse ?</h2>
            <p className="text-gray-600 mb-4">
              Notre équipe est disponible pour vous aider.
            </p>
            <Link
              href="/contact"
              className="inline-flex px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
