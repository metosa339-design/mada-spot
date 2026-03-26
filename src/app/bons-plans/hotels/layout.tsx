import type { Metadata } from 'next';
import BreadcrumbJsonLd from '@/components/bons-plans/BreadcrumbJsonLd';

export const metadata: Metadata = {
  title: 'Hôtels à Madagascar — Mada Spot',
  description: 'Trouvez les meilleurs hôtels et hébergements à Madagascar.',
  keywords: ['hôtels Madagascar', 'hébergement Madagascar', 'hôtel Antananarivo', 'hôtel Nosy Be', 'lodge Madagascar', 'resort Madagascar', 'prix hôtel Ariary', 'réservation hôtel Madagascar', 'Sainte-Marie'],
  alternates: {
    canonical: '/bons-plans/hotels',
  },
  openGraph: {
    title: 'Hôtels à Madagascar — Mada Spot',
    description: 'Trouvez les meilleurs hôtels et hébergements à Madagascar.',
    url: 'https://madaspot.mg/bons-plans/hotels',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Hôtels à Madagascar — Mada Spot' }],
  },
};

export default function HotelsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd items={[
        { name: 'Bons Plans', url: '/bons-plans' },
        { name: 'Hôtels', url: '/bons-plans/hotels' },
      ]} />
      {children}
    </>
  );
}
