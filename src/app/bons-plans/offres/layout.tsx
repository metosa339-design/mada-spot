import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offres & Promotions à Madagascar | Mada Spot',
  description: 'Profitez des meilleures offres et promotions sur les hôtels, restaurants et activités à Madagascar. Réductions exclusives sur Mada Spot.',
  keywords: ['offres madagascar', 'promotions', 'réductions', 'bons plans', 'deals'],
  openGraph: {
    title: 'Offres & Promotions à Madagascar | Mada Spot',
    description: 'Profitez des meilleures offres et promotions à Madagascar.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Mada Spot — Offres & Promotions' }],
  },
};

export default function OffresLayout({ children }: { children: React.ReactNode }) {
  return children;
}
