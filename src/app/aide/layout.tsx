import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Centre d\'aide — Mada Spot',
  description: 'Trouvez les réponses à vos questions sur Mada Spot : inscription, réservation, avis, fidélité et plus.',
  alternates: {
    canonical: '/aide',
  },
};

export default function AideLayout({
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
