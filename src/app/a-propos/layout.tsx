import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos de Mada Spot — Plateforme Tourisme Madagascar',
  description: 'Mada Spot connecte voyageurs et établissements malgaches pour faire découvrir la Grande Île. Notre mission, nos valeurs et notre équipe.',
  keywords: ['à propos Mada Spot', 'tourisme Madagascar', 'plateforme touristique Madagascar', 'voyage Madagascar'],
  alternates: {
    canonical: '/a-propos',
  },
};

export default function AProposLayout({ children }: { children: React.ReactNode }) {
  return children;
}
