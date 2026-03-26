import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carte interactive — Mada Spot',
  description: 'Visualisez les restaurants, hôtels et attractions de Madagascar sur une carte interactive.',
  keywords: ['carte madagascar', 'carte interactive', 'localisation', 'hôtels', 'restaurants', 'attractions'],
  openGraph: {
    title: 'Carte interactive — Mada Spot',
    description: 'Visualisez les restaurants, hôtels et attractions de Madagascar sur une carte interactive.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Mada Spot — Carte interactive' }],
  },
};

export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
