import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prestataires touristiques à Madagascar — Guides, Chauffeurs, Agences | Mada Spot',
  description: 'Trouvez les meilleurs guides touristiques, chauffeurs privés, agences de voyage et prestataires de services à Madagascar. Avis vérifiés et réservation en ligne.',
  keywords: ['prestataires touristiques Madagascar', 'guide touristique Madagascar', 'chauffeur privé Madagascar', 'agence de voyage Madagascar', 'location voiture Madagascar', 'excursions Madagascar', 'tour opérateur Madagascar'],
  alternates: {
    canonical: '/bons-plans/prestataires',
  },
  openGraph: {
    title: 'Prestataires touristiques à Madagascar — Mada Spot',
    description: 'Trouvez les meilleurs guides, chauffeurs, agences de voyage et prestataires de services touristiques à Madagascar.',
    url: 'https://madaspot.com/bons-plans/prestataires',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'Prestataires touristiques Madagascar — Mada Spot' }],
  },
};

export default function PrestatairesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
