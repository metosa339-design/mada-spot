import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Attractions touristiques à Madagascar — Mada Spot',
  description: 'Explorez les plus beaux sites touristiques et attractions de Madagascar.',
  keywords: ['attractions Madagascar', 'parcs nationaux Madagascar', 'plages Madagascar', 'tourisme Madagascar', 'Isalo', 'Tsingy', 'Nosy Be', 'Andasibe', 'baobab', 'réserves naturelles', 'sites historiques Madagascar', 'excursions'],
  alternates: {
    canonical: '/bons-plans/attractions',
  },
  openGraph: {
    title: 'Attractions touristiques à Madagascar — Mada Spot',
    description: 'Explorez les plus beaux sites touristiques et attractions de Madagascar.',
    url: 'https://madaspot.mg/bons-plans/attractions',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Attractions touristiques Madagascar — Mada Spot' }],
  },
};

export default function AttractionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Bons Plans', url: '/bons-plans' },
        { name: 'Attractions', url: '/bons-plans/attractions' },
      ]} />
      {children}
    </>
  );
}
