import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Mon espace — Mada Spot',
  description: 'Gérez vos réservations, favoris et paramètres sur Mada Spot.',
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main-content" className="min-h-screen bg-[#0a0a0f]">
        {children}
      </main>
      <Footer />
    </>
  );
}
