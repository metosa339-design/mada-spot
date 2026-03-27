import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recherche — Mada Spot',
  description:
    'Recherchez des restaurants, hôtels et attractions à Madagascar.',
  openGraph: {
    title: 'Recherche — Mada Spot',
    description:
      'Recherchez des restaurants, hôtels et attractions à Madagascar.',
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
