import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import TopAdBanner from '@/components/TopAdBanner';
import WeatherAlertBanner from '@/components/bons-plans/WeatherAlertBanner';

export const metadata: Metadata = {
  title: 'Bons Plans à Madagascar — Hôtels, Restaurants, Attractions | Mada Spot',
  description: 'Découvrez les meilleurs hôtels, restaurants, attractions et prestataires touristiques de Madagascar. Comparez les prix, consultez les avis et réservez en ligne.',
  keywords: ['bons plans Madagascar', 'tourisme Madagascar', 'hôtels Madagascar', 'restaurants Madagascar', 'attractions Madagascar', 'Nosy Be', 'Antananarivo', 'Sainte Marie', 'Diego Suarez', 'Antsirabe', 'parc national Madagascar', 'réservation en ligne Madagascar'],
  alternates: {
    canonical: '/bons-plans',
  },
  openGraph: {
    title: 'Bons Plans à Madagascar — Hôtels, Restaurants, Attractions | Mada Spot',
    description: 'Découvrez les meilleurs hôtels, restaurants, attractions et prestataires touristiques de Madagascar.',
    url: 'https://madaspot.com/bons-plans',
    images: [{ url: '/logo.png', width: 1200, height: 630, alt: 'Mada Spot — Bons Plans Madagascar' }],
  },
};

export default function BonsPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <TopAdBanner />
      <WeatherAlertBanner />
      <main id="main-content" className="min-h-screen bg-[#0a0a0f]">
        {children}
      </main>
      <Footer />
    </>
  );
}
