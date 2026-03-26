import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Restaurants à Madagascar — Mada Spot',
  description: 'Découvrez où manger à Madagascar : restaurants, street food et spécialités locales.',
  keywords: ['restaurants Madagascar', 'restaurant Antananarivo', 'gargote Madagascar', 'cuisine malgache', 'menu restaurant Madagascar', 'prix restaurant Ariary', 'street food Madagascar', 'lounge Antananarivo', 'gastronomie Madagascar'],
  alternates: {
    canonical: '/bons-plans/restaurants',
  },
  openGraph: {
    title: 'Restaurants à Madagascar — Mada Spot',
    description: 'Découvrez où manger à Madagascar : restaurants, street food et spécialités locales.',
    url: 'https://madaspot.mg/bons-plans/restaurants',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Restaurants à Madagascar — Mada Spot' }],
  },
};

export default function RestaurantsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Bons Plans', url: '/bons-plans' },
        { name: 'Restaurants', url: '/bons-plans/restaurants' },
      ]} />
      {children}
    </>
  );
}
