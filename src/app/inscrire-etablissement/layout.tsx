import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscrire mon établissement gratuitement — Mada Spot | Tourisme Madagascar',
  description:
    'Référencez gratuitement votre hôtel, restaurant, guide touristique ou attraction à Madagascar sur Mada Spot. Gagnez en visibilité auprès de milliers de voyageurs internationaux. Inscription en 5 minutes.',
  keywords: [
    'référencer hôtel Madagascar',
    'inscrire restaurant Madagascar',
    'plateforme tourisme Madagascar',
    'visibilité hôtel Nosy Be',
    'guide touristique Madagascar inscription',
    'référencement gratuit établissement Madagascar',
    'promouvoir activité touristique Madagascar',
    'annuaire tourisme Madagascar',
    'Mada Spot prestataire',
    'inscription gratuite tourisme',
    'réservation en ligne Madagascar',
    'attirer touristes Madagascar',
  ],
  alternates: {
    canonical: 'https://madaspot.com/inscrire-etablissement',
  },
  openGraph: {
    title: 'Inscrire mon établissement gratuitement — Mada Spot',
    description:
      'Référencez gratuitement votre hôtel, restaurant ou activité touristique à Madagascar. Visibilité internationale, réservations en ligne, tableau de bord professionnel.',
    url: 'https://madaspot.com/inscrire-etablissement',
    siteName: 'Mada Spot',
    locale: 'fr_MG',
    type: 'website',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'Inscrire mon établissement sur Mada Spot' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inscrire mon établissement gratuitement — Mada Spot',
    description: 'Référencez gratuitement votre établissement touristique à Madagascar.',
  },
};

export default function InscrireEtablissementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
