import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comment ça marche — Mada Spot',
  description: 'Découvrez comment fonctionne Mada Spot : recherchez, comparez et réservez les meilleurs établissements à Madagascar.',
  keywords: ['comment ça marche', 'guide', 'tutoriel', 'Mada Spot', 'réservation'],
  openGraph: {
    title: 'Comment ça marche — Mada Spot',
    description: 'Découvrez comment fonctionne Mada Spot.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Mada Spot — Comment ça marche' }],
  },
};

export default function CommentCaMarcheLayout({ children }: { children: React.ReactNode }) {
  return children;
}
