import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Gestion de mon établissement — Mada Spot',
  description: 'Gérez les informations de votre établissement sur Mada Spot.',
};

export default function EstablishmentLayout({
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
