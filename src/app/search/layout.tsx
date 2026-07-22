import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
