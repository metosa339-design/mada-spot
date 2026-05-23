import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales — Mada Spot | Plateforme Tourisme Madagascar',
  description: "Mentions légales complètes du site madaspot.com : éditeur, hébergement, propriété intellectuelle, protection des données et conditions d'utilisation de la plateforme touristique Mada Spot.",
  alternates: { canonical: '/mentions-legales' },
};

export default function MentionsLegalesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
